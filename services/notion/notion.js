// File: services/notion/notion.js

import { initTelemetry, updateTelemetryCounts } from "./views/today-view/features/telemetry/telemetry.js";
import { initSyncButton, setSyncButtonState } from "./views/today-view/features/sync-data/sync-data.js";
import { initSearchBar, getSearchQuery } from "./views/today-view/features/search-bar/search-bar.js";
import { fetchTodayTasks } from "./views/today-view/api/api.client.js";
import { renderTodayView } from "./views/today-view/today-view.js";
import { updateTaskStatus } from "./views/today-view/features/status-update/status-update.js";
import { toLocalDateString, getNativeDueDateRaw } from "./views/today-view/task-card/task-card.js";

let allTodayTasks = [];

const todayPanel = document.getElementById("tabToday");
const tabTitle = document.getElementById("tabTitle");
const brandIcon = document.getElementById("brandIcon");
const telemetrySlot = document.getElementById("telemetrySlot");
const toolbarSlot = document.getElementById("toolbarSlot");
const headerSyncBtn = document.getElementById("headerSyncBtn");

const TZ = "Asia/Kolkata";
const TAB_CONFIG = {
  today: { title: "Today", icon: "fa-calendar-day" },
  upcoming: { title: "Upcoming", icon: "fa-calendar-week" },
  all: { title: "All Records", icon: "fa-layer-group" },
  list: { title: "Pages", icon: "fa-list-ul" }
};

async function loadFragments() {
  await Promise.all([
    initTelemetry(telemetrySlot),
    initSearchBar(toolbarSlot, () => renderTodayPanel())
  ]);
}

function filterTasksBySearch(tasks) {
  const q = getSearchQuery();
  if (!q) return tasks;
  return tasks.filter(t => t.title && t.title.toLowerCase().includes(q));
}

function computeAndRenderTodayMetrics(tasks) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: TZ });
  const relevantTasks = (tasks || []).filter(t => {
    const rawDue = getNativeDueDateRaw(t);
    const dOnly = toLocalDateString(rawDue);
    return dOnly && dOnly <= today;
  });

  const total = relevantTasks.length;
  const completed = relevantTasks.filter(t => t.isDone).length;
  const inProg = relevantTasks.filter(t => !t.isDone && (t.status || "").toLowerCase().includes("progress")).length;
  const todo = relevantTasks.filter(t => !t.isDone && !(t.status || "").toLowerCase().includes("progress")).length;

  updateTelemetryCounts(total, todo, inProg, completed);
}

function renderTodayPanel() {
  if (!todayPanel) return;
  const filtered = filterTasksBySearch(allTodayTasks);
  todayPanel.innerHTML = renderTodayView(filtered);
  computeAndRenderTodayMetrics(allTodayTasks);
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
    renderTodayPanel();
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

initSyncButton(headerSyncBtn, () => {
  const currentTab = document.querySelector(".bottom-nav .nav-item.active")?.dataset?.tab;
  if (currentTab === "today") loadTodayTasks();
});

document.querySelectorAll(".bottom-nav .nav-item").forEach(btn => {
  btn.addEventListener("click", async () => {
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

    if (tabTitle && TAB_CONFIG[tabKey]) tabTitle.textContent = TAB_CONFIG[tabKey].title;
    if (brandIcon && TAB_CONFIG[tabKey]) brandIcon.className = `fa-solid ${TAB_CONFIG[tabKey].icon}`;

    if (tabKey === "today") {
      if (telemetrySlot) telemetrySlot.style.display = "block";
      if (toolbarSlot) toolbarSlot.style.display = "block";
      if (headerSyncBtn) headerSyncBtn.style.display = "inline-flex";
      await loadFragments();
      if (allTodayTasks.length > 0) renderTodayPanel();
      else await loadTodayTasks();
    } else {
      if (telemetrySlot) telemetrySlot.style.display = "none";
      if (toolbarSlot) toolbarSlot.style.display = "none";
      if (headerSyncBtn) headerSyncBtn.style.display = "none";
    }
  });
});

if (todayPanel) {
  todayPanel.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action='status']");
    if (!btn) return;
    const task = allTodayTasks.find(t => t.id === btn.dataset.id);
    if (!task) return;

    setSyncButtonState(headerSyncBtn, true);
    updateTaskStatus(task, btn.dataset.target, () => {
      renderTodayPanel();
      setSyncButtonState(headerSyncBtn, false);
    });
  });
}

(async () => {
  await loadFragments();
  await loadTodayTasks();
})();