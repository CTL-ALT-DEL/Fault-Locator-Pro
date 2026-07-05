(() => {
"use strict";

const AWG = {"14":2.525,"16":4.016,"18":6.385,"22":16.14,"24":25.67};
const ALPHA = 0.00393;
const JOBS = "fault_locator_v18_jobs";
const SETTINGS = "fault_locator_v18_settings";
let selectedWire = {name:"22 AWG Solid Copper", gauge:"22", ohms1000:16.14, isLoopValue:false, tempComp:true};
let gpsData = null;
let photoName = "";
const FAVS = "fault_locator_v18_favs";

const WIRE_DB = [
 {id:"awg14",name:"14 AWG Solid Copper",category:"Standard Copper",ohms1000:2.525,gauge:"14",tags:"14 awg copper solid standard"},
 {id:"awg16",name:"16 AWG Solid Copper",category:"Standard Copper",ohms1000:4.016,gauge:"16",tags:"16 awg copper solid standard"},
 {id:"awg18",name:"18 AWG Solid Copper",category:"Standard Copper",ohms1000:6.385,gauge:"18",tags:"18 awg copper solid standard"},
 {id:"awg22",name:"22 AWG Solid Copper",category:"Standard Copper",ohms1000:16.14,gauge:"22",tags:"22 awg copper solid standard"},
 {id:"awg24",name:"24 AWG Solid Copper",category:"Standard Copper",ohms1000:25.67,gauge:"24",tags:"24 awg copper solid standard"},
 {id:"fire18",name:"18/2 Fire Alarm FPLR / FPLP",category:"Fire Alarm",ohms1000:6.5,gauge:"18",tags:"fire fire alarm fplr fplp 18/2 18 awg slc nac red cable"},
 {id:"fire16",name:"16/2 Fire Alarm FPLR / FPLP",category:"Fire Alarm",ohms1000:4.1,gauge:"16",tags:"fire fire alarm fplr fplp 16/2 16 awg nac red cable"},
 {id:"fire14",name:"14/2 Fire Alarm FPLR / FPLP",category:"Fire Alarm",ohms1000:2.6,gauge:"14",tags:"fire fire alarm fplr fplp 14/2 14 awg nac red cable"},
 {id:"fire12",name:"12/2 Fire Alarm FPLR / FPLP",category:"Fire Alarm",ohms1000:1.8,gauge:"custom",tags:"fire fire alarm fplr fplp 12/2 12 awg nac red cable"},
 {id:"protectowire_phsc",name:"Protectowire PHSC Linear Heat Detector",category:"Protectowire",ohmsPerFt:0.185,gauge:"custom",tags:"protectowire phsc linear heat detector"},
 {id:"protectowire_plr",name:"Protectowire PLR Low Resistance Linear Heat Detector",category:"Protectowire",ohmsPerFt:0.058,gauge:"custom",tags:"protectowire plr low resistance linear heat detector"},
 {id:"protectowire_cti",name:"Protectowire CTI Linear Heat Detector",category:"Protectowire",ohmsPerFt:0.282,gauge:"custom",tags:"protectowire cti linear heat detector"},
 {id:"security22",name:"22 AWG Security / Control Cable",category:"Security / Controls",ohms1000:16.14,gauge:"22",tags:"security control alarm 22/2 22/4 22 awg"},
 {id:"security18",name:"18 AWG Security / Control Cable",category:"Security / Controls",ohms1000:6.385,gauge:"18",tags:"security control alarm 18/2 18/4 18 awg"},
 {id:"thermostat18",name:"18 AWG Thermostat / HVAC Cable",category:"Thermostat / HVAC",ohms1000:6.385,gauge:"18",tags:"thermostat hvac 18/2 18/5 18/8 18 awg"},
 {id:"cat5",name:"CAT5 / CAT5e 24 AWG Pair",category:"Network / Data",ohms1000:25.67,gauge:"24",tags:"cat cat5 cat5e ethernet network data 24 awg"},
 {id:"cat6",name:"CAT6 23 AWG Pair",category:"Network / Data",ohms1000:20.36,gauge:"custom",tags:"cat cat6 ethernet network data 23 awg"}
];

const $ = id => document.getElementById(id);
const read = id => { const v = parseFloat($(id).value); return Number.isFinite(v) ? v : NaN; };
const fmt = (v,d=1) => Number.isFinite(v) ? v.toFixed(d) : "--";
const makeId = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now()+"-"+Math.random());

function expectedLoopOhms(){
  const tempF = read("temp");
  const lengthEntered = read("length");
  const basis = $("lengthBasis") ? $("lengthBasis").value : "entered";
  const length = Number.isFinite(lengthEntered) && lengthEntered > 0 ? lengthEntered : 500;
  const diagnosis = diagnose(ohms);
  updateDiagnosisUI(diagnosis);

  const tempC = (tempF - 32) * 5 / 9;
  const tempFactor = selectedWire.tempComp ? (1 + ALPHA * (tempC - 20)) : 1;
  const calFactor = 1 + (read("calibration") || 0) / 100;
  const conductorPerFt = (selectedWire.ohms1000 / 1000) * tempFactor * calFactor;
  const loopPerFt = selectedWire.isLoopValue ? conductorPerFt : conductorPerFt * 2;
  return {length, loopPerFt, expected: loopPerFt * length, estimated: !(Number.isFinite(lengthEntered) && lengthEntered > 0) || basis === "estimate500"};
}

function diagnose(ohms){
  const mode = $("testMode") ? $("testMode").value : "pair";
  if (!Number.isFinite(ohms) || ohms <= 0) {
    return {icon:"✓", label:"NORMAL", level:"good", guidance:"No resistance reading entered. With no measured short, status is normal. Enter a stable ohm reading to calculate distance or get troubleshooting guidance."};
  }

  const e = expectedLoopOhms();
  const lowLimit = e.expected * 0.80;
  const highLimit = e.expected * 1.20;

  if (mode === "ground") {
    if (ohms < 1000) return {icon:"⏚", label:"GROUND FAULT", level:"bad", guidance:"Low resistance to ground suggests a ground fault. Disconnect field devices and test each conductor to ground. Inspect metal boxes, conduit edges, staples, wet locations, shields, drain wires, and device bases."};
    return {icon:"✓", label:"NORMAL", level:"good", guidance:"Ground test does not show a low-resistance fault. If symptoms remain, test conductor-to-conductor and check for stray voltage before using resistance mode."};
  }

  if (ohms < 0.05) return {icon:"⚡", label:"NEAR SHORT", level:"bad", guidance:"Very low resistance usually means a dead short near the test end or meter leads not zeroed. Short your probes, use REL/Zero if available, then inspect the first boxes and terminations."};
  if (ohms >= lowLimit && ohms <= highLimit) return {icon:"✓", label:"NORMAL", level:"good", guidance:`Reading is within expected range for ${e.estimated ? "an estimated 500 ft run" : "the entered cable length"}. This may be a normal loop/short at the far end for testing, not a field fault.`};
  if (ohms < lowLimit) return {icon:"⚡", label:"DEAD SHORT", level:"bad", guidance:"Reading is lower than expected for the cable length. The app will estimate distance to the short. Isolate the cable, remove devices/EOL parts, and inspect near the calculated location."};
  return {icon:"◒", label:"RESISTIVE / OPEN", level:"warn", guidance:"Reading is higher than expected. Look for corrosion, water, loose splices, damaged conductors, wrong wire selection, bad devices still connected, or a partial/open fault rather than a clean short."};
}

function updateSelectedWireUI(){
  $("selectedWire").textContent = selectedWire.name;
  if (selectedWire.gauge && AWG[selectedWire.gauge]) $("gauge").value = selectedWire.gauge;
}

function renderWireResults(query=""){
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const results = WIRE_DB.filter(w => {
    const hay = (w.name+" "+w.category+" "+w.tags).toLowerCase();
    return tokens.length === 0 || tokens.every(t => hay.includes(t));
  }).slice(0,18);

  $("wireResults").innerHTML = results.length ? results.map(w => {
    const ohms1000 = w.ohms1000 || w.ohmsPerFt * 1000;
    const note = w.ohmsPerFt ? `${w.ohmsPerFt} Ω/ft (${ohms1000.toFixed(1)} Ω/1000 ft equivalent)` : `${ohms1000} Ω/1000 ft`;
    return `<div class="wire-card">
      <div class="wire-name">${esc(w.name)}</div>
      <div class="wire-meta">${esc(note)}</div>
      <span class="wire-pill">${esc(w.category)}</span>
      <button type="button" data-wire="${esc(w.id)}">Use This Wire</button>
    </div>`;
  }).join("") : `<div class="no-results">No matching wire found. Try fewer words or use Custom Wire.</div>`;

  $("wireResults").querySelectorAll("[data-wire]").forEach(btn => {
    btn.addEventListener("click", () => chooseWire(btn.dataset.wire));
  });
}

function chooseWire(id){
  const w = WIRE_DB.find(x => x.id === id);
  if (!w) return;
  selectedWire = {
    name:w.name,
    gauge:w.gauge,
    ohms1000:w.ohms1000 || w.ohmsPerFt * 1000,
    isLoopValue:Boolean(w.ohmsPerFt),
    tempComp:!Boolean(w.ohmsPerFt)
  };
  updateSelectedWireUI();
  $("wirePanel").classList.add("hidden");
  calculate();
  toast("Wire selected");
  setTimeout(()=>$("ohms").focus(),150);
}

function updateSegments(distance){
  const box = $("lcdSegments");
  if (!box) return;
  if (!box.children.length) {
    for (let i=0;i<20;i++){
      const s=document.createElement("span");
      box.appendChild(s);
    }
  }
  const lengthEntered = read("length");
  const basis = Number.isFinite(lengthEntered) && lengthEntered > 0 ? lengthEntered : 500;
  const pct = Number.isFinite(distance) && distance > 0 ? Math.max(0,Math.min(1,distance/basis)) : 0;
  const onCount = Math.round(pct * 20);
  [...box.children].forEach((s,i)=>s.classList.toggle("on", i < onCount));
}

function updateDiagnosisUI(d){
  $("faultIcon").textContent = d.icon;
  $("faultLabel").textContent = d.label;
  /* bottom status removed in v16 */
  $("guidanceText").innerHTML = `<span class="${d.level === "good" ? "good" : d.level === "bad" ? "bad" : "warn-text"}">${d.label}:</span> ${d.guidance}`;
  const conf = d.level === "good" ? 88 : d.level === "bad" ? 92 : 65;
  if($("confidenceFill")) $("confidenceFill").style.width = conf + "%";
  if($("confidencePct")) $("confidencePct").textContent = conf + "%";
  const health = d.level === "good" ? 96 : d.level === "bad" ? 30 : 55;
  if($("healthScore")) $("healthScore").textContent = Number.isFinite(read("ohms")) && read("ohms")>0 ? health : "--";
  if($("healthText")) $("healthText").textContent = Number.isFinite(read("ohms")) && read("ohms")>0 ? (health>85?"Cable appears healthy.":health>60?"Investigate possible issues.":"Likely fault or unsafe reading.") : "No reading yet.";
}

function calculate(){
  updateSelectedWireUI();
  const ohms = read("ohms");
  if($("ohmMini")) $("ohmMini").textContent = (Number.isFinite(ohms)?fmt(ohms,2):"0.00") + " Ω";
  const tempF = read("temp");
  const length = read("length");
  const calibration = read("calibration") || 0;
  $("warning").classList.add("hidden");
  $("warning").textContent = "";

  if (!Number.isFinite(ohms) || ohms <= 0) {
    const d = diagnose(ohms);
    updateDiagnosisUI(d);
    blank();
    return null;
  }

  const diagnosis = diagnose(ohms);
  updateDiagnosisUI(diagnosis);

  const tempC = (tempF - 32) * 5 / 9;
  const tempFactor = selectedWire.tempComp ? (1 + ALPHA * (tempC - 20)) : 1;
  const calFactor = 1 + calibration / 100;
  const conductorPerFt = (selectedWire.ohms1000 / 1000) * tempFactor * calFactor;
  const loopPerFt = selectedWire.isLoopValue ? conductorPerFt : conductorPerFt * 2;
  const distance = ohms / loopPerFt;
  const tempAdjust = (tempFactor - 1) * 100;
  const tolerance = Math.max(distance * .03, 2);

  $("distance").textContent = fmt(distance,1)+" ft";
  updateSegments(distance);
  /* bottom status removed in v16 */
  $("range").textContent = Math.max(0,distance-tolerance).toFixed(0)+"–"+(distance+tolerance).toFixed(0)+" ft";
  $("tempAdj").textContent = (tempAdjust>=0?"+":"")+fmt(tempAdjust,1)+"%";

  if (Number.isFinite(length) && length > 0) {
    const pct = distance / length * 100;
    $("remaining").textContent = fmt(length-distance,1)+" ft";
    $("fill").style.width = Math.max(0,Math.min(100,pct))+"%";
    $("pin").style.left = Math.max(0,Math.min(100,pct))+"%";
    $("barText").textContent = fmt(pct,1)+"% of cable length";
    $("farLabel").textContent = length+" ft";
    if (distance > length) warn("Distance is beyond entered cable length. Check wire selection, reading, length, and isolation.");
  } else {
    $("remaining").textContent = "--";
    $("fill").style.width = "0%";
    $("pin").style.left = "0%";
    $("barText").textContent = "Enter cable length for position bar.";
    $("farLabel").textContent = "Far End";
  }

  if (ohms < .05) warn("Reading is very low. Zero meter leads if possible.");

  $("math").textContent = `Wire: ${selectedWire.name}
Fault Status: ${diagnosis.label}
Measured loop resistance: ${ohms} Ω
Base resistance: ${selectedWire.ohms1000} Ω / 1000 ft
Wire temperature: ${tempF}°F
Temperature factor: ${fmt(tempFactor,5)}
Loop resistance per foot: ${fmt(loopPerFt,6)} Ω/ft
Distance = ${ohms} ÷ ${fmt(loopPerFt,6)} = ${fmt(distance,2)} ft`;

  return {id:makeId(),date:new Date().toLocaleString(),wireName:selectedWire.name,gauge:selectedWire.gauge,ohms,tempF,length,calibration,distance,tolerance,tempAdjust,faultType:diagnosis.label,gps:gpsData};
}

function blank(){
  $("distance").textContent = "-- ft";
  /* bottom status removed */
  $("range").textContent = "--";
  $("remaining").textContent = "--";
  $("tempAdj").textContent = "0.0%";
  $("fill").style.width = "0%";
  $("pin").style.left = "0%";
  $("math").textContent = "";
  updateSegments(0);
}

function warn(msg){ $("warning").textContent = msg; $("warning").classList.remove("hidden"); }

function capture(){
  const c = calculate();
  if (!c) return null;
  return {...c,customer:$("customer").value.trim(),cableId:$("cableId").value.trim(),notes:$("notes").value.trim()};
}

function report(job){
  const item = job || capture();
  if (!item) return "Fault Locator: no valid calculation.";
  const gps = item.gps ? `${item.gps.lat.toFixed(6)}, ${item.gps.lon.toFixed(6)} ± ${Math.round(item.gps.accuracy)}m` : "Not saved";
  return `Fault Locator Report
Date: ${item.date}
Customer/Site: ${item.customer || "Not entered"}
Cable ID/Location: ${item.cableId || "Not entered"}
Wire: ${item.wireName}
Fault Type: ${item.faultType}
Loop Resistance: ${item.ohms} Ω
Wire Temperature: ${item.tempF}°F
Cable Length: ${Number.isFinite(item.length) ? item.length + " ft" : "Not entered"}
Estimated Fault: ${fmt(item.distance,1)} ft from test end
Estimated Range: ${Math.max(0,item.distance-item.tolerance).toFixed(0)}–${(item.distance+item.tolerance).toFixed(0)} ft
GPS: ${gps}
Notes: ${item.notes || "None"}`;
}

function getJobs(){ try{return JSON.parse(localStorage.getItem(JOBS)||"[]");}catch{return[];} }
function setJobs(j){ localStorage.setItem(JOBS,JSON.stringify(j)); }

function saveJob(){
  const job = capture();
  if (!job) { toast("Enter a valid reading first"); return; }
  const jobs = getJobs();
  jobs.unshift(job);
  setJobs(jobs.slice(0,50));
  toast("Job saved");
}

function renderHistory(){
  const jobs = getJobs();
  const list = $("historyList");
  if (!jobs.length) { list.className="empty"; list.textContent="No saved jobs yet."; return; }
  list.className="";
  list.innerHTML = jobs.map(j => `<div class="jobitem">
    <div class="jobtop"><div><b>${esc(j.customer||"Untitled Job")}</b><div class="jobmeta">${esc(j.date)} • ${esc(j.cableId||"No cable ID")} • ${esc(j.faultType||"Fault")}</div></div><div class="jobdist">${fmt(j.distance,1)} ft</div></div>
    <div class="jobbuttons"><button type="button" data-load="${esc(j.id)}">Load</button><button type="button" data-copy="${esc(j.id)}">Copy</button></div>
  </div>`).join("");
  list.querySelectorAll("[data-copy]").forEach(b => b.addEventListener("click",()=>{ const j=getJobs().find(x=>x.id===b.dataset.copy); copyText(report(j)); toast("Copied"); }));
  list.querySelectorAll("[data-load]").forEach(b => b.addEventListener("click",()=>loadJob(b.dataset.load)));
}

function loadJob(id){
  const j = getJobs().find(x=>x.id===id);
  if (!j) return;
  selectedWire = {name:j.wireName || "22 AWG Solid Copper", gauge:j.gauge || "22", ohms1000:AWG[j.gauge] || 16.14, isLoopValue:false, tempComp:true};
  $("ohms").value = j.ohms;
  $("temp").value = j.tempF;
  $("length").value = Number.isFinite(j.length) ? j.length : "";
  $("customer").value = j.customer || "";
  $("cableId").value = j.cableId || "";
  $("notes").value = j.notes || "";
  gpsData = j.gps || null;
  updateGps();
  updateSelectedWireUI();
  calculate();
  screen("test");
}

function screen(name){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  $(name).classList.add("active");
  document.querySelector(`[data-screen="${name}"]`).classList.add("active");
  if (name === "history") renderHistory();
}

function getGps(){
  if (!navigator.geolocation) { toast("GPS unavailable"); return; }
  $("gpsStatus").textContent = "Getting GPS...";
  navigator.geolocation.getCurrentPosition(p=>{
    gpsData = {lat:p.coords.latitude, lon:p.coords.longitude, accuracy:p.coords.accuracy, time:new Date().toISOString()};
    updateGps();
    toast("GPS saved");
  },()=>{$("gpsStatus").textContent="GPS denied or unavailable.";},{enableHighAccuracy:true,timeout:10000,maximumAge:0});
}

function updateGps(){
  const link = $("mapLink");
  if (!gpsData) { $("gpsStatus").textContent="GPS not saved."; link.classList.add("hidden"); return; }
  $("gpsStatus").textContent = `GPS saved: ${gpsData.lat.toFixed(6)}, ${gpsData.lon.toFixed(6)} ± ${Math.round(gpsData.accuracy)}m`;
  link.href = `https://maps.apple.com/?ll=${gpsData.lat},${gpsData.lon}`;
  link.classList.remove("hidden");
}

function copyText(t){ if (navigator.clipboard) navigator.clipboard.writeText(t); }
function toast(t){ $("toast").textContent=t; $("toast").classList.remove("hidden"); setTimeout(()=>$("toast").classList.add("hidden"),1300); }
function esc(s){ return String(s).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch])); }

function loadSettings(){
  try{ const s=JSON.parse(localStorage.getItem(SETTINGS)||"{}"); $("largeMode").checked=!!s.largeMode; document.body.classList.toggle("large",!!s.largeMode); if(s.calibration!==undefined)$("calibration").value=s.calibration; }catch{}
}
function saveSettings(){ localStorage.setItem(SETTINGS,JSON.stringify({largeMode:$("largeMode").checked,calibration:$("calibration").value})); }


function boot(){
  const lines=["Initializing...","Loading Wire Database...","Calibrating LCD...","READY"];
  let i=0; const timer=setInterval(()=>{ if($("bootLine")) $("bootLine").textContent=lines[i]||"READY"; i++; if(i>lines.length){clearInterval(timer); if($("boot")) $("boot").classList.add("hide");}},350);
}
function getFavs(){try{return JSON.parse(localStorage.getItem(FAVS)||'["fire18","protectowire_phsc","cat5","security22"]')}catch{return[]}}
function setFavs(f){localStorage.setItem(FAVS,JSON.stringify(f))}
function renderFavs(){ if(!$("favoritesList")) return; const favs=getFavs().map(id=>WIRE_DB.find(w=>w.id===id)).filter(Boolean); $("favoritesList").innerHTML=favs.length?favs.map(w=>wireCard(w,true)).join(""):'<div class="empty">No favorites yet.</div>'; bindWireButtons($("favoritesList")); }
function wireCard(w,fav=false){ const ohms1000=w.ohms1000||(w.ohmsPerFt*1000); const note=w.ohmsPerFt?`${w.ohmsPerFt} Ω/ft (${ohms1000.toFixed(1)} Ω/1000 ft equivalent)`:`${ohms1000} Ω/1000 ft`; return `<div class="wire-card"><div class="wire-name">${escapeHtml(w.name)}</div><div class="wire-meta">${escapeHtml(note)}</div><span class="wire-pill">${escapeHtml(w.category)}</span><button type="button" data-wire="${escapeHtml(w.id)}">Use This Wire</button><button type="button" data-fav="${escapeHtml(w.id)}">${fav?'★ Favorite':'☆ Add Favorite'}</button></div>`; }
function bindWireButtons(root){ root.querySelectorAll("[data-wire]").forEach(button=>button.addEventListener("click",()=>useWire(button.dataset.wire))); root.querySelectorAll("[data-fav]").forEach(button=>button.addEventListener("click",()=>toggleFav(button.dataset.fav))); }
function toggleFav(id){ let f=getFavs(); f=f.includes(id)?f.filter(x=>x!==id):[id,...f]; setFavs(f.slice(0,12)); renderWireLookup(); renderFavs(); }
function beep(){try{const ctx=new (window.AudioContext||window.webkitAudioContext)(),osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=880;gain.gain.value=.06;osc.connect(gain);gain.connect(ctx.destination);osc.start();setTimeout(()=>{osc.stop();ctx.close()},140)}catch{toast("Beep unavailable")}}

function init(){
  $("refRows").innerHTML = WIRE_DB.map(w=>`<tr><td>${esc(w.name)}</td><td>${esc(w.ohmsPerFt ? w.ohmsPerFt+" Ω/ft" : w.ohms1000+" Ω/1000 ft")}</td></tr>`).join("");
  loadSettings();
  updateSelectedWireUI();
  renderWireResults("");
  calculate();
  updateGps();

  $("wireChooser").addEventListener("click",()=>{ $("wirePanel").classList.toggle("hidden"); renderWireResults($("wireSearch").value); });
  $("wireSearch").addEventListener("input",()=>renderWireResults($("wireSearch").value));
  document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{ $("wireSearch").value=b.dataset.filter; renderWireResults(b.dataset.filter); }));
  document.querySelectorAll("[data-temp]").forEach(b=>b.addEventListener("click",()=>{ document.querySelectorAll("[data-temp]").forEach(x=>x.classList.remove("picked")); b.classList.add("picked"); $("temp").value=b.dataset.temp; calculate(); }));

  $("gauge").addEventListener("change",()=>{ selectedWire={name:$("gauge").value+" AWG Solid Copper",gauge:$("gauge").value,ohms1000:AWG[$("gauge").value],isLoopValue:false,tempComp:true}; updateSelectedWireUI(); calculate(); });
  $("testMode").addEventListener("change",calculate);
  $("lengthBasis").addEventListener("change",calculate);
  document.querySelectorAll("input,textarea").forEach(el=>el.addEventListener("input",()=>{ calculate(); if(el.id==="calibration")saveSettings(); }));
  $("useCustom").addEventListener("click",()=>{ const oh=read("customOhms"); if(!Number.isFinite(oh)||oh<=0){toast("Enter valid Ω / 1000 ft");return;} selectedWire={name:$("customName").value.trim()||"Custom Wire",gauge:"custom",ohms1000:oh,isLoopValue:false,tempComp:false}; updateSelectedWireUI(); calculate(); toast("Custom wire selected"); });
  $("clearBtn").addEventListener("click",()=>{ $("ohms").value=""; $("length").value=""; calculate(); $("ohms").focus(); });
  $("saveBtn").addEventListener("click",saveJob);
  $("jobSaveBtn").addEventListener("click",saveJob);
  $("copyBtn").addEventListener("click",()=>{ copyText(report()); toast("Report copied"); });
  $("gpsBtn").addEventListener("click",getGps);
  $("clearHistoryBtn").addEventListener("click",()=>{ if(confirm("Clear saved jobs?")){ setJobs([]); renderHistory(); }});
  $("largeMode").addEventListener("change",e=>{ document.body.classList.toggle("large",e.target.checked); saveSettings(); });
  document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>screen(t.dataset.screen)));
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(()=>{});
}

document.addEventListener("DOMContentLoaded",init);
})();
