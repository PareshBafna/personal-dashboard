// File: services/notion/notion.js

import { initTelemetry, updateTelemetryCounts } from "./views/today-view/features/telemetry/telemetry.js";
import { initSyncButton, setSyncButtonState } from "./views/today-view/features/sync-data/sync-data.js";
import { fetchTodayTasks } from "./views/today-view/api/api.client.js";
import { renderTodayView } from "./views/today-view/today-view.js";
import { updateTaskStatus } from "./views/today-view/features/status-update/status-update.js";
import { toLocalDateString, getNativeDueDateRaw } from "./views/today-view/task-card/task-card.js";

// Upcoming View Imports
import { initUpcomingTelemetry, updateUpcomingTelemetryCounts } from "./views/upcoming-view/features/telemetry/telemetry.js";
import { fetchUpcomingTasks } from "./views/upcoming-view/api/api.client.js";
import { renderUpcomingView } from "./views/upcoming-view/upcoming-view.js";
import { updateUpcomingTaskStatus } from "./views/upcoming-view/features/status-update/status-update.js";

let allTodayTasks = [];
let allUpcomingTasks = [];

const todayPanel = document.getElementById("tabToday");
const upcomingPanel = document.getElementById("tabUpcoming");
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

function getTomorrowDateString() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

function computeAndRenderTodayMetrics(tasks) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: TZ });
  const visibleTasks = (tasks || []).filter(t => {
    if (t.isDone) return false;
    const rawDue = getNativeDueDateRaw(t);
    const dOnly = toLocalDateString(rawDue);
    return dOnly && dOnly <= today;
  });

  const total = visibleTasks.length;
  const inProg = visibleTasks.filter(t => (t.status || "").toLowerCase().includes("progress")).length;
  const todo = total - inProg;

  updateTelemetryCounts(total, todo, inProg);
}

function computeAndRenderUpcomingMetrics(tasks) {
  const tomorrow = getTomorrowDateString();
  const active = (tasks || []).filter(t => !t.isDone);

  const tomorrowCount = active.filter(t => toLocalDateString(getNativeDueDateRaw(t)) === tomorrow).length;
  const futureCount = active.filter(t => toLocalDateString(getNativeDueDateRaw(t)) > tomorrow).length;
  const total = tomorrowCount + futureCount;

  updateUpcomingTelemetryCounts(total, tomorrowCount, futureCount);
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
    computeAndRenderTodayMetrics(allTodayTasks);
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

async function loadUpcomingTasks() {
  if (!upcomingPanel) return;
  setSyncButtonState(headerSyncBtn, true);
  upcomingPanel.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; padding: 60px; color: var(--text-dim); gap: 12px;">
      <i class="fa-solid fa-rotate spin" style="font-size: 1.5rem;"></i>
      <span>Loading Upcoming agenda...</span>
    </div>
  `;
  try {
    allUpcomingTasks = await fetchUpcomingTasks();
    upcomingPanel.innerHTML = renderUpcomingView(allUpcomingTasks);
    computeAndRenderUpcomingMetrics(allUpcomingTasks);
  } catch (err) {
    console.error("Upcoming view fetch error:", err);
    upcomingPanel.innerHTML = `
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

// Init Global Header Sync Button
initSyncButton(headerSyncBtn, () => {
  const currentTab = document.querySelector(".bottom-nav .nav-item.active")?.dataset?.tab;
  if (currentTab === "today") loadTodayTasks();
  if (currentTab === "upcoming") loadUpcomingTasks();
});

// Bottom navigation switching
document.querySelectorAll(".bottom-nav .nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    const tabKey = btn.dataset.tab;
    if (!tabKey) return;

    document.querySelectorAll(".bottom-nav .nav-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".hub-tab-panel").forEach(panel => {
      panel.classList.remove("active");
      panel.style.display = "none";
    });

    const activePanel = document.getElementById(`tab${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}`);
    if (activePanel) {
      activePanel.classList.add("active");
      activePanel.style.display = "flex";
    }

    if (tabTitle && TAB_TITLES[tabKey]) {
      tabTitle.textContent = TAB_TITLES[tabKey];
    }

    if (tabKey === "today") {
      telemetrySlot.style.display = "block";
      headerSyncBtn.style.display = "inline-flex";
      initTelemetry(telemetrySlot);
      if (allTodayTasks.length > 0) {
        computeAndRenderTodayMetrics(allTodayTasks);
      } else {
        loadTodayTasks();
      }
    } else if (tabKey === "upcoming") {
      telemetrySlot.style.display = "block";
      headerSyncBtn.style.display = "inline-flex";
      initUpcomingTelemetry(telemetrySlot);
      if (allUpcomingTasks.length > 0) {
        computeAndRenderUpcomingMetrics(allUpcomingTasks);
      } else {
        loadUpcomingTasks();
      }
    } else {
      telemetrySlot.style.display = "none";
      headerSyncBtn.style.display = "none";
    }
  });
});

// Event Delegation for Today View
if (todayPanel) {
  todayPanel.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action='status']");
    if (!btn) return;
    const task = allTodayTasks.find(t => t.id === btn.dataset.id);
    if (!task) return;

    setSyncButtonState(headerSyncBtn, true);
    updateTaskStatus(task, btn.dataset.target, () => {
      todayPanel.innerHTML = renderTodayView(allTodayTasks);
      computeAndRenderTodayMetrics(allTodayTasks);
      setSyncButtonState(headerSyncBtn, false);
    });
  });
}

// Event Delegation for Upcoming View
if (upcomingPanel) {
  upcomingPanel.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action='status']");
    if (!btn) return;
    const task = allUpcomingTasks.find(t => t.id === btn.dataset.id);
    if (!task) return;

    setSyncButtonState(headerSyncBtn, true);
    updateUpcomingTaskStatus(task, btn.dataset.target, () => {
      upcomingPanel.innerHTML = renderUpcomingView(allUpcomingTasks);
      computeAndRenderUpcomingMetrics(allUpcomingTasks);
      setSyncButtonState(headerSyncBtn, false);
    });
  });
}

// Initial Boot: Load Today
initTelemetry(telemetrySlot);
loadTodayTasks();