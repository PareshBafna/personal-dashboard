// File: services/notion/views/today-view/features/telemetry/telemetry.js

export async function initTelemetry(containerEl) {
  if (!containerEl) return;
  const res = await fetch("./views/today-view/features/telemetry/telemetry.html");
  containerEl.innerHTML = await res.text();
}

export function updateTelemetryCounts(total = 0, todo = 0, inProg = 0, completed = 0) {
  const elTotal = document.getElementById("metricTotal");
  const elTodo = document.getElementById("metricTodo");
  const elProg = document.getElementById("metricProg");
  const elCompleted = document.getElementById("metricCompleted");

  if (elTotal) elTotal.textContent = total;
  if (elTodo) elTodo.textContent = todo;
  if (elProg) elProg.textContent = inProg;
  if (elCompleted) elCompleted.textContent = completed;
}