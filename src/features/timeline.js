export function renderTimeline(svg, insight, jobs) {
  const data = jobs.slice().reverse().filter(job => Number.isFinite(job.distanceFeet)).slice(-12);

  if (!data.length) {
    svg.innerHTML = '<text x="160" y="82" text-anchor="middle" fill="#888" font-size="12">No timeline data</text>';
    insight.textContent = "Save readings to build a diagnostic trend.";
    return;
  }

  const distances = data.map(job => job.distanceFeet);
  const max = Math.max(...distances, 1);
  const min = Math.min(...distances, 0);
  const range = Math.max(max - min, 1);

  const points = data.map((job, index) => {
    const x = 20 + index * (280 / Math.max(data.length - 1, 1));
    const y = 125 - ((job.distanceFeet - min) / range) * 95;
    return { x, y, job };
  });

  svg.innerHTML = `
    <line x1="20" y1="125" x2="305" y2="125" stroke="#444" stroke-width="1"/>
    <line x1="20" y1="25" x2="20" y2="125" stroke="#444" stroke-width="1"/>
    <polyline points="${points.map(p => `${p.x},${p.y}`).join(" ")}" fill="none" stroke="#f5b51b" stroke-width="3"/>
    ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#f5b51b"/>`).join("")}
    <text x="24" y="20" fill="#aaa" font-size="10">${max.toFixed(0)} ft</text>
    <text x="24" y="142" fill="#aaa" font-size="10">${min.toFixed(0)} ft</text>
  `;

  if (data.length < 2) {
    insight.textContent = "Save another reading to compare trend direction.";
    return;
  }

  const delta = data.at(-1).distanceFeet - data[0].distanceFeet;
  insight.textContent = Math.abs(delta) < 5
    ? "Trend is stable."
    : delta > 0
      ? `Fault trend moved farther by ${delta.toFixed(1)} ft.`
      : `Fault trend moved closer by ${Math.abs(delta).toFixed(1)} ft.`;
}
