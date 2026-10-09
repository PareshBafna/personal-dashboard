// File: services/notion/task-tracker/common/features/telemetry/telemetry.js
// Recalculates and updates telemetry counters in real-time

export function updateTelemetry(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.isDone).length;
  const inProgress = tasks.filter(t => !t.isDone && (t.status || "").toLowerCase().includes("progress")).length;
  const todo = tasks.filter(t => !t.isDone && !((t.status || "").toLowerCase().includes("progress"))).length;

  const totalEl = document.getElementById("totalCount");
  const todoEl = document.getElementById("todoCount");
  const progEl = document.getElementById("progressCount");
  const compEl = document.getElementById("completedCount");

  if (totalEl) totalEl.textContent = total;
  if (todoEl) todoEl.textContent = todo;
  if (progEl) progEl.textContent = inProgress;
  if (compEl) compEl.textContent = completed;
}