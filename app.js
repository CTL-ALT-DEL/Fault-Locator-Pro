const AWG = {14:2.525,16:4.016,18:6.385,22:16.14,24:25.67};
const alpha = 0.00393;
const el = id => document.getElementById(id);

function num(id){ return parseFloat(el(id).value); }
function fmt(n, d=1){ return Number.isFinite(n) ? n.toFixed(d) : "--"; }

function calculate(){
  const gauge = el("gauge").value;
  const R = num("resistance");
  const F = num("temperature");
  const L = num("length");
  const cal = num("calibration") || 0;
  const warning = el("warning");
  warning.classList.add("hidden");
  warning.textContent = "";

  if(!Number.isFinite(R) || R <= 0){
    el("distance").textContent = "-- ft";
    el("quality").textContent = "Enter resistance reading";
    el("fill").style.width = "0%"; el("pin").style.left = "0%";
    el("percentText").textContent = "Cable percentage appears when length is entered.";
    el("remaining").textContent = "--"; el("range").textContent = "--"; el("math").textContent = "";
    return;
  }

  const C = (F - 32) * 5/9;
  const basePerFt = AWG[gauge] / 1000;
  const tempFactor = 1 + alpha * (C - 20);
  const calFactor = 1 + cal/100;
  const adjustedPerFt = basePerFt * tempFactor * calFactor;
  const loopPerFt = adjustedPerFt * 2;
  const distance = R / loopPerFt;
  const tempPct = (tempFactor - 1) * 100;
  const tolerance = Math.max(distance * 0.03, 2);

  el("distance").textContent = `${fmt(distance,1)} ft`;
  el("tempAdjust").textContent = `${tempPct >= 0 ? "+" : ""}${fmt(tempPct,1)}%`;
  el("range").textContent = `${Math.max(0,distance-tolerance).toFixed(0)}–${(distance+tolerance).toFixed(0)} ft`;
  el("quality").textContent = distance < 15 ? "Low reading — verify lead zero" : "Calculation ready";

  if(Number.isFinite(L) && L > 0){
    const pct = (distance / L) * 100;
    const clamped = Math.max(0, Math.min(100, pct));
    el("fill").style.width = `${clamped}%`;
    el("pin").style.left = `${clamped}%`;
    el("percentText").textContent = `${fmt(pct,1)}% of entered cable length`;
    el("remaining").textContent = `${fmt(L-distance,1)} ft`;
    if(distance > L){
      warning.textContent = "Measurement calculates beyond entered cable length. Verify gauge, length, temperature, isolation, and meter zero.";
      warning.classList.remove("hidden");
    }
  } else {
    el("fill").style.width = "0%";
    el("pin").style.left = "0%";
    el("percentText").textContent = "Cable percentage appears when length is entered.";
    el("remaining").textContent = "--";
  }

  if(R < 0.05){
    warning.textContent = "Reading is very low. Short meter leads and use REL/Zero if available before measuring.";
    warning.classList.remove("hidden");
  }

  el("math").textContent =
`Gauge: ${gauge} AWG solid copper
Base resistance @ 68°F: ${AWG[gauge]} Ω / 1000 ft
Temperature: ${F}°F (${fmt(C,1)}°C)
Temperature factor: ${fmt(tempFactor,5)}
Calibration factor: ${fmt(calFactor,5)}
Adjusted conductor resistance: ${fmt(adjustedPerFt*1000,3)} Ω / 1000 ft
Loop resistance: ${fmt(loopPerFt*1000,3)} Ω / 1000 ft
Loop resistance per foot: ${fmt(loopPerFt,6)} Ω/ft

Distance = measured loop resistance ÷ loop Ω/ft
Distance = ${R} ÷ ${fmt(loopPerFt,6)}
Distance = ${fmt(distance,2)} ft`;
}

function switchScreen(name){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  el(`screen-${name}`).classList.add("active");
  document.querySelector(`.tab[data-screen="${name}"]`).classList.add("active");
}

function buildRef(){
  el("refTable").innerHTML = Object.entries(AWG).map(([g,r]) =>
    `<tr><td>${g} AWG</td><td>${r.toFixed(3)}</td><td>${(r*2).toFixed(3)}</td></tr>`
  ).join("");
}

function copyResult(){
  const text = `Fault Locator Pro
Gauge: ${el("gauge").value} AWG
Measured loop resistance: ${el("resistance").value} Ω
Wire temp: ${el("temperature").value} °F
Cable length: ${el("length").value || "not entered"} ft
Estimated fault: ${el("distance").textContent}
Remaining: ${el("remaining").textContent}
Range: ${el("range").textContent}`;
  navigator.clipboard?.writeText(text);
  el("copyBtn").textContent = "Copied";
  setTimeout(()=>el("copyBtn").textContent="Copy Result",900);
}

function clearForm(){
  el("resistance").value = ""; el("length").value = ""; calculate();
}

document.addEventListener("DOMContentLoaded",()=>{
  buildRef(); calculate();
  document.querySelectorAll("input,select").forEach(x=>x.addEventListener("input",calculate));
  document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>switchScreen(t.dataset.screen)));
  document.querySelectorAll(".temp-presets button").forEach(b=>b.addEventListener("click",()=>{
    document.querySelectorAll(".temp-presets button").forEach(x=>x.classList.remove("selected"));
    b.classList.add("selected"); el("temperature").value=b.dataset.temp; calculate();
  }));
  el("clearBtn").addEventListener("click",clearForm);
  el("copyBtn").addEventListener("click",copyResult);
  el("gloveMode").addEventListener("change", e=>document.body.classList.toggle("glove", e.target.checked));
  if("serviceWorker" in navigator){ navigator.serviceWorker.register("service-worker.js").catch(()=>{}); }
});
