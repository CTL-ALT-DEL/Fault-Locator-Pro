(() => {
  "use strict";
  const AWG = {"14":2.525,"16":4.016,"18":6.385,"22":16.14,"24":25.67};
  const ALPHA = 0.00393;
  const JOBS = "fault_locator_v7_jobs";
  const SETTINGS = "fault_locator_v7_settings";
  let gpsData = null;
  const $ = id => document.getElementById(id);
  const read = id => {
    const value = parseFloat($(id).value);
    return Number.isFinite(value) ? value : NaN;
  };
  const fmt = (value, digits = 1) => Number.isFinite(value) ? value.toFixed(digits) : "--";
  const id = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random());

  function calculate() {
    const gauge = $("gauge").value;
    const ohms = read("ohms");
    const tempF = read("temp");
    const length = read("length");
    const calibration = read("calibration") || 0;
    $("warning").classList.add("hidden");
    $("warning").textContent = "";

    if (!Number.isFinite(ohms) || ohms <= 0) {
      blank();
      return null;
    }

    const tempC = (tempF - 32) * 5 / 9;
    const tempFactor = 1 + ALPHA * (tempC - 20);
    const calFactor = 1 + calibration / 100;
    const conductorPerFt = (AWG[gauge] / 1000) * tempFactor * calFactor;
    const loopPerFt = conductorPerFt * 2;
    const distance = ohms / loopPerFt;
    const tempAdjust = (tempFactor - 1) * 100;
    const tolerance = Math.max(distance * 0.03, 2);

    $("distance").textContent = fmt(distance, 1) + " ft";
    $("status").textContent = distance < 15 ? "Low reading — verify meter zero" : "Calculation ready";
    $("range").textContent = Math.max(0, distance - tolerance).toFixed(0) + "–" + (distance + tolerance).toFixed(0) + " ft";
    $("tempAdj").textContent = (tempAdjust >= 0 ? "+" : "") + fmt(tempAdjust, 1) + "%";

    if (Number.isFinite(length) && length > 0) {
      const percent = distance / length * 100;
      $("remaining").textContent = fmt(length - distance, 1) + " ft";
      $("fill").style.width = Math.max(0, Math.min(100, percent)) + "%";
      $("barText").textContent = fmt(percent, 1) + "% of cable length";
      if (distance > length) warn("Distance is beyond entered cable length. Check gauge, reading, length, temperature, and isolation.");
    } else {
      $("remaining").textContent = "--";
      $("fill").style.width = "0%";
      $("barText").textContent = "Enter cable length for position bar.";
    }

    if (ohms < 0.05) warn("Reading is very low. Zero meter leads if possible.");

    $("math").textContent = `Gauge: ${gauge} AWG solid copper
Measured loop resistance: ${ohms} Ω
Base resistance: ${AWG[gauge]} Ω / 1000 ft @ 68°F
Wire temperature: ${tempF}°F
Temperature factor: ${fmt(tempFactor, 5)}
Calibration factor: ${fmt(calFactor, 5)}
Adjusted conductor resistance: ${fmt(conductorPerFt * 1000, 3)} Ω / 1000 ft
Loop resistance: ${fmt(loopPerFt * 1000, 3)} Ω / 1000 ft
Distance = ${ohms} ÷ ${fmt(loopPerFt, 6)} = ${fmt(distance, 2)} ft`;

    return {id:id(), date:new Date().toLocaleString(), gauge, ohms, tempF, length, calibration, distance, tolerance, tempAdjust, gps:gpsData};
  }

  function blank() {
    $("distance").textContent = "-- ft";
    $("status").textContent = "Enter gauge and meter reading";
    $("range").textContent = "--";
    $("remaining").textContent = "--";
    $("tempAdj").textContent = "0.0%";
    $("fill").style.width = "0%";
    $("math").textContent = "";
  }

  function warn(message) {
    $("warning").textContent = message;
    $("warning").classList.remove("hidden");
  }

  function screen(name) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    $(name).classList.add("active");
    document.querySelector(`[data-screen="${name}"]`).classList.add("active");
    if (name === "history") renderHistory();
  }

  function capture() {
    const calc = calculate();
    if (!calc) return null;
    return {...calc, id:id(), date:new Date().toLocaleString(), customer:$("customer").value.trim(), cableId:$("cableId").value.trim(), notes:$("notes").value.trim(), gps:gpsData};
  }

  function report(job) {
    const item = job || capture();
    if (!item) return "Fault Locator: no valid calculation.";
    const gps = item.gps ? `${item.gps.lat.toFixed(6)}, ${item.gps.lon.toFixed(6)} ± ${Math.round(item.gps.accuracy)}m` : "Not saved";
    return `Fault Locator Report
Date: ${item.date}
Customer/Site: ${item.customer || "Not entered"}
Cable ID/Location: ${item.cableId || "Not entered"}
Gauge: ${item.gauge} AWG solid copper
Loop Resistance: ${item.ohms} Ω
Wire Temperature: ${item.tempF}°F
Cable Length: ${Number.isFinite(item.length) ? item.length + " ft" : "Not entered"}
Estimated Fault: ${fmt(item.distance, 1)} ft from test end
Estimated Range: ${Math.max(0, item.distance - item.tolerance).toFixed(0)}–${(item.distance + item.tolerance).toFixed(0)} ft
Temperature Adjustment: ${(item.tempAdjust >= 0 ? "+" : "") + fmt(item.tempAdjust, 1)}%
GPS: ${gps}
Notes: ${item.notes || "None"}`;
  }

  function getJobs() {
    try { return JSON.parse(localStorage.getItem(JOBS) || "[]"); } catch { return []; }
  }
  function setJobs(jobs) { localStorage.setItem(JOBS, JSON.stringify(jobs)); }

  function saveJob() {
    const job = capture();
    if (!job) { toast("Enter a valid reading first."); return; }
    const jobs = getJobs();
    jobs.unshift(job);
    setJobs(jobs.slice(0, 50));
    toast("Job saved.");
  }

  function renderHistory() {
    const jobs = getJobs();
    const list = $("historyList");
    if (!jobs.length) {
      list.className = "empty";
      list.textContent = "No saved jobs yet.";
      return;
    }
    list.className = "";
    list.innerHTML = jobs.map(job => `<div class="jobitem">
      <div class="jobtop"><div><b>${escapeHtml(job.customer || "Untitled Job")}</b><div class="jobmeta">${escapeHtml(job.date)} • ${escapeHtml(job.cableId || "No cable ID")} • ${escapeHtml(job.gauge)} AWG</div></div><div class="jobdist">${fmt(job.distance, 1)} ft</div></div>
      <div class="jobbuttons"><button type="button" data-load="${job.id}">Load</button><button type="button" data-copy="${job.id}">Copy</button></div>
    </div>`).join("");
    list.querySelectorAll("[data-load]").forEach(button => button.addEventListener("click", () => loadJob(button.dataset.load)));
    list.querySelectorAll("[data-copy]").forEach(button => button.addEventListener("click", () => {
      const job = getJobs().find(j => j.id === button.dataset.copy);
      copyText(report(job));
      toast("Report copied.");
    }));
  }

  function loadJob(jobId) {
    const job = getJobs().find(j => j.id === jobId);
    if (!job) return;
    $("gauge").value = job.gauge;
    $("ohms").value = job.ohms;
    $("temp").value = job.tempF;
    $("length").value = Number.isFinite(job.length) ? job.length : "";
    $("calibration").value = job.calibration || 0;
    $("customer").value = job.customer || "";
    $("cableId").value = job.cableId || "";
    $("notes").value = job.notes || "";
    gpsData = job.gps || null;
    updateGps();
    calculate();
    screen("test");
  }

  function getGps() {
    if (!navigator.geolocation) { toast("GPS unavailable."); return; }
    $("gpsStatus").textContent = "Getting GPS location...";
    navigator.geolocation.getCurrentPosition(pos => {
      gpsData = {lat:pos.coords.latitude, lon:pos.coords.longitude, accuracy:pos.coords.accuracy, time:new Date().toISOString()};
      updateGps();
      toast("GPS saved.");
    }, () => {
      $("gpsStatus").textContent = "GPS denied or unavailable.";
    }, {enableHighAccuracy:true, timeout:10000, maximumAge:0});
  }

  function updateGps() {
    $("gpsStatus").textContent = gpsData ? `GPS saved: ${gpsData.lat.toFixed(6)}, ${gpsData.lon.toFixed(6)} ± ${Math.round(gpsData.accuracy)}m` : "GPS not saved.";
  }

  function copyText(text) {
    if (navigator.clipboard) navigator.clipboard.writeText(text);
  }

  function toast(message) {
    $("toast").textContent = message;
    $("toast").classList.remove("hidden");
    setTimeout(() => $("toast").classList.add("hidden"), 1400);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
  }

  function loadSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem(SETTINGS) || "{}");
      $("largeMode").checked = !!settings.largeMode;
      document.body.classList.toggle("large", !!settings.largeMode);
      if (settings.calibration !== undefined) $("calibration").value = settings.calibration;
    } catch {}
  }
  function saveSettings() {
    localStorage.setItem(SETTINGS, JSON.stringify({largeMode:$("largeMode").checked, calibration:$("calibration").value}));
  }

  function init() {
    $("refRows").innerHTML = Object.entries(AWG).map(([g, r]) => `<tr><td>${g} AWG</td><td>${r.toFixed(3)}</td><td>${(r * 2).toFixed(3)}</td></tr>`).join("");
    loadSettings();
    calculate();
    updateGps();

    document.querySelectorAll("input,select,textarea").forEach(el => el.addEventListener("input", () => {
      calculate();
      if (el.id === "calibration") saveSettings();
    }));
    document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => screen(tab.dataset.screen)));
    document.querySelectorAll(".chips button").forEach(button => button.addEventListener("click", () => {
      document.querySelectorAll(".chips button").forEach(b => b.classList.remove("picked"));
      button.classList.add("picked");
      $("temp").value = button.dataset.temp;
      calculate();
    }));

    $("clearBtn").addEventListener("click", () => { $("ohms").value = ""; $("length").value = ""; calculate(); });
    $("saveBtn").addEventListener("click", saveJob);
    $("copyBtn").addEventListener("click", () => { copyText(report()); toast("Report copied."); });
    $("gpsBtn").addEventListener("click", getGps);
    $("clearHistoryBtn").addEventListener("click", () => { if (confirm("Clear saved jobs?")) { setJobs([]); renderHistory(); } });
    $("largeMode").addEventListener("change", e => { document.body.classList.toggle("large", e.target.checked); saveSettings(); });

    if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }

  document.addEventListener("DOMContentLoaded", init);
})();
