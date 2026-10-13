// File: services/notion/views/upcoming-view/features/telemetry/telemetry.js

export function initUpcomingTelemetry(containerEl) {
  if (!containerEl) return;
  containerEl.innerHTML = `
    <div class="telemetry-bar-container">
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-label">UPCOMING</span>
          <span class="metric-value" id="upcomingMetricTotal">0</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">TOMORROW</span>
          <span class="metric-value metric-tomorrow" id="upcomingMetricTomorrow">0</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">FUTURE DUE</span>
          <span class="metric-value metric-future" id="upcomingMetricFuture">0</span>
        </div>
      </div>
    </div>
  `;
}

export function updateUpcomingTelemetryCounts(total = 0, tomorrow = 0, future = 0) {
  const elTotal = document.getElementById("upcomingMetricTotal");
  const elTomorrow = document.getElementById("upcomingMetricTomorrow");
  const elFuture = document.getElementById("upcomingMetricFuture");

  if (elTotal) elTotal.textContent = total;
  if (elTomorrow) elTomorrow.textContent = tomorrow;
  if (elFuture) elFuture.textContent = future;
}