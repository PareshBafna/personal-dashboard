// File: services/notion/task-tracker/task-tracker.js
// Pure view connector and global event delegator for Inbox and Master views

import { fetchAllTasks, resolvePareshUser } from "./views/master-view/api/api.client.js";
import { fetchInboxTasks } from "./views/inbox-view/api/api.client.js";
import { updateTelemetry } from "./views/inbox-view/features/telemetry/telemetry.js";
import { initFilterToolbar, getFilterState } from "./common/features/filter-toolbar/filter-toolbar.js";
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
import { renderTaskCard, multiLevelTaskComparator } from "./views/master-view/task-card/task-card.js";
import { renderInboxView, isInboxTask } from "./views/inbox-view/inbox-view.js";
import { triggerFixDueDate } from "./views/inbox-view/features/due-date-fix/due-date-fix.js";
import { initTaskAdd } from "./common/features/task-add/task-add.js";

let allMasterTasks = [];
let allInboxTasks = [];
let isInboxLoaded = false;
const container = document.getElementById("tasksContainer");

async function loadFragments() {
  document.getElementById("telemetrySlot").innerHTML = await (await fetch("./views/inbox-view/features/telemetry/telemetry.html")).text();
  document.getElementById("toolbarSlot").innerHTML = await (await fetch("./common/features/filter-toolbar/filter-toolbar.html")).text();
  document.getElementById("addTaskSlot").innerHTML = await (await fetch("./common/features/task-add/task-add.html")).text();
  await initMasterViewFeatures((task, dateStr) => updateTaskDueDate(task, dateStr, () => renderFull(false)));
}

function filterByQuery(tasks) {
  const { query } = getFilterState();
  if (!query) return tasks;
  return tasks.filter(t => t.title && t.title.toLowerCase().includes(query));
}

// When tabs change, render with hardboot true to auto-expand default toggles
async function handleTabSwitch() {
  const { status } = getFilterState();
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
  // Hard boot renders fresh structure and auto-expands default accordions
  renderFull(true);
}

function renderFull(isHardBoot = false) {
  if (!container) return;
  const { status } = getFilterState();

  if (status === "inbox") {
    const filteredInbox = filterByQuery(allInboxTasks).filter(isInboxTask);
    updateTelemetry(filteredInbox);
    const prevScroll = container.scrollTop;

    if (isHardBoot) {
      container.innerHTML = renderInboxView(filteredInbox, true);
    } else {
      const currentOpenKeys = new Set();
      container.querySelectorAll("details").forEach(d => {
        if (d.open && d.dataset.accordKey) {
          currentOpenKeys.add(d.dataset.accordKey);
        }
      });

      container.innerHTML = renderInboxView(filteredInbox, false);

      container.querySelectorAll("details").forEach(d => {
        if (d.dataset.accordKey && currentOpenKeys.has(d.dataset.accordKey)) {
          d.open = true;
        }
      });
    }

    container.scrollTop = prevScroll;
    return;
  }

  // Master View
  const filteredMaster = filterByQuery(allMasterTasks);
  updateTelemetry(filteredMaster);
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
    const { status } = getFilterState();
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
  initFilterToolbar(() => handleTabSwitch());
  initTaskAdd(() => syncData(false));
  document.getElementById("refreshBtn").addEventListener("click", () => syncData(false));
  await resolvePareshUser();
  await syncData(true);
})();