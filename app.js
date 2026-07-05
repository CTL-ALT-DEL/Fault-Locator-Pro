(()=>{"use strict";
const AWG={14:2.525,16:4.016,18:6.385,22:16.14,24:25.67},ALPHA=.00393,JOBS="flp_v26_jobs";
let wire={name:"22 AWG Solid Copper",gauge:"22",ohms1000:16.14,isLoop:false,temp:true},gps=null,clickMuted=false;
const DB=[
{id:"14",name:"14 AWG Solid Copper",cat:"Copper",ohms1000:2.525,gauge:"14",tags:"14 awg copper"},
{id:"16",name:"16 AWG Solid Copper",cat:"Copper",ohms1000:4.016,gauge:"16",tags:"16 awg copper"},
{id:"18",name:"18 AWG Solid Copper",cat:"Copper",ohms1000:6.385,gauge:"18",tags:"18 awg copper"},
{id:"22",name:"22 AWG Solid Copper",cat:"Copper",ohms1000:16.14,gauge:"22",tags:"22 awg copper"},
{id:"24",name:"24 AWG Solid Copper",cat:"Copper",ohms1000:25.67,gauge:"24",tags:"24 awg copper"},
{id:"fire18",name:"18/2 Fire Alarm FPLR",cat:"Fire",ohms1000:6.5,gauge:"18",tags:"fire fplr fplp 18/2"},
{id:"fire16",name:"16/2 Fire Alarm FPLR",cat:"Fire",ohms1000:4.1,gauge:"16",tags:"fire fplr fplp 16/2"},

{id:"fire18_4",name:"18/4 Fire Alarm FPLR",cat:"Fire",ohms1000:6.5,gauge:"18",tags:"fire fplr fplp 18/4 4 conductor speaker strobe red"},
{id:"fire16_4",name:"16/4 Fire Alarm FPLR",cat:"Fire",ohms1000:4.1,gauge:"16",tags:"fire fplr fplp 16/4 4 conductor speaker strobe red"},
{id:"fire14_4",name:"14/4 Fire Alarm FPLR",cat:"Fire",ohms1000:2.6,gauge:"14",tags:"fire fplr fplp 14/4 4 conductor speaker strobe red"},
{id:"fire18_plenum",name:"18/2 Fire Alarm FPLP Plenum",cat:"Fire",ohms1000:6.5,gauge:"18",tags:"fire fplp plenum 18/2 red"},
{id:"fire16_plenum",name:"16/2 Fire Alarm FPLP Plenum",cat:"Fire",ohms1000:4.1,gauge:"16",tags:"fire fplp plenum 16/2 red"},
{id:"fire14_plenum",name:"14/2 Fire Alarm FPLP Plenum",cat:"Fire",ohms1000:2.6,gauge:"14",tags:"fire fplp plenum 14/2 red"},
{id:"fire18_4_plenum",name:"18/4 Fire Alarm FPLP Plenum",cat:"Fire",ohms1000:6.5,gauge:"18",tags:"fire fplp plenum 18/4 4 conductor red"},
{id:"fire16_4_plenum",name:"16/4 Fire Alarm FPLP Plenum",cat:"Fire",ohms1000:4.1,gauge:"16",tags:"fire fplp plenum 16/4 4 conductor red"},
{id:"fire18_shield",name:"18/2 Shielded Fire Alarm SLC",cat:"Fire",ohms1000:6.5,gauge:"18",tags:"fire shielded slc addressable 18/2 drain"},
{id:"fire16_shield",name:"16/2 Shielded Fire Alarm",cat:"Fire",ohms1000:4.1,gauge:"16",tags:"fire shielded 16/2 drain"},
{id:"fire22_shield",name:"22/2 Shielded Fire Alarm Data",cat:"Fire",ohms1000:16.14,gauge:"22",tags:"fire shielded 22/2 data slc drain"},
{id:"fire12_2",name:"12/2 Fire Alarm NAC Cable",cat:"Fire",ohms1000:1.8,gauge:"custom",tags:"fire nac 12/2 fplr fplp high current"},
{id:"fire12_4",name:"12/4 Fire Alarm NAC Cable",cat:"Fire",ohms1000:1.8,gauge:"custom",tags:"fire nac 12/4 4 conductor fplr fplp high current"},


{id:"fire18_4",name:"18/4 Fire Alarm FPLR / FPLP",cat:"Fire",ohms1000:6.5,gauge:"18",tags:"fire fplr fplp 18/4 slc nac red speaker strobe"},
{id:"fire16_4",name:"16/4 Fire Alarm FPLR / FPLP",cat:"Fire",ohms1000:4.1,gauge:"16",tags:"fire fplr fplp 16/4 nac red speaker strobe"},
{id:"fire14_4",name:"14/4 Fire Alarm FPLR / FPLP",cat:"Fire",ohms1000:2.6,gauge:"14",tags:"fire fplr fplp 14/4 nac red speaker strobe"},
{id:"fire12_2",name:"12/2 Fire Alarm NAC Cable",cat:"Fire",ohms1000:1.8,gauge:"custom",tags:"fire fplr fplp 12/2 nac high current red"},
{id:"fire22_shield",name:"22/2 Shielded Fire Alarm / Data",cat:"Fire",ohms1000:16.14,gauge:"22",tags:"fire shielded 22/2 data slc addressable drain"},
{id:"fire18_shield",name:"18/2 Shielded Fire Alarm / SLC",cat:"Fire",ohms1000:6.5,gauge:"18",tags:"fire shielded 18/2 slc addressable drain"},

{id:"phsc",name:"Protectowire PHSC",cat:"Protectowire",ohmsPerFt:.185,gauge:"custom",tags:"protectowire phsc"},
{id:"plr",name:"Protectowire PLR",cat:"Protectowire",ohmsPerFt:.058,gauge:"custom",tags:"protectowire plr"},
{id:"cat5",name:"CAT5e 24 AWG Pair",cat:"Data",ohms1000:25.67,gauge:"24",tags:"cat cat5 cat5e network"},
{id:"sec22",name:"22 AWG Security Cable",cat:"Security",ohms1000:16.14,gauge:"22",tags:"security alarm 22"}
];
const $=id=>document.getElementById(id),read=id=>{const el=$(id);if(!el)return NaN;let v=parseFloat(el.value);return Number.isFinite(v)?v:NaN},fmt=(v,d=1)=>Number.isFinite(v)?v.toFixed(d):"--",esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function note(w){let o=w.ohms1000||w.ohmsPerFt*1000;return w.ohmsPerFt?`${w.ohmsPerFt} Ω/ft`:`${o} Ω/1000 ft`}
function renderWires(q=""){let toks=q.toLowerCase().split(/\s+/).filter(Boolean),rows=DB.filter(w=>{let h=(w.name+" "+w.cat+" "+w.tags).toLowerCase();return !toks.length||toks.every(t=>h.includes(t))}).slice(0,10);$("wireResults").innerHTML=rows.map(w=>`<div class="wire-card"><div class="wire-name">${esc(w.name)}</div><div class="wire-meta">${esc(note(w))}</div><button data-wire="${w.id}" type="button">Use</button></div>`).join("")||'<div class="muted">No match</div>';$("wireResults").querySelectorAll("[data-wire]").forEach(b=>b.onclick=()=>choose(b.dataset.wire))}
function choose(id){let w=DB.find(x=>x.id===id);if(!w)return;wire={name:w.name,gauge:w.gauge,ohms1000:w.ohms1000||w.ohmsPerFt*1000,isLoop:!!w.ohmsPerFt,temp:!w.ohmsPerFt};$("selectedWire").textContent=wire.name;if(AWG[wire.gauge])$("gauge").value=wire.gauge;$("wirePanel").classList.add("hidden");$("wireSearch").value="";calc();toast("Wire selected")}
function expected(){let t=read("temp"),c=(t-32)*5/9,tf=wire.temp?1+ALPHA*(c-20):1,cal=1+(read("calibration")||0)/100,cond=wire.ohms1000/1000*tf*cal,loop=wire.isLoop?cond:cond*2,len=read("length");return{loop,len:Number.isFinite(len)&&len>0?len:500,est:!(Number.isFinite(len)&&len>0),tf}}
function diag(ohm){if(!Number.isFinite(ohm)||ohm<=0)return{icon:"✓",label:"READY",cls:"good",health:"--",signal:"--",msg:"Enter a meter reading for guidance."};let mode=$("testMode").value,e=expected(),lo=e.loop*e.len*.8,hi=e.loop*e.len*1.2;if(mode==="ground")return ohm<1000?{icon:"⏚",label:"GROUND",cls:"bad",health:"35",signal:"HIGH",msg:"Likely ground fault. Check conductor to ground, boxes, conduit, staples, shields, drain wires, and wet areas."}:{icon:"✓",label:"NORMAL",cls:"good",health:"92",signal:"LOW",msg:"No low-resistance ground fault detected. If problem remains, check for stray voltage or device leakage."};if(ohm<.05)return{icon:"⚠",label:"NEAR SHORT",cls:"bad",health:"25",signal:"MAX",msg:"Very low reading. Zero meter leads first, then inspect near test end, first box, terminations, crushed cable, or bad device base."};if(ohm>=lo&&ohm<=hi)return{icon:"✓",label:"NORMAL",cls:"good",health:"96",signal:"OK",msg:`Reading is normal for ${e.est?"estimated 500 ft":"entered length"}. This may be expected cable resistance or a far-end loop.`};if(ohm<lo)return{icon:"⚠",label:"SHORT DETECTED",cls:"bad",health:"40",signal:"HIGH",msg:"Lower than expected. Use the distance estimate, then inspect nearby junctions, detector bases, NAC devices, splices, and cable damage."};return{icon:"◒",label:"RESISTIVE",cls:"warn-text",health:"58",signal:"WEAK",msg:"Higher than expected. Look for corrosion, water, loose splices, wrong wire selection, devices still connected, or a partial open."}}
function segments(dist){let box=$("lcdSegments");if(!box.children.length)for(let i=0;i<20;i++)box.appendChild(document.createElement("span"));let e=expected(),pct=Number.isFinite(dist)?Math.max(0,Math.min(1,dist/e.len)):0;[...box.children].forEach((s,i)=>s.classList.toggle("on",i<Math.round(pct*20)))}
function calc(){let ohm=read("ohms");$("ohmMini").textContent=(Number.isFinite(ohm)?fmt(ohm,2):"0.00")+" Ω";let d=diag(ohm);$("faultIcon").textContent=d.icon;$("faultLabel").textContent=d.label;$("guidanceText").innerHTML=`<span class="${d.cls}">${d.label}:</span> ${d.msg}`;$("healthMini").textContent=d.health;$("signalMini").textContent=d.signal;$("modeMini").textContent=$("testMode").value.toUpperCase();if(!Number.isFinite(ohm)||ohm<=0){$("distance").innerHTML="SELECT WIRE<br>ENTER OHMS";$("distance").classList.add("idle");segments(0);return null}let e=expected(),dist=ohm/e.loop;$("distance").textContent=fmt(dist,1)+" ft";$("distance").classList.remove("idle");segments(dist);return{date:new Date().toLocaleString(),wireName:wire.name,ohms:ohm,distance:dist,status:d.label,customer:$("customer").value,cableId:$("cableId").value,notes:$("notes").value,gps}}
function save(){let j=calc();if(!j){toast("Enter reading first");return}let a=jobs();a.unshift(j);localStorage.setItem(JOBS,JSON.stringify(a.slice(0,50)));toast("Saved")}
function jobs(){try{return JSON.parse(localStorage.getItem(JOBS)||"[]")}catch{return[]}}
function renderTimeline(){
  const svg=$("timelineChart");
  if(!svg)return;
  const data=jobs().slice().reverse().filter(j=>Number.isFinite(j.distance)).slice(-12);
  if(!data.length){svg.innerHTML='<text x="160" y="80" text-anchor="middle" fill="#888" font-size="12">No timeline data yet</text>';$("timelineInsight").textContent="Save multiple readings to build a trend.";return}
  const max=Math.max(...data.map(d=>d.distance),1);
  const min=Math.min(...data.map(d=>d.distance),0);
  const range=Math.max(max-min,1);
  const pts=data.map((d,i)=>{const x=20+(i*(280/Math.max(data.length-1,1)));const y=125-((d.distance-min)/range)*95;return{x,y,d}});
  const line=pts.map(p=>`${p.x},${p.y}`).join(" ");
  svg.innerHTML=`<line x1="20" y1="125" x2="305" y2="125" stroke="#444" stroke-width="1"/><line x1="20" y1="25" x2="20" y2="125" stroke="#444" stroke-width="1"/><polyline points="${line}" fill="none" stroke="#f3b94d" stroke-width="3"/>${pts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="4" fill="#f3b94d"/>`).join("")}<text x="24" y="20" fill="#aaa" font-size="10">${max.toFixed(0)} ft</text><text x="24" y="142" fill="#aaa" font-size="10">${min.toFixed(0)} ft</text>`;
  if(data.length>=2){
    const first=data[0].distance,last=data[data.length-1].distance,delta=last-first;
    $("timelineInsight").textContent=Math.abs(delta)<5?"Trend is stable.":delta>0?`Distance trend moved farther by ${delta.toFixed(1)} ft.`:`Distance trend moved closer by ${Math.abs(delta).toFixed(1)} ft.`;
  }else $("timelineInsight").textContent="Save another reading to compare trend direction.";
}

function renderHistory(){renderTimeline();let a=jobs(),l=$("historyList");if(!a.length){l.className="empty";l.textContent="No saved jobs.";return}l.className="";l.innerHTML=a.map((j,i)=>`<div class="jobitem"><b>${esc(j.customer||"Untitled")}</b><div class="muted">${esc(j.date)} • ${esc(j.status)}</div><div class="jobdist">${fmt(j.distance,1)} ft</div><button data-copy="${i}" type="button">Copy</button></div>`).join("");l.querySelectorAll("[data-copy]").forEach(b=>b.onclick=()=>{copy(report(a[b.dataset.copy]));toast("Copied")})}
function report(j){return`Fault Locator Report\nDate: ${j.date}\nWire: ${j.wireName}\nStatus: ${j.status}\nOhms: ${j.ohms}\nDistance: ${fmt(j.distance,1)} ft\nCustomer: ${j.customer||"Not entered"}\nCable ID: ${j.cableId||"Not entered"}\nNotes: ${j.notes||"None"}`}
function copy(t){navigator.clipboard&&navigator.clipboard.writeText(t)}
function screen(s){document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));$(s).classList.add("active");document.querySelector(`[data-screen="${s}"]`).classList.add("active");if(s==="history")renderHistory();if(s!=="help")document.querySelectorAll("#help details").forEach(d=>d.open=false)}
function beep(){try{const ctx=new (window.AudioContext||window.webkitAudioContext)(),osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=920;gain.gain.value=.055;osc.connect(gain);gain.connect(ctx.destination);osc.start();setTimeout(()=>{osc.stop();ctx.close()},120)}catch{toast("Beep unavailable")}}
function clickSound(){if(clickMuted)return;try{const ctx=new (window.AudioContext||window.webkitAudioContext)(),osc=ctx.createOscillator(),gain=ctx.createGain();osc.type="square";osc.frequency.value=760;gain.gain.value=.035;osc.connect(gain);gain.connect(ctx.destination);osc.start();setTimeout(()=>{osc.stop();ctx.close()},38)}catch{}}
function toast(t){$("toast").textContent=t;$("toast").classList.remove("hidden");setTimeout(()=>$("toast").classList.add("hidden"),1200)}
function init(){renderWires();calc();if($("beepMini"))$("beepMini").onclick=()=>{clickMuted=!clickMuted;$("beepMini").classList.toggle("muted",clickMuted);toast(clickMuted?"Clicks muted":"Clicks on")};if($("lightMini"))$("lightMini").onclick=()=>{$("app").classList.toggle("lcd-dark");toast($("app").classList.contains("lcd-dark")?"Dark LCD":"Green LCD")};document.addEventListener("click",e=>{if(e.target.closest("button"))clickSound()},true);$("wireBtn").onclick=()=>{$("wirePanel").classList.toggle("hidden");renderWires($("wireSearch").value)};$("wireSearch").oninput=()=>renderWires($("wireSearch").value);document.querySelectorAll("[data-filter]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-filter]").forEach(x=>x.classList.remove("active-filter"));b.classList.add("active-filter");$("wireSearch").value=b.dataset.filter;renderWires(b.dataset.filter)});$("gauge").onchange=()=>{wire={name:$("gauge").value+" AWG Solid Copper",gauge:$("gauge").value,ohms1000:AWG[$("gauge").value],isLoop:false,temp:true};$("selectedWire").textContent=wire.name;calc()};document.querySelectorAll("input,select,textarea").forEach(e=>e.addEventListener("input",calc));$("clearBtn").onclick=()=>{$("ohms").value="";$("length").value="";calc()};$("saveBtn").onclick=save;$("copyBtn").onclick=()=>{let j=calc();copy(report(j));toast("Copied")};$("gpsBtn").onclick=()=>navigator.geolocation&&navigator.geolocation.getCurrentPosition(p=>{gps={lat:p.coords.latitude,lon:p.coords.longitude};$("gpsStatus").textContent=`GPS saved: ${gps.lat.toFixed(6)}, ${gps.lon.toFixed(6)}`});$("clearHistory").onclick=()=>{localStorage.removeItem(JOBS);renderHistory()};document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>screen(t.dataset.screen));if("serviceWorker"in navigator)navigator.serviceWorker.register("service-worker.js").catch(()=>{})}
document.addEventListener("DOMContentLoaded",init);
})();