export const $ = id => document.getElementById(id);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export function toast(message) {
  const element = $("toast");
  element.textContent = message;
  element.classList.remove("hidden");
  setTimeout(() => element.classList.add("hidden"), 1300);
}

export function setActiveScreen(name) {
  $$(".screen").forEach(screen => screen.classList.remove("active"));
  $$(".tab").forEach(tab => tab.classList.remove("active"));
  $(`screen-${name}`).classList.add("active");
  document.querySelector(`[data-screen="${name}"]`).classList.add("active");
}

export function renderDistanceBar(container, ratio) {
  if (!container.children.length) {
    for (let i = 0; i < 18; i += 1) {
      container.appendChild(document.createElement("span"));
    }
  }

  const active = Math.round(Math.max(0, Math.min(1, ratio)) * container.children.length);
  Array.from(container.children).forEach((segment, index) => {
    segment.classList.toggle("on", index < active);
  });
}
