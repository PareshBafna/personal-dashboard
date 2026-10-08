import { fetchAllTasks, resolvePareshUser, schemaProps } from "../common/api/api.client.js";
import { updateTelemetry } from "./telemetry/telemetry.js";
import { initFilterToolbar, getFilterState } from "./filter-toolbar/filter-toolbar.js";
import { renderMasterView, attachDateAccordionSync } from "./views/master-view/master-view.js";
import { renderInboxView } from "./views/inbox-view/inbox-view.js";
import { renderTaskCard, multiLevelTaskComparator } from "../common/task-card/task-card.js";
import { initAddTask } from "./crud/add-task/add-task.js";
import { updateTaskStatus } from "./crud/update-task/update-task.js";
import { deleteTask } from "./crud/delete-task/delete-task.js";

let allTasks = [];
let activeTaskForDateModal = null;
const container = document.getElementById("tasksContainer");

async function loadFragments() {
  document.getElementById("telemetrySlot").innerHTML = await (await fetch("./telemetry/telemetry.html")).text();
  document.getElementById("toolbarSlot").innerHTML = await (await fetch("./filter-toolbar/filter-toolbar.html")).text();
  document.getElementById("addTaskSlot").innerHTML = await (await fetch("./crud/add-task/add-task.html")).text();
  injectCustomDateModal();
}

function injectCustomDateModal() {
  if (document.getElementById("customDateModal")) return;
  const modalDiv = document.createElement("div");
  modalDiv.id = "customDateModal";
  modalDiv.className = "custom-date-modal-backdrop";
  modalDiv.innerHTML = `
    <div class="custom-date-card">
      <div class="custom-date-header">
        <h4>Select Due Date</h4>
        <button type="button" id="closeCustomDateModalBtn"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="custom-date-body">
        <input type="date" id="customDateInput" required>
        <label class="custom-date-time-toggle">
          <input type="checkbox" id="customDateTimeCheckbox"> Include time
        </label>
        <input type="time" id="customTimeInput" style="display: none;">
      </div>
      <div class="custom-date-footer">
        <button type="button" class="custom-date-btn-cancel" id="cancelCustomDateBtn">Cancel</button>
        <button type="button" class="custom-date-btn-submit" id="saveCustomDateBtn">Save Date</button>
      </div>
    </div>
  `;
  document.body.appendChild(modalDiv);

  const checkbox = document.getElementById("customDateTimeCheckbox");
  const timeInput = document.getElementById("customTimeInput");
  checkbox.addEventListener("change", () => {
    timeInput.style.display = checkbox.checked ? "block" : "none";
  });

  const closeModal = () => {
    modalDiv.classList.remove("show");
    activeTaskForDateModal = null;
  };

  document.getElementById("closeCustomDateModalBtn").addEventListener("click", closeModal);
  document.getElementById("cancelCustomDateBtn").addEventListener("click", closeModal);

  document.getElementById("saveCustomDateBtn").addEventListener("click", async () => {
    const targetTask = activeTaskForDateModal;
    const dateVal = document.getElementById("customDateInput").value;
    if (!dateVal || !targetTask) return;

    let finalDateStr = dateVal;
    if (checkbox.checked && timeInput.value) {
      finalDateStr = `${dateVal}T${timeInput.value}:00.000+05:30`;
    }

    closeModal();
    await updateTaskDueDate(targetTask, finalDateStr);
  });
}

function openCustomDateModal(task) {
  activeTaskForDateModal = task;
  const modal = document.getElementById("customDateModal");
  const dateInput = document.getElementById("customDateInput");
  const timeInput = document.getElementById("customTimeInput");
  const checkbox = document.getElementById("customDateTimeCheckbox");

  const currentDateStr = task.date || task.formulaDate || "";
  const now = new Date();
  const defDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  if (currentDateStr) {
    dateInput.value = currentDateStr.slice(0, 10);
    if (currentDateStr.includes("T")) {
      checkbox.checked = true;
      timeInput.style.display = "block";
      const timePart = currentDateStr.split("T")[1];
      timeInput.value = timePart.slice(0, 5);
    } else {
      checkbox.checked = false;
      timeInput.style.display = "none";
      timeInput.value = "18:00";
    }
  } else {
    dateInput.value = defDate;
    checkbox.checked = false;
    timeInput.style.display = "none";
    timeInput.value = "18:00";
  }

  modal.classList.add("show");
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

function renderFull() {
  if (!container) return;
  const { status } = getFilterState();
  const filtered = filterTasks(allTasks);

  if (status === "master") {
    container.innerHTML = renderMasterView(filtered);
    attachDateAccordionSync(container);
    return;
  }
  if (status === "inbox") {
    container.innerHTML = renderInboxView(filtered);
    return;
  }
  filtered.sort(multiLevelTaskComparator);
  container.innerHTML = filtered.map(t => renderTaskCard(t, true)).join("");
}

function applyTaskUpdateLocally(task) {
  const { status } = getFilterState();
  const filtered = filterTasks(allTasks);

  if (status === "master") {
    const openKeys = new Set();
    container.querySelectorAll("details").forEach(d => {
      if (d.dataset.accordKey && d.open) openKeys.add(d.dataset.accordKey);
    });

    const prevScroll = container.scrollTop;
    container.innerHTML = renderMasterView(filtered);
    attachDateAccordionSync(container);

    container.querySelectorAll("details").forEach(d => {
      if (d.dataset.accordKey && openKeys.has(d.dataset.accordKey)) {
        d.open = true;
      }
    });
    container.scrollTop = prevScroll;
  } else {
    renderFull();
  }

  updateTelemetry(allTasks);
}

// POST endpoint to update task date (handles date string or null for No Due)
async function updateTaskDueDate(task, newDateString) {
  const prevDate = task.date;
  const prevHasTime = task.hasTime;

  task.date = newDateString || "";
  task.hasTime = !!(newDateString && newDateString.includes("T"));
  applyTaskUpdateLocally(task);

  try {
    const propName = schemaProps.date || "Due Date";
    const body = {
      pageId: task.id,
      properties: {
        [propName]: {
          date: newDateString ? { start: newDateString } : null
        }
      }
    };

    const res = await fetch("/api/notion/update-page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(await res.text());
  } catch (err) {
    console.error("Failed to update task date:", err);
    task.date = prevDate;
    task.hasTime = prevHasTime;
    applyTaskUpdateLocally(task);
  }
}

// POST endpoint to update task priority
async function updateTaskPriority(task, newPriority) {
  const prevPrio = task.priority;

  task.priority = newPriority;
  applyTaskUpdateLocally(task);

  try {
    const propName = schemaProps.priority || "Priority";
    const body = {
      pageId: task.id,
      properties: {
        [propName]: {
          select: { name: newPriority }
        }
      }
    };

    const res = await fetch("/api/notion/update-page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(await res.text());
  } catch (err) {
    console.error("Failed to update task priority:", err);
    task.priority = prevPrio;
    applyTaskUpdateLocally(task);
  }
}

function setDateTodayOrTomorrow(task, isTomorrow = false) {
  const now = new Date();
  if (isTomorrow) now.setDate(now.getDate() + 1);

  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const baseDate = `${y}-${m}-${d}`;

  let finalDateStr = baseDate;
  const oldDate = task.date || task.formulaDate || "";
  if (oldDate.includes("T")) {
    const timePart = oldDate.split("T")[1];
    finalDateStr = `${baseDate}T${timePart}`;
  }

  updateTaskDueDate(task, finalDateStr);
}

// In-place DOM update when changing status without re-rendering accordions
function updateTaskDomInPlace(task, nextStatus) {
  const card = container.querySelector(`.checklist-item[data-id="${task.id}"]`);
  if (!card) return;

  const currentColumn = card.closest(".stage4-col-details");
  if (!currentColumn) {
    renderFull();
    return;
  }

  const parentColumnsWrap = currentColumn.closest(".stage4-columns, .stage4-columns-past-due");
  if (!parentColumnsWrap) {
    renderFull();
    return;
  }

  let targetColType = "todo";
  const sLow = (nextStatus || "").toLowerCase();
  if (sLow === "done" || sLow === "completed") {
    targetColType = "done";
  } else if (sLow.includes("progress")) {
    targetColType = "in-progress";
  }

  const targetColumn = parentColumnsWrap.querySelector(`.stage4-col-details[data-col="${targetColType}"]`);
  if (!targetColumn) {
    renderFull();
    return;
  }

  task.status = nextStatus;
  task.isDone = targetColType === "done";

  const temp = document.createElement("div");
  temp.innerHTML = renderTaskCard(task, false, targetColType);
  const newCard = temp.firstElementChild;

  const targetTasksWrap = targetColumn.querySelector(".stage4-col-tasks");
  const currentTasksWrap = currentColumn.querySelector(".stage4-col-tasks");

  card.remove();
  const emptyTargetMsg = targetTasksWrap.querySelector(".empty-col-msg");
  if (emptyTargetMsg) emptyTargetMsg.remove();
  targetTasksWrap.appendChild(newCard);

  if (currentTasksWrap.children.length === 0) {
    currentTasksWrap.innerHTML = `<div class="empty-col-msg" style="font-size: 0.7rem; color: var(--text-dim); padding: 8px 4px; text-align: center;">None</div>`;
  }

  const updateBadge = (col) => {
    if (!col) return;
    const badge = col.querySelector(".badge-count");
    if (badge) {
      badge.textContent = col.querySelectorAll(".checklist-item").length;
    }
  };
  updateBadge(currentColumn);
  updateBadge(targetColumn);

  updateTelemetry(allTasks);
}

function removeTaskDomInPlace(id) {
  const card = container.querySelector(`.checklist-item[data-id="${id}"]`);
  if (!card) return;

  const currentColumn = card.closest(".stage4-col-details");
  const tasksWrap = card.parentElement;
  card.remove();

  if (tasksWrap && tasksWrap.children.length === 0) {
    tasksWrap.innerHTML = `<div class="empty-col-msg" style="font-size: 0.7rem; color: var(--text-dim); padding: 8px 4px; text-align: center;">None</div>`;
  }

  if (currentColumn) {
    const badge = currentColumn.querySelector(".badge-count");
    if (badge) {
      badge.textContent = currentColumn.querySelectorAll(".checklist-item").length;
    }
  }

  allTasks = allTasks.filter(t => t.id !== id);
  updateTelemetry(allTasks);
}

// Global action listener
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
      updateTaskDomInPlace(task, next);
    });
  } else if (action === "status") {
    const targetStatus = btn.dataset.target;
    updateTaskStatus(task, targetStatus, () => {
      updateTaskDomInPlace(task, targetStatus);
    });
  } else if (action === "delete") {
    deleteTask(id, () => {
      removeTaskDomInPlace(id);
    });
  } else if (action === "set-date-nodue") {
    updateTaskDueDate(task, null);
  } else if (action === "set-date-today") {
    setDateTodayOrTomorrow(task, false);
  } else if (action === "set-date-tomorrow") {
    setDateTodayOrTomorrow(task, true);
  } else if (action === "open-date-modal") {
    openCustomDateModal(task);
  } else if (action === "set-priority") {
    const newPrio = btn.dataset.prio;
    if (newPrio && newPrio !== task.priority) {
      updateTaskPriority(task, newPrio);
    }
  }
});

// Sync data preserving existing live DOM accordion open attributes
async function syncData() {
  const refBtn = document.getElementById("refreshBtn");
  if (refBtn) refBtn.classList.add("spinning");

  try {
    const liveOpenKeys = new Set();
    container.querySelectorAll("details").forEach(d => {
      if (d.dataset.accordKey && d.open) {
        liveOpenKeys.add(d.dataset.accordKey);
      }
    });

    const hadExistingDOM = liveOpenKeys.size > 0;
    const prevScroll = container.scrollTop;

    allTasks = await fetchAllTasks();
    updateTelemetry(allTasks);

    const { status } = getFilterState();
    const filtered = filterTasks(allTasks);

    if (status === "master") {
      container.innerHTML = renderMasterView(filtered);
      attachDateAccordionSync(container);

      if (hadExistingDOM) {
        container.querySelectorAll("details").forEach(d => {
          if (d.dataset.accordKey) {
            d.open = liveOpenKeys.has(d.dataset.accordKey);
          }
        });
      }

      container.scrollTop = prevScroll;
    } else {
      renderFull();
    }
  } catch (err) {
    console.error("Sync error:", err);
  } finally {
    if (refBtn) refBtn.classList.remove("spinning");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadFragments();
  initFilterToolbar(() => renderFull());
  initAddTask(() => syncData());
  document.getElementById("refreshBtn").addEventListener("click", syncData);
  await resolvePareshUser();
  await syncData();
});