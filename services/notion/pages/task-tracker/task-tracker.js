// File: services/notion/pages/task-tracker/task-tracker.js

import { fetchAllTasks, resolvePareshUser } from "./views/master-view/api/api.client.js";
import { fetchInboxTasks } from "./views/inbox-view/api/api.client.js";
import { updateMasterTelemetry } from "./views/master-view/features/telemetry/telemetry.js";
import { updateTelemetry as updateInboxTelemetry } from "./views/inbox-view/features/telemetry/telemetry.js";
import { initViewTabs, getActiveTab } from "./features/view-tabs/view-tabs.js";
import { initMasterSearchBar, getMasterSearchQuery } from "./views/master-view/features/search-bar/search-bar.js";
import { initInboxSearchBar, getInboxSearchQuery } from "./views/inbox-view/features/search-bar/search-bar.js";
import { 
  renderMasterView, 
  attachDateAccordionSync, 
  initMasterViewFeatures, 
  openCustomDateModal, 
  updateTaskDueDate, 
  setDateTodayOrTomorrow, 
  updateTaskPriority, 
  updateTaskStatus, 
  openUpdateTaskModal, 
  deleteTask, 
  duplicateTask,
  updateMasterTaskDomInPlace, 
  removeMasterTaskDomInPlace 
} from "./views/master-view/master-view.js";
import { renderInboxView, isInboxTask } from "./views/inbox-view/inbox-view.js";
import { triggerFixDueDate } from "./views/inbox-view/features/due-date-fix/due-date-fix.js";
import { initTaskAdd } from "./features/task-add/task-add.js";

let allMasterTasks = [];
let allInboxTasks = [];
let isInboxLoaded = false;
let currentViewType = "master";

let fragmentCache = {
  masterTel: "",
  inboxTel: "",
  masterSearch: "",
  inboxSearch: "",
  tabs: "",
  add: ""
};

const container = document.getElementById("tasksContainer");

async function loadFragments() {
  const [mTel, iTel, mSearch, iSearch, tabs, add] = await Promise.all([
    fetch("./views/master-view/features/telemetry/telemetry.html").then(r => r.text()),
    fetch("./views/inbox-view/features/telemetry/telemetry.html").then(r => r.text()),
    fetch("./views/master-view/features/search-bar/search-bar.html").then(r => r.text()),
    fetch("./views/inbox-view/features/search-bar/search-bar.html").then(r => r.text()),
    fetch("./features/view-tabs/view-tabs.html").then(r => r.text()),
    fetch("./features/task-add/task-add.html").then(r => r.text())
  ]);

  fragmentCache = {
    masterTel: mTel,
    inboxTel: iTel,
    masterSearch: mSearch,
    inboxSearch: iSearch,
    tabs,
    add
  };

  document.getElementById("telemetrySlot").innerHTML = fragmentCache.masterTel;
  document.getElementById("searchBarSlot").innerHTML = fragmentCache.masterSearch;
  document.getElementById("viewTabsSlot").innerHTML = fragmentCache.tabs;
  document.getElementById("addTaskSlot").innerHTML = fragmentCache.add;

  initMasterSearchBar(() => renderFull(false));
  initViewTabs(() => handleTabSwitch());
  await initMasterViewFeatures((task, dateStr) => updateTaskDueDate(task, dateStr, () => renderFull(false)));
}

function syncHeaderSlots(view) {
  if (currentViewType === view) return;
  currentViewType = view;

  const telSlot = document.getElementById("telemetrySlot");
  const searchSlot = document.getElementById("searchBarSlot");

  if (view === "inbox") {
    if (telSlot) telSlot.innerHTML = fragmentCache.inboxTel;
    if (searchSlot) {
      searchSlot.innerHTML = fragmentCache.inboxSearch;
      initInboxSearchBar(() => renderFull(false));
    }
  } else {
    if (telSlot) telSlot.innerHTML = fragmentCache.masterTel;
    if (searchSlot) {
      searchSlot.innerHTML = fragmentCache.masterSearch;
      initMasterSearchBar(() => renderFull(false));
    }
  }
}

function filterTasksByActiveSearch(tasks, view) {
  const query = view === "inbox" ? getInboxSearchQuery() : getMasterSearchQuery();
  if (!query) return tasks;
  return tasks.filter(t => t.title && t.title.toLowerCase().includes(query));
}

async function handleTabSwitch() {
  const status = getActiveTab();
  syncHeaderSlots(status);

  if (status === "inbox" && !isInboxLoaded) {
    if (container) {
      container.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; padding: 60px; color: var(--text-dim); gap: 12px;">
          <i class="fa-solid fa-rotate spin" style="font-size: 1.5rem;"></i>
          <span>Loading Inbox tasks...</span>
        </div>
      `;
    }
    allInboxTasks = await fetchInboxTasks();
    isInboxLoaded = true;
  }
  renderFull(true);
}

function renderFull(isHardBoot = false) {
  if (!container) return;
  const status = getActiveTab();

  if (status === "inbox") {
    syncHeaderSlots("inbox");
    const filteredInbox = filterTasksByActiveSearch(allInboxTasks, "inbox").filter(isInboxTask);
    updateInboxTelemetry(filteredInbox);
    const prevScroll = container.scrollTop;

    if (isHardBoot) {
      container.innerHTML = renderInboxView(filteredInbox);
    } else {
      const currentOpenKeys = new Set();
      container.querySelectorAll("details").forEach(d => {
        if (d.open && d.dataset.accordKey) {
          currentOpenKeys.add(d.dataset.accordKey);
        }
      });

      container.innerHTML = renderInboxView(filteredInbox);

      container.querySelectorAll("details").forEach(d => {
        if (d.dataset.accordKey && currentOpenKeys.has(d.dataset.accordKey)) {
          d.open = true;
        }
      });
    }

    container.scrollTop = prevScroll;
    return;
  }

  syncHeaderSlots("master");
  const filteredMaster = filterTasksByActiveSearch(allMasterTasks, "master");
  updateMasterTelemetry(filteredMaster);
  const prevScroll = container.scrollTop;

  if (isHardBoot) {
    container.innerHTML = renderMasterView(filteredMaster, true);
    attachDateAccordionSync(container);
  } else {
    const currentOpenKeys = new Set();
    container.querySelectorAll("details").forEach(d => {
      if (d.open && d.dataset.accordKey) {
        currentOpenKeys.add(d.dataset.accordKey);
      }
    });

    container.innerHTML = renderMasterView(filteredMaster, false);

    container.querySelectorAll("details").forEach(d => {
      if (d.dataset.accordKey && currentOpenKeys.has(d.dataset.accordKey)) {
        d.open = true;
      }
    });

    attachDateAccordionSync(container);
  }

  container.scrollTop = prevScroll;
}

container.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  const task = allMasterTasks.find(t => t.id === id) || allInboxTasks.find(t => t.id === id);
  if (!task) return;

  if (action === "toggle") {
    const next = task.isDone ? "Not Started" : "Done";
    updateTaskStatus(task, next, () => {
      updateMasterTaskDomInPlace(container, task, next, () => renderFull(false));
    });
  } else if (action === "status") {
    const targetStatus = btn.dataset.target;
    updateTaskStatus(task, targetStatus, () => {
      updateMasterTaskDomInPlace(container, task, targetStatus, () => renderFull(false));
    });
  } else if (action === "delete") {
    deleteTask(id, () => {
      allMasterTasks = allMasterTasks.filter(t => t.id !== id);
      allInboxTasks = allInboxTasks.filter(t => t.id !== id);
      removeMasterTaskDomInPlace(container, id, () => renderFull(false));
    });
  } else if (action === "duplicate") {
    duplicateTask(task, async (createdTask) => {
      await syncData(false);
      const targetToOpen = allMasterTasks.find(t => t.id === createdTask?.id) || allInboxTasks.find(t => t.id === createdTask?.id) || createdTask;
      if (targetToOpen) {
        openUpdateTaskModal(targetToOpen, () => {
          renderFull(false);
        });
      }
    });
  } else if (action === "set-date-nodue") {
    updateTaskDueDate(task, null, () => renderFull(false));
  } else if (action === "set-date-today") {
    setDateTodayOrTomorrow(task, false, () => renderFull(false));
  } else if (action === "set-date-tomorrow") {
    setDateTodayOrTomorrow(task, true, () => renderFull(false));
  } else if (action === "open-date-modal") {
    openCustomDateModal(task);
  } else if (action === "set-priority") {
    const newPrio = btn.dataset.prio;
    if (newPrio && newPrio !== task.priority) {
      updateTaskPriority(task, newPrio, () => renderFull(false));
    }
  } else if (action === "open-update-modal") {
    openUpdateTaskModal(task, () => {
      renderFull(false);
    });
  } else if (action === "fix-due-date") {
    triggerFixDueDate(task, btn, async () => {
      allInboxTasks = await fetchInboxTasks();
      renderFull(false);
    });
  }
});

async function syncData(isHardBoot = false) {
  const refBtn = document.getElementById("refreshBtn");
  if (refBtn) refBtn.classList.add("spinning");

  try {
    const status = getActiveTab();
    if (status === "inbox") {
      allInboxTasks = await fetchInboxTasks();
      isInboxLoaded = true;
    } else {
      allMasterTasks = await fetchAllTasks();
    }
    renderFull(isHardBoot);
  } catch (err) {
    console.error("Sync error:", err);
  } finally {
    if (refBtn) refBtn.classList.remove("spinning");
  }
}

(async () => {
  await loadFragments();
  initTaskAdd(() => syncData(false));
  document.getElementById("refreshBtn").addEventListener("click", () => syncData(false));
  await resolvePareshUser();
  await syncData(true);
})();