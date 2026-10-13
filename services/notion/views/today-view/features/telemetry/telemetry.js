// File: services/notion/views/today-view/features/telemetry/telemetry.js

let cachedTelemetryHtml = "";

export async function initTelemetry(containerEl) {
  if (!containerEl) return;
  if (!cachedTelemetryHtml) {
    const res = await fetch("./views/today-view/features/telemetry/telemetry.html");
    cachedTelemetryHtml = await res.text();
  }
  containerEl.innerHTML = cachedTelemetryHtml;
}

export function updateTelemetryCounts(total = 0, todo = 0, inProg = 0) {
  const elTotal = document.getElementById("metricTotal");
  const elTodo = document.getElementById("metricTodo");
  const elProg = document.getElementById("metricProg");

  if (elTotal) elTotal.textContent = total;
  if (elTodo) elTodo.textContent = todo;
  if (elProg) elProg.textContent = inProg;
}