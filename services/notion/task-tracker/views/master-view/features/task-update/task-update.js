// File: services/notion/task-tracker/views/master-view/features/task-update/task-update.js
// STRICTLY handles update modal form creation, field population, and Notion page saves

import { schemaProps } from "../../api/api.client.js";
import { showToast } from "../../../../../common/features/toast/toast.js";

let updateModalEl = null;
let currentTask = null;
let onTaskUpdatedCallback = null;

function ensureUpdateModalCreated() {
  if (updateModalEl) return;

  const modalHtml = `
    <div id="updateTaskModal" class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <i class="fa-solid fa-pen-to-square" style="color: var(--notion-grey-primary); font-size: 1.1rem;"></i>
            <h3>Update Task</h3>
          </div>
          <button type="button" id="closeUpdateModalCrossBtn" class="modal-cross-btn" title="Close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form id="updateTaskForm" class="modal-form">
          <div class="form-group">
            <label for="updateTaskTitleInput">Task Name *</label>
            <textarea id="updateTaskTitleInput" class="task-title-textarea" rows="3" placeholder="What needs to be done?" required></textarea>
          </div>

          <div class="form-group date-block">
            <div class="date-header-row">
              <label>Due Date</label>
              <label class="time-toggle-label" id="updateTimeToggleWrapper">
                <input type="checkbox" id="updateTaskIncludeTimeToggle" />
                <span>Include Time</span>
              </label>
            </div>

            <div class="modal-date-shortcuts" id="updateModalDateShortcuts">
              <button type="button" class="modal-action-btn date-btn" data-date="nodue">
                <i class="fa-solid fa-calendar-xmark"></i> No Due
              </button>
              <button type="button" class="modal-action-btn date-btn" data-date="today">
                <i class="fa-regular fa-calendar-check"></i> Today
              </button>
              <button type="button" class="modal-action-btn date-btn" data-date="tomorrow">
                <i class="fa-regular fa-calendar-plus"></i> Tomorrow
              </button>
              <button type="button" class="modal-action-btn date-btn" data-date="custom">
                <i class="fa-regular fa-calendar-days"></i> Custom
              </button>
            </div>

            <div class="date-inputs-row" style="margin-top: 6px;">
              <input type="date" id="updateTaskDateInput" />
              <input type="time" id="updateTaskTimeInput" class="time-input hidden" />
            </div>
          </div>

          <div class="form-group">
            <label>Priority</label>
            <input type="hidden" id="updateTaskPriorityInput" value="Medium" />
            <div class="modal-prio-shortcuts" id="updateModalPrioShortcuts">
              <button type="button" class="modal-action-btn prio-btn prio-btn-critical" data-prio="Critical">
                <i class="fa-solid fa-angles-up"></i> Critical
              </button>
              <button type="button" class="modal-action-btn prio-btn prio-btn-high" data-prio="High">
                <i class="fa-solid fa-chevron-up"></i> High
              </button>
              <button type="button" class="modal-action-btn prio-btn prio-btn-medium" data-prio="Medium">
                <i class="fa-solid fa-equals"></i> Medium
              </button>
              <button type="button" class="modal-action-btn prio-btn prio-btn-low" data-prio="Low">
                <i class="fa-solid fa-chevron-down"></i> Low
              </button>
              <button type="button" class="modal-action-btn prio-btn prio-btn-lowest" data-prio="Lowest">
                <i class="fa-solid fa-angles-down"></i> Lowest
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="updateTaskDescInput">Description (Optional)</label>
            <textarea id="updateTaskDescInput" rows="2" placeholder="Add extra context or notes..."></textarea>
          </div>

          <div class="form-group">
            <label for="updateTaskUrlInput">URL (Optional)</label>
            <input type="url" id="updateTaskUrlInput" placeholder="https://..." autocomplete="off" />
          </div>

          <div class="form-group">
            <label>Person</label>
            <div class="person-field-pill">
              <i class="fa-solid fa-user-circle"></i>
              <span id="updatePersonNameDisplay">Paresh Bafna</span>
            </div>
          </div>

          <div class="modal-footer single-row-footer">
            <button type="button" id="cancelUpdateModalBtn" class="action-btn secondary-btn modal-btn">Cancel</button>
            <button type="submit" id="submitUpdateTaskBtn" class="action-btn primary-btn modal-btn">
              <i class="fa-solid fa-floppy-disk"></i>
              <span>Update Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHtml);
  updateModalEl = document.getElementById("updateTaskModal");

  const cancelBtn = document.getElementById("cancelUpdateModalBtn");
  const crossBtn = document.getElementById("closeUpdateModalCrossBtn");
  const form = document.getElementById("updateTaskForm");
  const dateInput = document.getElementById("updateTaskDateInput");
  const timeInput = document.getElementById("updateTaskTimeInput");
  const timeToggle = document.getElementById("updateTaskIncludeTimeToggle");
  const timeToggleWrap = document.getElementById("updateTimeToggleWrapper");
  const priorityInput = document.getElementById("updateTaskPriorityInput");
  const titleInput = document.getElementById("updateTaskTitleInput");
  const descInput = document.getElementById("updateTaskDescInput");
  const urlInput = document.getElementById("updateTaskUrlInput");
  const submitBtn = document.getElementById("submitUpdateTaskBtn");

  const dateBtns = updateModalEl.querySelectorAll("#updateModalDateShortcuts .date-btn");
  const prioBtns = updateModalEl.querySelectorAll("#updateModalPrioShortcuts .prio-btn");

  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  function setDateActive(targetBtn) {
    dateBtns.forEach(b => b.classList.remove("active"));
    if (targetBtn) targetBtn.classList.add("active");
  }

  function setPrioActive(targetBtn, prioVal) {
    prioBtns.forEach(b => b.classList.remove("active"));
    if (targetBtn) targetBtn.classList.add("active");
    priorityInput.value = prioVal;
  }

  const closeModal = () => updateModalEl.classList.remove("show");
  cancelBtn.addEventListener("click", closeModal);
  if (crossBtn) crossBtn.addEventListener("click", closeModal);

  timeToggle.addEventListener("change", (e) => {
    timeInput.classList.toggle("hidden", !e.target.checked);
  });

  dateBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.date;
      setDateActive(btn);

      if (type === "nodue") {
        dateInput.value = "";
        dateInput.style.display = "none";
        timeToggle.checked = false;
        timeInput.classList.add("hidden");
        if (timeToggleWrap) timeToggleWrap.style.display = "none";
      } else {
        dateInput.style.display = "block";
        if (timeToggleWrap) timeToggleWrap.style.display = "inline-flex";

        if (type === "today") {
          dateInput.value = fmt(new Date());
        } else if (type === "tomorrow") {
          const tom = new Date();
          tom.setDate(tom.getDate() + 1);
          dateInput.value = fmt(tom);
        } else if (type === "custom") {
          dateInput.focus();
        }
      }
    });
  });

  prioBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      setPrioActive(btn, btn.dataset.prio);
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentTask) return;

    const title = titleInput.value.trim();
    if (!title) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-rotate spin"></i> Updating...`;

    const props = {
      [schemaProps.title || "Task name"]: {
        title: [{ text: { content: title } }]
      }
    };

    if (priorityInput.value && (schemaProps.priority || currentTask.priorityPropName)) {
      const pProp = schemaProps.priority || currentTask.priorityPropName || "Priority";
      props[pProp] = { select: { name: priorityInput.value } };
    }

    if (schemaProps.date || currentTask.datePropName) {
      const dProp = schemaProps.date || currentTask.datePropName || "Due date";
      let finalDate = null;
      if (dateInput.value) {
        finalDate = dateInput.value;
        if (timeToggle.checked && timeInput.value) {
          const tVal = timeInput.value.length === 5 ? `${timeInput.value}:00` : timeInput.value;
          finalDate = `${dateInput.value}T${tVal}+05:30`;
        }
      }
      props[dProp] = finalDate ? { date: { start: finalDate } } : { date: null };
    }

    if (schemaProps.desc || currentTask.descPropName) {
      const descProp = schemaProps.desc || currentTask.descPropName || "Description";
      const descVal = descInput.value.trim();
      props[descProp] = descVal
        ? { rich_text: [{ text: { content: descVal } }] }
        : { rich_text: [] };
    }

    if (schemaProps.url || currentTask.urlPropName) {
      const urlProp = schemaProps.url || currentTask.urlPropName || "URL";
      const urlVal = urlInput.value.trim();
      props[urlProp] = urlVal ? { url: urlVal } : { url: null };
    }

    try {
      const res = await fetch("/api/notion/update-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: currentTask.id,
          properties: props
        })
      });

      if (!res.ok) throw new Error(await res.text());

      currentTask.title = title;
      currentTask.priority = priorityInput.value;
      if (dateInput.value) {
        currentTask.hasTime = Boolean(timeToggle.checked && timeInput.value);
        currentTask.date = currentTask.hasTime ? `${dateInput.value}T${timeInput.value}:00+05:30` : dateInput.value;
      } else {
        currentTask.date = "";
        currentTask.hasTime = false;
      }
      currentTask.description = descInput.value.trim();
      currentTask.customUrl = urlInput.value.trim();

      closeModal();
      showToast("Task updated successfully!");

      if (typeof onTaskUpdatedCallback === "function") {
        onTaskUpdatedCallback(currentTask);
      }
    } catch (err) {
      showToast(`Update failed: ${err.message.slice(0, 45)}`, true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> <span>Update Task</span>`;
    }
  });
}

export function openUpdateTaskModal(task, onDone) {
  ensureUpdateModalCreated();
  currentTask = task;
  onTaskUpdatedCallback = onDone;

  const form = document.getElementById("updateTaskForm");
  form.reset();

  const titleInput = document.getElementById("updateTaskTitleInput");
  const priorityInput = document.getElementById("updateTaskPriorityInput");
  const dateInput = document.getElementById("updateTaskDateInput");
  const timeInput = document.getElementById("updateTaskTimeInput");
  const timeToggle = document.getElementById("updateTaskIncludeTimeToggle");
  const timeToggleWrap = document.getElementById("updateTimeToggleWrapper");
  const descInput = document.getElementById("updateTaskDescInput");
  const urlInput = document.getElementById("updateTaskUrlInput");
  const dateBtns = updateModalEl.querySelectorAll("#updateModalDateShortcuts .date-btn");
  const prioBtns = updateModalEl.querySelectorAll("#updateModalPrioShortcuts .prio-btn");

  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const todayStr = fmt(new Date());
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  const tomStr = fmt(tom);

  titleInput.value = task.title || "";

  const rawDate = task.date || task.formulaDate || "";
  dateBtns.forEach(b => b.classList.remove("active"));

  if (!rawDate.trim()) {
    dateInput.value = "";
    dateInput.style.display = "none";
    timeToggle.checked = false;
    timeInput.classList.add("hidden");
    if (timeToggleWrap) timeToggleWrap.style.display = "none";
    updateModalEl.querySelector('.date-btn[data-date="nodue"]')?.classList.add("active");
  } else {
    dateInput.style.display = "block";
    if (timeToggleWrap) timeToggleWrap.style.display = "inline-flex";

    const hasTime = rawDate.includes("T");
    const [d, t] = rawDate.split("T");
    dateInput.value = d;

    if (d === todayStr) {
      updateModalEl.querySelector('.date-btn[data-date="today"]')?.classList.add("active");
    } else if (d === tomStr) {
      updateModalEl.querySelector('.date-btn[data-date="tomorrow"]')?.classList.add("active");
    } else {
      updateModalEl.querySelector('.date-btn[data-date="custom"]')?.classList.add("active");
    }

    timeToggle.checked = hasTime;
    timeInput.classList.toggle("hidden", !hasTime);
    timeInput.value = (hasTime && t) ? t.slice(0, 5) : "18:00";
  }

  const prio = task.priority || "Medium";
  priorityInput.value = prio;
  prioBtns.forEach(b => {
    b.classList.toggle("active", b.dataset.prio.toLowerCase() === prio.toLowerCase());
  });

  descInput.value = task.description || "";
  urlInput.value = task.customUrl || "";

  updateModalEl.classList.add("show");
  titleInput.focus();
}