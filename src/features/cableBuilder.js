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
  if (!segments.length) {
    container.innerHTML = '<div class="muted">No cable points yet.</div>';
    return;
  }

  let total = 0;
  container.innerHTML = segments.map(segment => {
    total += segment.feet;
    return `<div class="cable-node"><b>${segment.name}</b><br><span class="muted">+${segment.feet} ft • ${total} ft total</span></div>`;
  }).join("");
}
