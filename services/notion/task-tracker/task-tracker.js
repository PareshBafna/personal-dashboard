import { fetchAllTasks, resolvePareshUser, schemaProps } from "../common/api/api.client.js";
import { updateTelemetry } from "./telemetry/telemetry.js";
import { initFilterToolbar, getFilterState } from "./filter-toolbar/filter-toolbar.js";
import { renderMasterView, attachDateAccordionSync } from "./views/master-view/master-view.js";
import { renderInboxView, isInboxTask, computeExpected, getFormulaDueRaw, toFormulaStamp, getDueRaw, toLocalDateString } from "./views/inbox-view/inbox-view.js";
import { renderTaskCard, multiLevelTaskComparator } from "../common/task-card/task-card.js";
import { initAddTask } from "./crud/add-task/add-task.js";
import { updateTaskStatus, openUpdateTaskModal } from "./crud/update-task/update-task.js";
import { deleteTask } from "./crud/delete-task/delete-task.js";
import { showToast } from "../common/toast/toast.js";

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
      finalDateStr = `${dateVal}T${timeInput.value}:00+05:30`;
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
  const defDate = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

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

async function updateTaskDueDate(task, newDateString) {
  const prevDate = task.date;
  const prevHasTime = task.hasTime;

  task.date = newDateString || "";
  task.hasTime = !!(newDateString && newDateString.includes("T"));

  renderFull(false);

  try {
    const propName = resolveDueDatePropName(task);
    const dateObj = newDateString ? { start: newDateString } : null;

    const body = {
      pageId: task.id,
      properties: {
        [propName]: {
          date: dateObj
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
    renderFull(false);
  }
}

async function updateTaskPriority(task, newPriority) {
  const prevPrio = task.priority;
  task.priority = newPriority;

  renderFull(false);

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
    renderFull(false);
  }
}

function setDateTodayOrTomorrow(task, isTomorrow = false) {
  const now = new Date();
  if (isTomorrow) now.setDate(now.getDate() + 1);

  const baseDate = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  let finalDateStr = baseDate;
  const oldDate = task.date || task.formulaDate || "";
  if (oldDate.includes("T")) {
    const timeMatch = oldDate.match(/T(\d{2}:\d{2}(?::\d{2})?)/);
    const timePart = timeMatch ? timeMatch[1] : "18:00:00";
    finalDateStr = `${baseDate}T${timePart}+05:30`;
  }

  updateTaskDueDate(task, finalDateStr);
}

function resolveDueDatePropName(task) {
  if (task.datePropName) return task.datePropName;
  if (schemaProps.date) return schemaProps.date;
  const props = task.properties || {};
  for (const [key, p] of Object.entries(props)) {
    if (p.type === "date") return key;
  }
  return "Due Date";
}

// Preserve current Due Date day, apply correct IST target time!
function getResolvedExpectedIstIso(task) {
  const dueRaw = getDueRaw(task);
  const curDay = toLocalDateString(dueRaw); // Keeps original calendar date YYYY-MM-DD
  if (!curDay) return null;

  const exp = computeExpected(task);
  let targetStamp = exp && exp.istStamp ? exp.istStamp : toFormulaStamp(getFormulaDueRaw(task));

  if (!targetStamp) return null;

  // Extract HH:mm:ss
  const m = targetStamp.match(/(\d{2}:\d{2}(?::\d{2})?)/);
  if (m) {
    let timePart = m[1];
    if (timePart.length === 5) timePart += ":00";
    // Lock to curDay, NEVER yesterday!
    return `${curDay}T${timePart}+05:30`;
  }

  return curDay;
}

async function triggerFixDueDate(task, btn) {
  const finalDateStr = getResolvedExpectedIstIso(task);
  if (!finalDateStr) {
    showToast("Could not compute expected due date", true);
    return;
  }

  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-rotate spin"></i> Fixing...`;

  try {
    const propName = resolveDueDatePropName(task);

    const res = await fetch("/api/notion/update-page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: task.id,
        properties: {
          [propName]: {
            date: {
              start: finalDateStr
            }
          }
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText);
    }

    showToast("Due date updated");
    await syncData(false);
  } catch (err) {
    console.error("Fix Due Date error:", err);
    showToast(`Fix failed: ${err.message.slice(0, 45)}`, true);
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

function updateTaskDomInPlace(task, nextStatus) {
  const card = container.querySelector(`.checklist-item[data-id="${task.id}"]`);
  if (!card) return;

  const currentColumn = card.closest(".stage4-col-details");
  if (!currentColumn) {
    renderFull(false);
    return;
  }

  const parentColumnsWrap = currentColumn.closest(".stage4-columns, .stage4-columns-past-due");
  if (!parentColumnsWrap) {
    renderFull(false);
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
    renderFull(false);
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

  renderFull(false);
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
  renderFull(false);
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
  } else if (action === "open-update-modal") {
    openUpdateTaskModal(task, () => {
      renderFull(false);
    });
  } else if (action === "fix-due-date") {
    triggerFixDueDate(task, btn);
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

// Module entry
(async () => {
  await loadFragments();
  initFilterToolbar(() => renderFull(false));
  initAddTask(() => syncData(false));
  document.getElementById("refreshBtn").addEventListener("click", () => syncData(false));
  await resolvePareshUser();
  await syncData(true);
})();