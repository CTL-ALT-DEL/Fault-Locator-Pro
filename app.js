const AWG={14:2.525,16:4.016,18:6.385,22:16.14,24:25.67};
const alpha=.00393,JOBS="flp_v6_jobs",SETTINGS="flp_v6_settings";let gpsData=null;
const $=id=>document.getElementById(id);
function n(id){let v=parseFloat($(id).value);return Number.isFinite(v)?v:NaN}
function f(x,d=1){return Number.isFinite(x)?x.toFixed(d):"--"}
function calc(){
 let gauge=$("gauge").value,R=n("ohms"),F=n("temp"),L=n("length"),cal=n("cal")||0,w=$("warn");
 w.classList.add("hidden");w.textContent="";
 if(!R||R<=0){blank();return null}
 let C=(F-32)*5/9,tempFactor=1+alpha*(C-20),calFactor=1+cal/100,conductor=(AWG[gauge]/1000)*tempFactor*calFactor,loop=conductor*2,dist=R/loop,tempPct=(tempFactor-1)*100,tol=Math.max(dist*.03,2);
 $("distance").textContent=f(dist,1)+" ft";$("status").textContent=dist<15?"Low reading — verify meter zero":"Calculation ready";
 $("range").textContent=Math.max(0,dist-tol).toFixed(0)+"–"+(dist+tol).toFixed(0)+" ft";$("tempAdj").textContent=(tempPct>=0?"+":"")+f(tempPct,1)+"%";
 if(Number.isFinite(L)&&L>0){let pct=dist/L*100;$("remaining").textContent=f(L-dist,1)+" ft";$("fill").style.width=Math.max(0,Math.min(100,pct))+"%";$("barText").textContent=f(pct,1)+"% of cable length";if(dist>L)warn("Distance is beyond entered cable length. Check gauge, reading, length, and isolation.")}
 else{$("remaining").textContent="--";$("fill").style.width="0%";$("barText").textContent="Enter cable length for position bar."}
 if(R<.05)warn("Reading is very low. Zero meter leads if possible.");
 $("math").textContent=`Gauge: ${gauge} AWG solid copper
Measured loop resistance: ${R} Ω
Base resistance: ${AWG[gauge]} Ω / 1000 ft @ 68°F
Wire temperature: ${F}°F
Adjusted conductor resistance: ${f(conductor*1000,3)} Ω / 1000 ft
Loop resistance: ${f(loop*1000,3)} Ω / 1000 ft
Distance = ${R} ÷ ${f(loop,6)} = ${f(dist,2)} ft`;
 return{gauge,R,F,L,cal,C,tempFactor,calFactor,conductor,loop,dist,tempPct,tol};
}
function blank(){$("distance").textContent="-- ft";$("status").textContent="Enter wire gauge and meter reading";$("range").textContent="--";$("remaining").textContent="--";$("tempAdj").textContent="0.0%";$("fill").style.width="0%";$("math").textContent=""}
function warn(m){$("warn").textContent=m;$("warn").classList.remove("hidden")}
function screen(s){document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));$(s).classList.add("active");document.querySelector(`[data-screen="${s}"]`).classList.add("active");if(s==="history")renderHistory()}
function capture(date=true){let c=calc();if(!c)return null;return{id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),date:date?new Date().toLocaleString():"",customer:$("customer").value.trim(),cableId:$("cableId").value.trim(),notes:$("notes").value.trim(),gps:gpsData,...c}}
function report(j){let c=j||capture(false);if(!c)return"Fault Locator: no valid calculation.";return`Fault Locator Report
Date: ${c.date||new Date().toLocaleString()}
Customer/Site: ${c.customer||"Not entered"}
Cable ID/Location: ${c.cableId||"Not entered"}
Gauge: ${c.gauge} AWG
Loop Resistance: ${c.R} Ω
Wire Temperature: ${c.F}°F
Cable Length: ${Number.isFinite(c.L)?c.L+" ft":"Not entered"}
Estimated Fault: ${f(c.dist,1)} ft from test end
Estimated Range: ${Math.max(0,c.dist-c.tol).toFixed(0)}–${(c.dist+c.tol).toFixed(0)} ft
GPS: ${c.gps?`${c.gps.lat.toFixed(6)}, ${c.gps.lon.toFixed(6)} ± ${Math.round(c.gps.accuracy)}m`:"Not saved"}
Notes: ${c.notes||"None"}`;}
function jobs(){try{return JSON.parse(localStorage.getItem(JOBS)||"[]")}catch{return[]}}function setJobs(j){localStorage.setItem(JOBS,JSON.stringify(j))}
function save(){let j=capture(true);if(!j){toast("Enter reading first");return}let a=jobs();a.unshift(j);setJobs(a.slice(0,50));toast("Saved")}
function renderHistory(){let a=jobs(),list=$("historyList");if(!a.length){list.className="empty";list.textContent="No saved jobs yet.";return}list.className="";list.innerHTML=a.map(j=>`<div class="jobitem"><div class="jobtop"><div><b>${esc(j.customer||"Untitled Job")}</b><div class="jobmeta">${esc(j.date)} • ${esc(j.cableId||"No cable ID")} • ${j.gauge} AWG</div></div><div class="jobdist">${f(j.dist,1)} ft</div></div><div class="jobbuttons"><button onclick="loadJob('${j.id}')">Load</button><button onclick="copyText(report(j));toast('Copied')">Copy</button></div></div>`).join("")}
function loadJob(id){let j=jobs().find(x=>x.id===id);if(!j)return;$("gauge").value=j.gauge;$("ohms").value=j.R;$("temp").value=j.F;$("length").value=Number.isFinite(j.L)?j.L:"";$("customer").value=j.customer||"";$("cableId").value=j.cableId||"";$("notes").value=j.notes||"";gpsData=j.gps||null;gpsStatus();calc();screen("calc")}
function getGPS(){if(!navigator.geolocation){toast("GPS unavailable");return}$("gpsStatus").textContent="Getting GPS...";navigator.geolocation.getCurrentPosition(p=>{gpsData={lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy,time:new Date().toISOString()};gpsStatus();toast("GPS saved")},e=>{$("gpsStatus").textContent="GPS denied or unavailable."},{enableHighAccuracy:true,timeout:10000,maximumAge:0})}
function gpsStatus(){$("gpsStatus").textContent=gpsData?`GPS saved: ${gpsData.lat.toFixed(6)}, ${gpsData.lon.toFixed(6)} ± ${Math.round(gpsData.accuracy)}m`:"GPS not saved."}
function copyText(t){navigator.clipboard&&navigator.clipboard.writeText(t)}
function toast(t){$("toast").textContent=t;$("toast").classList.remove("hidden");setTimeout(()=>$("toast").classList.add("hidden"),1200)}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function saveSettings(){localStorage.setItem(SETTINGS,JSON.stringify({glove:$("glove").checked,cal:$("cal").value}))}
function loadSettings(){try{let s=JSON.parse(localStorage.getItem(SETTINGS)||"{}");$("glove").checked=!!s.glove;document.body.classList.toggle("glove",!!s.glove);if(s.cal!==undefined)$("cal").value=s.cal}catch{}}
document.addEventListener("DOMContentLoaded",()=>{
 $("refRows").innerHTML=Object.entries(AWG).map(([g,r])=>`<tr><td>${g} AWG</td><td>${r.toFixed(3)}</td><td>${(r*2).toFixed(3)}</td></tr>`).join("");
 loadSettings();calc();gpsStatus();
 document.querySelectorAll("input,select,textarea").forEach(x=>x.addEventListener("input",()=>{calc();if(x.id==="cal")saveSettings()}));
 document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>screen(b.dataset.screen));
 document.querySelectorAll(".chips button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".chips button").forEach(x=>x.classList.remove("picked"));b.classList.add("picked");$("temp").value=b.dataset.temp;calc()});
 $("clear").onclick=()=>{["ohms","length"].forEach(id=>$(id).value="");calc()};$("save").onclick=save;$("copy").onclick=()=>{copyText(report());toast("Copied")};$("gps").onclick=getGPS;
 $("clearHistory").onclick=()=>{if(confirm("Clear saved jobs?")){setJobs([]);renderHistory()}};$("glove").onchange=e=>{document.body.classList.toggle("glove",e.target.checked);saveSettings()};
 if("serviceWorker"in navigator)navigator.serviceWorker.register("service-worker.js").catch(()=>{});
});
