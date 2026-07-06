import { calculateDistance } from "./core/calculator.js";
import { WIRE_DB, findWire, searchWires } from "./data/wires.js";
import { resistorRows } from "./data/reference.js";
import { diagnoseReading } from "./features/diagnostics.js";
import { saveJob, getJobs, clearJobs } from "./features/jobs.js";
import { renderTimeline } from "./features/timeline.js";
import { renderCableMap, addCableSegment } from "./features/cableBuilder.js";
import { $, $$, toast, setActiveScreen, renderDistanceBar } from "./ui/dom.js";

let selectedWire = findWire("awg22");

const FAVORITES_KEY = "fault_locator_pro_2_favorites";
const RECENT_WIRES_KEY = "fault_locator_pro_2_recent_wires";

const DEFAULT_FAVORITES = ["fpl18-2", "fpl18-4", "shield18", "protect-phsc"];
const PRESETS = {
  Notifier: ["notifier-18-2", "fpl18-2", "fpl18-4", "shield18"],
  Siemens: ["siemens-18-2", "fpl18-2", "fpl16-2", "shield18"],
  EST: ["est-18-2", "fpl18-2", "fpl18-4", "shield22"],
  Simplex: ["simplex-18-2", "fpl18-2", "fpl16-2", "nac12-2"],
  FireLite: ["fpl18-2", "fpl18-4", "fpl16-2", "shield18"],
  Potter: ["fpl18-2", "fpl18-4", "shield22", "sec22"],
};

const state = {
  lastResult: null,
  gps: null,
};

function readNumber(id) {
  const value = parseFloat($(id)?.value);
  return Number.isFinite(value) ? value : NaN;
}

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getFavorites() {
  const value = readJson(FAVORITES_KEY, DEFAULT_FAVORITES);
  return Array.isArray(value) && value.length ? value.slice(0, 4) : DEFAULT_FAVORITES;
}

function setFavorite(slotIndex) {
  const favs = getFavorites();
  favs[slotIndex] = selectedWire.id;
  writeJson(FAVORITES_KEY, favs);
  renderWireFavorites();
  toast(`Favorite ${slotIndex + 1} set`);
}

function addRecentWire(wireId) {
  const recents = readJson(RECENT_WIRES_KEY, []);
  const next = [wireId, ...recents.filter(id => id !== wireId)].slice(0, 10);
  writeJson(RECENT_WIRES_KEY, next);
  renderRecentWires();
}

function formatWireName(name) {
  const text = String(name || "");
  return text.replace(/^(\d{2}(?:\/\d)?(?:\s+AWG)?)(\s+)/i, "$1<br>");
}

function updateWireUI() {
  $("wire-name").innerHTML = formatWireName(selectedWire.name);
  const detail = $("wire-detail");
  if (detail) {
    const resistance = selectedWire.ohmsPerFt
      ? `${selectedWire.ohmsPerFt} Ω/ft`
      : `${selectedWire.ohms1000} Ω/1000 ft`;
    detail.textContent = `${selectedWire.category} • ${selectedWire.gauge || "custom"} • ${resistance}`;
  }
}

function selectWireById(id) {
  selectedWire = findWire(id) || selectedWire;
  addRecentWire(selectedWire.id);
  updateWireUI();
  $("wire-search").value = "";
  $("wire-panel").classList.add("hidden");
  updateCalculation();
  toast("Wire selected");
}

function renderWireFavorites() {
  const container = $("wire-favorites");
  if (!container) return;
  const favorites = getFavorites();
  container.innerHTML = favorites.map((id, index) => {
    const wire = findWire(id);
    return wire ? `<button type="button" data-favorite-wire="${wire.id}" data-fav-slot="${index}">${formatWireName(wire.name.replace(" fire alarm", ""))}</button>` : "";
  }).join("");
  $$("[data-favorite-wire]", container).forEach(button => {
    let timer = null;
    const slot = Number(button.dataset.favSlot);
    const start = () => { timer = setTimeout(() => setFavorite(slot), 700); };
    const cancel = () => { if (timer) clearTimeout(timer); };
    button.addEventListener("touchstart", start, { passive: true });
    button.addEventListener("mousedown", start);
    button.addEventListener("touchend", cancel);
    button.addEventListener("mouseup", cancel);
    button.addEventListener("mouseleave", cancel);
    button.addEventListener("click", () => selectWireById(button.dataset.favoriteWire));
  });
}

function renderRecentWires() {
  const container = $("wire-recents");
  if (!container) return;
  const recents = readJson(RECENT_WIRES_KEY, []).map(id => findWire(id)).filter(Boolean);
  container.innerHTML = recents.length
    ? recents.map(wire => `<button type="button" data-recent-wire="${wire.id}">${formatWireName(wire.name)}</button>`).join("")
    : `<div class="muted mini-muted">No recent wires yet.</div>`;
  $$("[data-recent-wire]", container).forEach(button => {
    button.addEventListener("click", () => selectWireById(button.dataset.recentWire));
  });
}

function renderWirePresets() {
  const container = $("wire-presets");
  if (!container) return;
  container.innerHTML = Object.keys(PRESETS).map(name => `<button type="button" data-preset="${name}">${name}</button>`).join("");
  $$("[data-preset]", container).forEach(button => {
    button.addEventListener("click", () => {
      writeJson(FAVORITES_KEY, PRESETS[button.dataset.preset]);
      renderWireFavorites();
      toast(`${button.dataset.preset} preset loaded`);
    });
  });
}

function renderWireResults(query = "") {
  const rows = searchWires(query);
  const container = $("wire-results");
  container.innerHTML = rows.map(wire => `
    <div class="wire-card">
      <div class="name">${formatWireName(wire.name)}</div>
      <div class="meta">${wire.category} • ${wire.ohmsPerFt ? wire.ohmsPerFt + " Ω/ft" : wire.ohms1000 + " Ω/1000 ft"}</div>
      <button type="button" data-wire-id="${wire.id}">Use</button>
    </div>
  `).join("") || `<div class="muted">No matching wire.</div>`;

  $$("[data-wire-id]", container).forEach(button => {
    button.addEventListener("click", () => selectWireById(button.dataset.wireId));
  });
}

function setFaultDisplay(diagnosis) {
  $("fault-icon").textContent = diagnosis.icon;
  $("fault-label").textContent = diagnosis.label;
  $("guidance").innerHTML = `<span class="${diagnosis.level}">${diagnosis.label}:</span> ${diagnosis.message}`;
  $("confidence").textContent = diagnosis.confidence ? `${diagnosis.confidence}%` : "--";
  $("health").textContent = diagnosis.health ? `${diagnosis.health}/100` : "--";
}

function updateCalculation() {
  const ohms = readNumber("input-ohms");
  const length = readNumber("input-length");
  const tempF = readNumber("input-temp") || 68;
  const mode = $("input-mode").value;
  const lengthBasis = Number.isFinite(length) && length > 0 ? length : 500;

  $("lcd-ohms").textContent = `${Number.isFinite(ohms) ? ohms.toFixed(2) : "0.00"} Ω`;
  $("basis").textContent = Number.isFinite(length) && length > 0 ? `${length} ft` : "500 ft";

  const calculation = calculateDistance({ ohms, wire: selectedWire, tempF });
  const diagnosis = diagnoseReading({ ohms, mode, wire: selectedWire, lengthFeet: lengthBasis, calculation });

  setFaultDisplay(diagnosis);

  if (!calculation.valid) {
    $("distance-readout").innerHTML = "SELECT WIRE<br>ENTER OHMS";
    $("distance-readout").classList.add("idle");
    renderDistanceBar($("distance-bar"), 0);
    state.lastResult = null;
    return;
  }

  $("distance-readout").textContent = `${calculation.distanceFeet.toFixed(1)} ft`;
  $("distance-readout").classList.remove("idle");
  renderDistanceBar($("distance-bar"), Math.min(1, calculation.distanceFeet / lengthBasis));

  state.lastResult = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    date: new Date().toLocaleString(),
    timestamp: Date.now(),
    ohms,
    wireId: selectedWire.id,
    wireName: selectedWire.name,
    mode,
    lengthFeet: Number.isFinite(length) ? length : null,
    tempF,
    distanceFeet: calculation.distanceFeet,
    diagnosis: diagnosis.label,
    confidence: diagnosis.confidence,
    health: diagnosis.health,
    gps: state.gps,
  };
}

function renderJobs() {
  const jobs = getJobs();
  renderTimeline($("timeline-chart"), $("timeline-insight"), jobs);
  renderTimeline($("timeline-chart-full"), $("timeline-detail"), jobs, { detail: true });
  const list = $("job-list");
  list.innerHTML = jobs.length ? jobs.map(job => `
    <div class="job-item">
      <b>${job.wireName}</b>
      <div class="muted">${job.date} • ${job.diagnosis}</div>
      <div class="job-distance">${job.distanceFeet.toFixed(1)} ft</div>
    </div>
  `).join("") : `<div class="muted">No saved jobs.</div>`;
}

function renderResistorTable() {
  $("resistor-table").innerHTML = resistorRows.map(row => `
    <tr>
      <td><span class="sw ${row.className}"></span>${row.color}</td>
      <td>${row.digit}</td>
      <td>${row.multiplier}</td>
      <td>${row.tolerance}</td>
    </tr>
  `).join("");
}

function boot() {
  updateWireUI();
  renderWirePresets();
  renderWireFavorites();
  renderRecentWires();
  renderWireResults("");
  renderResistorTable();
  renderCableMap($("cable-map"));
  updateCalculation();

  $("wire-button").addEventListener("click", () => {
    $("wire-panel").classList.toggle("hidden");
    renderWireResults($("wire-search").value);
  });

  $("wire-search").addEventListener("input", () => renderWireResults($("wire-search").value));

  $$("[data-wire-filter]").forEach(button => {
    button.addEventListener("click", () => {
      $$("[data-wire-filter]").forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      $("wire-search").value = button.dataset.wireFilter;
      renderWireResults(button.dataset.wireFilter);
    });
  });

  ["input-ohms", "input-length", "input-temp"].forEach(id => {
    $(id).addEventListener("input", updateCalculation);
    $(id).addEventListener("change", updateCalculation);
  });

  $("mode-toggle").addEventListener("click", () => {
    const nextMode = $("input-mode").value === "pair" ? "ground" : "pair";
    $("input-mode").value = nextMode;
    $("mode-toggle").classList.toggle("ground", nextMode === "ground");
    $("mode-toggle").classList.toggle("short", nextMode === "pair");
    $("mode-toggle").setAttribute("aria-pressed", nextMode === "ground" ? "true" : "false");
    if (navigator.vibrate) navigator.vibrate(25);
    updateCalculation();
  });

  $("button-clear").addEventListener("click", () => {
    $("input-ohms").value = "";
    $("input-length").value = "";
    updateCalculation();
  });

  $("button-save").addEventListener("click", () => {
    if (!state.lastResult) {
      toast("Enter a valid reading first");
      return;
    }
    saveJob(state.lastResult);
    toast("Job saved");
  });

  $("clear-jobs").addEventListener("click", () => {
    if (confirm("Clear saved jobs?")) {
      clearJobs();
      renderJobs();
    }
  });
$("add-segment").addEventListener("click", () => {
    const name = $("segment-name").value.trim();
    const feet = readNumber("segment-feet");
    if (!name || !Number.isFinite(feet) || feet <= 0) {
      toast("Enter name and feet");
      return;
    }
    addCableSegment({ name, feet });
    $("segment-name").value = "";
    $("segment-feet").value = "";
    renderCableMap($("cable-map"));
  });

  $$("[data-screen]").forEach(button => {
    button.addEventListener("click", () => {
      setActiveScreen(button.dataset.screen);
      if (button.dataset.screen === "jobs") renderJobs();
      if (button.dataset.screen !== "help") $$("#screen-help details").forEach(item => item.open = false);
    });
  });

  $("version-button").addEventListener("click", () => {
    $("revision-modal").classList.remove("hidden");
  });

  $("close-revisions").addEventListener("click", () => {
    $("revision-modal").classList.add("hidden");
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
}


function hideSplash() {
  const splash = document.getElementById("splash");
  if (splash) setTimeout(() => splash.classList.add("hide"), 1800);
}

document.addEventListener("DOMContentLoaded", () => {
  try {
    boot();
  } catch (error) {
    console.error("Startup error:", error);
    const guidance = document.getElementById("guidance");
    if (guidance) guidance.textContent = "Startup warning. Reload the app if controls do not respond.";
  } finally {
    hideSplash();
  }
});

