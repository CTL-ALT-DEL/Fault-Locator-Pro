export function renderTimeline(svg, insight, jobs, options = {}) {
  const detail = options.detail || false;
  const data = jobs.slice().reverse().filter(job => Number.isFinite(job.distanceFeet)).slice(detail ? -30 : -12);
  const width = detail ? 760 : 320, height = detail ? 360 : 150;
  if (!data.length) {
    svg.innerHTML = `<text x="${width/2}" y="${height/2}" text-anchor="middle" fill="#888" font-size="12">No timeline data</text>`;
    if (insight) insight.textContent = "Save readings to build a diagnostic trend.";
    return;
  }
  const left = detail ? 58 : 20, right = detail ? 28 : 15, top = detail ? 30 : 25, bottom = detail ? 52 : 25;
  const chartW = width-left-right, chartH = height-top-bottom;
  const distances = data.map(j=>j.distanceFeet);
  const max = Math.max(...distances,1), min = Math.min(...distances,0), range = Math.max(max-min,1);
  const pts = data.map((job,i)=>({x:left+i*(chartW/Math.max(data.length-1,1)), y:top+chartH-((job.distanceFeet-min)/range)*chartH, job}));
  const bandH = chartH/3;
  const statusColor = s => { s=String(s||"").toUpperCase(); if(s.includes("SHORT")||s.includes("GROUND")) return "#7c1717"; if(s.includes("RESISTIVE")) return "#7c6817"; return "#174d22"; };
  const statusBars = pts.map((p,i)=>{const nx=pts[i+1]?pts[i+1].x:p.x+chartW/Math.max(data.length,1);return `<rect x="${p.x}" y="${top}" width="${Math.max(4,nx-p.x)}" height="6" fill="${statusColor(p.job.diagnosis)}" opacity=".9"/>`;}).join("");
  const circles = pts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="${detail?5:4}" fill="#f5b51b"><title>${p.job.date} • ${p.job.distanceFeet.toFixed(1)} ft • ${p.job.ohms} Ω • ${p.job.diagnosis}</title></circle>`).join("");
  const valueLabels = detail ? pts.map(p=>`<text x="${p.x}" y="${p.y-9}" fill="#f5b51b" font-size="11" text-anchor="middle">${p.job.distanceFeet.toFixed(0)}'</text>`).join("") : "";
  const pointLabels = detail ? pts.map(p=>`<text x="${p.x}" y="${height-14}" fill="#aaa" font-size="10" text-anchor="middle" transform="rotate(-25 ${p.x} ${height-14})">${new Date(p.job.timestamp||Date.now()).toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</text>`).join("") : "";
  svg.innerHTML = `
    <rect x="${left}" y="${top}" width="${chartW}" height="${bandH}" fill="#173d1d" opacity=".34"/>
    <rect x="${left}" y="${top+bandH}" width="${chartW}" height="${bandH}" fill="#6b5b12" opacity=".28"/>
    <rect x="${left}" y="${top+bandH*2}" width="${chartW}" height="${bandH}" fill="#641515" opacity=".25"/>
    <text x="${left+6}" y="${top+14}" fill="#83ff9c" font-size="10">NORMAL</text>
    <text x="${left+6}" y="${top+bandH+14}" fill="#f5d75f" font-size="10">RESISTIVE</text>
    <text x="${left+6}" y="${top+bandH*2+14}" fill="#ff8f8f" font-size="10">SHORT</text>
    ${statusBars}
    <line x1="${left}" y1="${top+chartH}" x2="${left+chartW}" y2="${top+chartH}" stroke="#555" stroke-width="1"/>
    <line x1="${left}" y1="${top}" x2="${left}" y2="${top+chartH}" stroke="#555" stroke-width="1"/>
    <text x="${left-8}" y="${top+5}" fill="#aaa" font-size="10" text-anchor="end">${max.toFixed(0)} ft</text>
    <text x="${left-8}" y="${top+chartH}" fill="#aaa" font-size="10" text-anchor="end">${min.toFixed(0)} ft</text>
    <polyline points="${pts.map(p=>`${p.x},${p.y}`).join(" ")}" fill="none" stroke="#f5b51b" stroke-width="${detail?4:3}"/>
    ${circles}${valueLabels}${pointLabels}`;
  if (!insight) return;
  if (data.length < 2) { insight.textContent = "Save another reading to compare trend direction."; return; }
  const delta=data.at(-1).distanceFeet-data[0].distanceFeet, last=data.at(-1);
  insight.textContent = Math.abs(delta)<5 ? `Trend is stable. Latest: ${last.distanceFeet.toFixed(1)} ft, ${last.ohms} Ω, ${last.diagnosis}.` : delta>0 ? `Fault trend moved farther by ${delta.toFixed(1)} ft. Latest: ${last.distanceFeet.toFixed(1)} ft, ${last.ohms} Ω, ${last.diagnosis}.` : `Fault trend moved closer by ${Math.abs(delta).toFixed(1)} ft. Latest: ${last.distanceFeet.toFixed(1)} ft, ${last.ohms} Ω, ${last.diagnosis}.`;
}
