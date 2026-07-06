const KEY = "fault_locator_pro_2_segments";

export function getCableSegments() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function addCableSegment(segment) {
  const segments = getCableSegments();
  segments.push(segment);
  localStorage.setItem(KEY, JSON.stringify(segments));
}

export function renderCableMap(container) {
  const segments = getCableSegments();
  const countEl = document.getElementById("segment-count");
  const totalEl = document.getElementById("segment-total");
  const totalLength = segments.reduce((sum, segment) => sum + Number(segment.feet || 0), 0);
  if (countEl) countEl.textContent = String(segments.length);
  if (totalEl) totalEl.textContent = `${totalLength} ft`;

  if (!segments.length) {
    container.innerHTML = '<div class="muted">No cable points yet. Add the panel, junction boxes, and devices in order.</div>';
    return;
  }

  let total = 0;
  container.innerHTML = segments.map((segment, index) => {
    total += Number(segment.feet || 0);
    return `<div class="cable-node"><b>${index + 1}. ${segment.name}</b><br><span class="muted">+${segment.feet} ft from previous • ${total} ft total</span></div>`;
  }).join("");
}
