// File: services/notion/notion.js

import { initTelemetry, updateTelemetryCounts } from "./views/today-view/features/telemetry/telemetry.js";
import { initSyncButton, setSyncButtonState } from "./views/today-view/features/sync-data/sync-data.js";
import { fetchTodayTasks } from "./views/today-view/api/api.client.js";
import { renderTodayView } from "./views/today-view/today-view.js";
import { updateTaskStatus } from "./views/today-view/features/status-update/status-update.js";
import { toLocalDateString, getNativeDueDateRaw } from "./views/today-view/task-card/task-card.js";

let allTodayTasks = [];
const todayPanel = document.getElementById("tabToday");
const tabTitle = document.getElementById("tabTitle");
const telemetrySlot = document.getElementById("telemetrySlot");
const headerSyncBtn = document.getElementById("headerSyncBtn");

const TZ = "Asia/Kolkata";
const TAB_TITLES = {
  today: "Today",
  upcoming: "Upcoming",
  all: "All Records",
  list: "Pages"
};

function computeAndRenderMetrics(tasks) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: TZ });

  const visibleTasks = (tasks || []).filter(t => {
    if (t.isDone) return false;
    const rawDue = getNativeDueDateRaw(t) || t.date || t.formulaDate || "";
    const dOnly = toLocalDateString(rawDue);
    if (!dOnly) return false;
    return dOnly <= today;
  });

  const total = visibleTasks.length;
  const inProg = visibleTasks.filter(t => (t.status || "").toLowerCase().includes("progress")).length;
  const todo = total - inProg;

  updateTelemetryCounts(total, todo, inProg);
}

async function loadTodayTasks() {
  if (!todayPanel) return;
  setSyncButtonState(headerSyncBtn, true);
  todayPanel.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; padding: 60px; color: var(--text-dim); gap: 12px;">
      <i class="fa-solid fa-rotate spin" style="font-size: 1.5rem;"></i>
      <span>Loading Today's agenda...</span>
    </div>
  `;
  try {
    allTodayTasks = await fetchTodayTasks();
    todayPanel.innerHTML = renderTodayView(allTodayTasks);
    computeAndRenderMetrics(allTodayTasks);
  } catch (err) {
    console.error("Today view fetch error:", err);
    todayPanel.innerHTML = `
      <div class="empty-placeholder">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; color: #ff4d4f;"></i>
        <h3>Failed to load tasks</h3>
        <p>${err.message}</p>
      </div>
    `;
  } finally {
    setSyncButtonState(headerSyncBtn, false);
  }
}

// Init Telemetry from today-view feature folder
initTelemetry(telemetrySlot);

// Init Sync Button from feature module
initSyncButton(headerSyncBtn, loadTodayTasks);

// Bottom navigation tab switching
document.querySelectorAll(".bottom-nav .nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    const tabKey = btn.dataset.tab;
    if (!tabKey) return;

    document.querySelectorAll(".bottom-nav .nav-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".hub-tab-panel").forEach(panel => panel.classList.remove("active"));
    const activePanel = document.getElementById(`tab${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}`);
    if (activePanel) activePanel.classList.add("active");

    if (tabTitle && TAB_TITLES[tabKey]) {
      tabTitle.textContent = TAB_TITLES[tabKey];
    }

    if (telemetrySlot) {
      telemetrySlot.style.display = tabKey === "list" ? "none" : "block";
    }
    if (headerSyncBtn) {
      headerSyncBtn.style.display = tabKey === "list" ? "none" : "inline-flex";
    }

    if (tabKey === "today" && allTodayTasks.length === 0) {
      loadTodayTasks();
    }
  });
});

// Status change event delegation
if (todayPanel) {
  todayPanel.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action='status']");
    if (!btn) return;
    const id = btn.dataset.id;
    const targetStatus = btn.dataset.target;
    const task = allTodayTasks.find(t => t.id === id);
    if (!task) return;

    setSyncButtonState(headerSyncBtn, true);
    updateTaskStatus(task, targetStatus, () => {
      todayPanel.innerHTML = renderTodayView(allTodayTasks);
      computeAndRenderMetrics(allTodayTasks);
      setSyncButtonState(headerSyncBtn, false);
    });
  });
}

// Initial Boot
loadTodayTasks();