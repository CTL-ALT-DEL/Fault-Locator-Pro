(() => {
  "use strict";
  const AWG = {"14":2.525,"16":4.016,"18":6.385,"22":16.14,"24":25.67};
  const WIRE_DB = [
    {id:"awg14", name:"14 AWG Solid Copper", category:"Standard Copper", ohms1000:2.525, gauge:"14", tags:"14 awg copper solid"},
    {id:"awg16", name:"16 AWG Solid Copper", category:"Standard Copper", ohms1000:4.016, gauge:"16", tags:"16 awg copper solid"},
    {id:"awg18", name:"18 AWG Solid Copper", category:"Standard Copper", ohms1000:6.385, gauge:"18", tags:"18 awg copper solid"},
    {id:"awg22", name:"22 AWG Solid Copper", category:"Standard Copper", ohms1000:16.14, gauge:"22", tags:"22 awg copper solid"},
    {id:"awg24", name:"24 AWG Solid Copper", category:"Standard Copper", ohms1000:25.67, gauge:"24", tags:"24 awg copper solid"},
    {id:"fplr18", name:"18 AWG Fire Alarm Cable / FPLR-FPLP", category:"Fire Alarm", ohms1000:6.5, gauge:"18", tags:"18/2 18 awg fplr fplp fire alarm slc nac"},
    {id:"fplr16", name:"16 AWG Fire Alarm Cable / FPLR-FPLP", category:"Fire Alarm", ohms1000:4.1, gauge:"16", tags:"16/2 16 awg fplr fplp fire alarm nac slc"},
    {id:"fplr14", name:"14 AWG Fire Alarm Cable / FPLR-FPLP", category:"Fire Alarm", ohms1000:2.6, gauge:"14", tags:"14/2 14 awg fplr fplp fire alarm nac"},
    {id:"fplr12", name:"12 AWG Fire Alarm Cable / FPLR-FPLP", category:"Fire Alarm", ohms1000:1.8, gauge:"custom", tags:"12/2 12 awg fplr fplp fire alarm nac"},
    {id:"protectowire_phsc", name:"Protectowire PHSC Digital Linear Heat Detector", category:"Protectowire", ohmsPerFt:0.185, gauge:"custom", tags:"protectowire phsc linear heat detector steel"},
    {id:"protectowire_plr", name:"Protectowire PLR Low Resistance Linear Heat Detector", category:"Protectowire", ohmsPerFt:0.058, gauge:"custom", tags:"protectowire plr low resistance linear heat detector"},
    {id:"protectowire_cti", name:"Protectowire CTI Linear Heat Detector", category:"Protectowire", ohmsPerFt:0.282, gauge:"custom", tags:"protectowire cti linear heat detector"},

    {id:"cat3_24", name:"CAT3 / Telephone 24 AWG Pair", category:"Telephone / Data", ohms1000:25.67, gauge:"24", tags:"cat3 telephone station wire 24 awg voice data"},
    {id:"cat5_24", name:"CAT5 / CAT5e 24 AWG Pair", category:"Network / Data", ohms1000:25.67, gauge:"24", tags:"cat5 cat5e network data ethernet 24 awg"},
    {id:"cat6_23", name:"CAT6 23 AWG Pair", category:"Network / Data", ohms1000:20.36, gauge:"custom", tags:"cat6 network data ethernet 23 awg"},
    {id:"security_22", name:"22 AWG Security / Control Cable", category:"Security / Controls", ohms1000:16.14, gauge:"22", tags:"22/2 22/4 security control alarm station"},
    {id:"security_18", name:"18 AWG Security / Control Cable", category:"Security / Controls", ohms1000:6.385, gauge:"18", tags:"18/2 18/4 security control alarm power"},
    {id:"thermostat_18", name:"18 AWG Thermostat / HVAC Cable", category:"Thermostat / HVAC", ohms1000:6.385, gauge:"18", tags:"thermostat hvac 18/2 18/5 18/8 control"}
  ];
  let customWire = null;
  const ALPHA = 0.00393;
  const JOBS = "fault_locator_v8_jobs";
  const SETTINGS = "fault_locator_v8_settings";
  let gpsData = null;
  const $ = id => document.getElementById(id);
  const read = id => {
    const value = parseFloat($(id).value);
    return Number.isFinite(value) ? value : NaN;
  };
  const fmt = (value, digits = 1) => Number.isFinite(value) ? value.toFixed(digits) : "--";
  const id = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random());


  function getSelectedWireName() {
    return customWire ? customWire.name : $("gauge").value + " AWG Solid Copper";
  }

  function updateSelectedWireDisplay() {
    if ($("selectedWireName")) $("selectedWireName").textContent = getSelectedWireName();
  }

  function nextJobNumber() {
    const count = getJobs().length + 1;
    return String(count).padStart(4, "0");
  }

  function updateJobNumber() {
    if ($("jobNumber")) $("jobNumber").textContent = nextJobNumber();
  }

  function calculate() {
    updateFaultIcon();
    updateSelectedWireDisplay();
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
    const baseOhms1000 = customWire ? customWire.ohms1000 : AWG[gauge];
    const tempApplies = customWire ? customWire.temperatureCompensated : true;
    const effectiveTempFactor = tempApplies ? tempFactor : 1;
    const conductorPerFt = (baseOhms1000 / 1000) * effectiveTempFactor * calFactor;
    const loopPerFt = customWire && customWire.isLoopValue ? conductorPerFt : conductorPerFt * 2;
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
Wire selected: ${customWire ? customWire.name : gauge + " AWG solid copper"}
Base resistance: ${customWire ? customWire.ohms1000 : AWG[gauge]} Ω / 1000 ft
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
    return {...calc, id:id(), date:new Date().toLocaleString(), jobNumber: $("jobNumber") ? $("jobNumber").textContent : "", customer:$("customer").value.trim(), cableId:$("cableId").value.trim(), notes:$("notes").value.trim(), gps:gpsData};
  }

  function report(job) {
    const item = job || capture();
    if (!item) return "Fault Locator: no valid calculation.";
    const gps = item.gps ? `${item.gps.lat.toFixed(6)}, ${item.gps.lon.toFixed(6)} ± ${Math.round(item.gps.accuracy)}m` : "Not saved";
    return `Fault Locator Report
Date: ${item.date}
Job Number: ${item.jobNumber || "Not assigned"}
Customer/Site: ${item.customer || "Not entered"}
Cable ID/Location: ${item.cableId || "Not entered"}
Wire: ${item.wireName || item.gauge + " AWG solid copper"}
Fault Type: ${faultTypeText(item.faultType || "short")}
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
    updateJobNumber();
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
    $("gauge").value = AWG[job.gauge] ? job.gauge : "22";
    customWire = job.wireName && !AWG[job.gauge] ? {name: job.wireName, ohms1000: job.customOhms1000 || 16.14, temperatureCompensated:false} : null;
    if ($("faultType")) $("faultType").value = job.faultType || "short";
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
    setTimeout(() => $("ohms").focus(), 150);
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
    const link = $("mapLink");
    if (!gpsData) {
      $("gpsStatus").textContent = "GPS not saved.";
      if (link) {
        link.classList.add("hidden");
        link.removeAttribute("href");
      }
      return;
    }
    $("gpsStatus").textContent = `GPS saved: ${gpsData.lat.toFixed(6)}, ${gpsData.lon.toFixed(6)} ± ${Math.round(gpsData.accuracy)}m`;
    if (link) {
      link.href = `https://maps.apple.com/?ll=${gpsData.lat},${gpsData.lon}`;
      link.classList.remove("hidden");
    }
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


  function faultTypeText(value) {
    const map = {
      short: "Dead Short",
      ground: "Ground Fault",
      partial: "Partial / Resistive Fault",
      open: "Open / Unknown"
    };
    return map[value] || "Dead Short";
  }

  function updateFaultIcon() {
    const value = $("faultType") ? $("faultType").value : "short";
    const iconMap = {short:"⚡", ground:"⏚", partial:"◒", open:"?"};
    const label = faultTypeText(value).toUpperCase();
    if ($("faultIcon")) $("faultIcon").textContent = iconMap[value] || "⚡";
    if ($("faultLabel")) $("faultLabel").textContent = label;
  }

  function renderWireLookup() {
    const query = ($("wireSearch").value || "").trim().toLowerCase();
    const tokens = query.split(/\s+/).filter(Boolean);

    const results = WIRE_DB.filter(w => {
      const haystack = (w.name + " " + w.category + " " + w.tags).toLowerCase();
      return tokens.length === 0 || tokens.every(token => haystack.includes(token));
    }).slice(0, 20);

    $("wireResults").innerHTML = results.map(w => {
      const ohms1000 = w.ohms1000 || (w.ohmsPerFt * 1000);
      const note = w.ohmsPerFt
        ? `${w.ohmsPerFt} Ω/ft (${ohms1000.toFixed(1)} Ω/1000 ft equivalent)`
        : `${ohms1000} Ω/1000 ft`;
      const haystack = (w.name + " " + w.category + " " + w.tags).toLowerCase();
      const recommended = query && tokens.every(token => haystack.includes(token));
      return `<div class="wire-card ${recommended ? "recommended" : ""}">
        <div class="wire-name">${escapeHtml(w.name)}</div>
        <div class="wire-meta">${escapeHtml(note)}</div>
        <span class="wire-pill">${escapeHtml(w.category)}</span>
        <button type="button" data-wire="${escapeHtml(w.id)}">Use This Wire</button>
      </div>`;
    }).join("") || `<div class="no-results">No matching wire found. Try fewer words or use Custom Wire below.</div>`;

    $("wireResults").querySelectorAll("[data-wire]").forEach(button => {
      button.addEventListener("click", () => useWire(button.dataset.wire));
    });
  }

  function useWire(wireId) {
    const w = WIRE_DB.find(item => item.id === wireId);
    if (!w) return;
    if (w.gauge && AWG[w.gauge]) {
      $("gauge").value = w.gauge;
      customWire = null;
    } else {
      const ohms1000 = w.ohms1000 || (w.ohmsPerFt * 1000);
      customWire = {
        name: w.name,
        ohms1000,
        isLoopValue: Boolean(w.ohmsPerFt),
        temperatureCompensated: false
      };
    }
    updateSelectedWireDisplay();
    calculate();
    toast("Wire selected.");
    screen("test");
  }

  function applyCustomWire() {
    const ohms1000 = read("customOhms1000");
    if (!Number.isFinite(ohms1000) || ohms1000 <= 0) {
      toast("Enter valid Ω / 1000 ft.");
      return;
    }
    customWire = {
      name: $("customWireName").value.trim() || "Custom Wire",
      ohms1000,
      isLoopValue: false,
      temperatureCompensated: false
    };
    updateSelectedWireDisplay();
    calculate();
    toast("Custom wire selected.");
    screen("test");
  }


  function runSmartSelector() {
    const system = $("smartSystem").value;
    const gauge = $("smartGauge").value;
    let q = "";
    if (system === "fire") q += "fire alarm fplr ";
    if (system === "protectowire") q += "protectowire ";
    if (system === "security") q += "security control ";
    if (system === "network") q += "cat network data ";
    if (system === "thermostat") q += "thermostat hvac ";
    if (system === "standard") q += "solid copper ";
    if (gauge) q += gauge + " awg ";
    $("wireSearch").value = q.trim();
    renderWireLookup();
    toast("Matches updated.");
  }

  function init() {
    $("refRows").innerHTML = Object.entries(AWG).map(([g, r]) => `<tr><td>${g} AWG</td><td>${r.toFixed(3)}</td><td>${(r * 2).toFixed(3)}</td></tr>`).join("");
    renderWireLookup();
    updateFaultIcon();
    updateSelectedWireDisplay();
    updateJobNumber();
    loadSettings();
    calculate();
    updateGps();

    document.querySelectorAll("input,select,textarea").forEach(el => el.addEventListener("input", () => {
      if (el.id === "gauge") customWire = null;
      updateSelectedWireDisplay();
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

    $("chooseWireBtn").addEventListener("click", () => screen("ref"));
    $("focusOhms").addEventListener("click", () => { $("ohms").focus(); $("ohms").select(); });
    $("clearBtn").addEventListener("click", () => { $("ohms").value = ""; $("length").value = ""; calculate(); $("ohms").focus(); });
    $("saveBtn").addEventListener("click", saveJob);
    $("jobSaveBtn").addEventListener("click", saveJob);
    $("wireSearch").addEventListener("input", renderWireLookup);
    $("applyCustomWire").addEventListener("click", applyCustomWire);
    $("smartSearchBtn").addEventListener("click", runSmartSelector);
    document.querySelectorAll("[data-wirequick]").forEach(button => {
      button.addEventListener("click", () => {
        $("wireSearch").value = button.dataset.wirequick;
        renderWireLookup();
      });
    });
    $("faultType").addEventListener("change", () => { updateFaultIcon(); calculate(); });
    $("faultType").addEventListener("input", () => { updateFaultIcon(); calculate(); });
    $("copyBtn").addEventListener("click", () => { copyText(report()); toast("Report copied."); });
    $("gpsBtn").addEventListener("click", getGps);
    $("clearHistoryBtn").addEventListener("click", () => { if (confirm("Clear saved jobs?")) { setJobs([]); renderHistory(); } });
    $("largeMode").addEventListener("change", e => { document.body.classList.toggle("large", e.target.checked); saveSettings(); });

    if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }

  document.addEventListener("DOMContentLoaded", init);
})();
