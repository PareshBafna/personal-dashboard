// File: services/notion/views/today-view/features/telemetry/telemetry.js

const TELEMETRY_HTML = `
<section class="master-panel">
  <div class="panel-left">
    <div class="metric-row single-line-metrics">
      <div class="metric-block">
        <span class="metric-label">Total</span>
        <span id="metricTotal" class="metric-number">0</span>
      </div>
      <div class="metric-block">
        <span class="metric-label">To Do</span>
        <span id="metricTodo" class="metric-number todo-num">0</span>
      </div>
      <div class="metric-block">
        <span class="metric-label">In Progress</span>
        <span id="metricProg" class="metric-number prog-num">0</span>
      </div>
    </div>
  </div>
</section>
`;

export function initTelemetry(containerEl) {
  if (!containerEl) return;
  containerEl.innerHTML = TELEMETRY_HTML;
}

export function updateTelemetryCounts(total = 0, todo = 0, inProg = 0) {
  const elTotal = document.getElementById("metricTotal");
  const elTodo = document.getElementById("metricTodo");
  const elProg = document.getElementById("metricProg");

  if (elTotal) elTotal.textContent = total;
  if (elTodo) elTodo.textContent = todo;
  if (elProg) elProg.textContent = inProg;
}