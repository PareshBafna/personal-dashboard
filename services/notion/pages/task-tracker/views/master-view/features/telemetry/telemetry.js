// File: services/notion/task-tracker/views/master-view/features/telemetry/telemetry.js

export function updateMasterTelemetry(tasks) {
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