// File: services/notion/views/today-view/features/telemetry/telemetry.js

export function initTelemetry(containerEl) {
  if (!containerEl) return;
  containerEl.innerHTML = `
    <div class="telemetry-bar-container">
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-label">TOTAL</span>
          <span class="metric-value" id="metricTotal">0</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">TO DO</span>
          <span class="metric-value metric-todo" id="metricTodo">0</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">IN PROGRESS</span>
          <span class="metric-value metric-prog" id="metricProg">0</span>
        </div>
      </div>
    </div>
  `;
}

export function updateTelemetryCounts(total = 0, todo = 0, inProg = 0) {
  const elTotal = document.getElementById("metricTotal");
  const elTodo = document.getElementById("metricTodo");
  const elProg = document.getElementById("metricProg");

  if (elTotal) elTotal.textContent = total;
  if (elTodo) elTodo.textContent = todo;
  if (elProg) elProg.textContent = inProg;
}