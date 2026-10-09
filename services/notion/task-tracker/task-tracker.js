// File: services/notion/task-tracker/task-tracker.js
// Pure view connector and global event delegator

import { fetchAllTasks, resolvePareshUser } from "./views/master-view/api/api.client.js";
import { updateTelemetry } from "./common/features/telemetry/telemetry.js";
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
  updateMasterTaskDomInPlace, 
  removeMasterTaskDomInPlace 
} from "./views/master-view/master-view.js";
import { renderTaskCard, multiLevelTaskComparator } from "./views/master-view/task-card/task-card.js";
import { renderInboxView, isInboxTask } from "./views/inbox-view/inbox-view.js";
import { triggerFixDueDate } from "./views/inbox-view/features/due-date-fix/due-date-fix.js";
import { initTaskAdd } from "./common/features/task-add/task-add.js";

let allTasks = [];
const container = document.getElementById("tasksContainer");

async function loadFragments() {
  document.getElementById("telemetrySlot").innerHTML = await (await fetch("./common/features/telemetry/telemetry.html")).text();
  document.getElementById("toolbarSlot").innerHTML = await (await fetch("./common/features/filter-toolbar/filter-toolbar.html")).text();
  document.getElementById("addTaskSlot").innerHTML = await (await fetch("./common/features/task-add/task-add.html")).text();
  await initMasterViewFeatures((task, dateStr) => updateTaskDueDate(task, dateStr, () => renderFull(false)));
}

function filterTasks(tasks) {
  const { query, status } = getFilterState();
  return tasks.filter(t => {
    if (query && !t.title.toLowerCase().includes(query)) return false;
    if (status === "todo" && (t.isDone || (t.status || "").toLowerCase().includes("progress"))) return false;
    if (status === "in-progress" && (t.isDone || !(t.status || "").toLowerCase().includes("progress"))) return false;
    if (status === "done" && !t.isDone) return false;
    return true;
  });
}

function renderFull(isHardBoot = false) {
  if (!container) return;
  const { status } = getFilterState();
  const filtered = filterTasks(allTasks);

  if (status === "master") {
    updateTelemetry(filtered);
    const prevScroll = container.scrollTop;

    if (isHardBoot) {
      container.innerHTML = renderMasterView(filtered, true);
      attachDateAccordionSync(container);
    } else {
      const currentOpenKeys = new Set();
      container.querySelectorAll("details").forEach(d => {
        if (d.open && d.dataset.accordKey) {
          currentOpenKeys.add(d.dataset.accordKey);
        }
      });

      container.innerHTML = renderMasterView(filtered, false);

      container.querySelectorAll("details").forEach(d => {
        if (d.dataset.accordKey && currentOpenKeys.has(d.dataset.accordKey)) {
          d.open = true;
        }
      });

      attachDateAccordionSync(container);
    }

    container.scrollTop = prevScroll;
    return;
  }

  if (status === "inbox") {
    const inboxList = filtered.filter(isInboxTask);
    updateTelemetry(inboxList);
    const prevScroll = container.scrollTop;

    if (isHardBoot) {
      container.innerHTML = renderInboxView(inboxList, true);
    } else {
      const currentOpenKeys = new Set();
      container.querySelectorAll("details").forEach(d => {
        if (d.open && d.dataset.accordKey) {
          currentOpenKeys.add(d.dataset.accordKey);
        }
      });

      container.innerHTML = renderInboxView(inboxList, false);

      container.querySelectorAll("details").forEach(d => {
        if (d.dataset.accordKey && currentOpenKeys.has(d.dataset.accordKey)) {
          d.open = true;
        }
      });
    }

    container.scrollTop = prevScroll;
    return;
  }

  updateTelemetry(filtered);
  filtered.sort(multiLevelTaskComparator);
  container.innerHTML = filtered.map(t => renderTaskCard(t, true)).join("");
}

container.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  const task = allTasks.find(t => t.id === id);
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
      allTasks = allTasks.filter(t => t.id !== id);
      removeMasterTaskDomInPlace(container, id, () => renderFull(false));
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
      await syncData(false);
    });
  }
});

async function syncData(isHardBoot = false) {
  const refBtn = document.getElementById("refreshBtn");
  if (refBtn) refBtn.classList.add("spinning");

  try {
    allTasks = await fetchAllTasks();
    renderFull(isHardBoot);
  } catch (err) {
    console.error("Sync error:", err);
  } finally {
    if (refBtn) refBtn.classList.remove("spinning");
  }
}

(async () => {
  await loadFragments();
  initFilterToolbar(() => renderFull(false));
  initTaskAdd(() => syncData(false));
  document.getElementById("refreshBtn").addEventListener("click", () => syncData(false));
  await resolvePareshUser();
  await syncData(true);
})();