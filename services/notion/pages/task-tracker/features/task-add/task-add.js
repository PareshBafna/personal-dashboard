// File: services/notion/task-tracker/common/features/task-add/task-add.js
// Handles modal state, payload building, and task insertion into Notion

import { TASK_DB_ID, schemaProps, pareshUserId, parseTask } from "../../../views/master-view/api/api.client.js";
import { showToast } from "../../../../common/features/toast/toast.js";

export function initTaskAdd(onTaskCreated) {
  const openBtn = document.getElementById("openNewTaskBtn");
  const modal = document.getElementById("newTaskModal");
  const cancelBtn = document.getElementById("cancelModalBtn");
  const crossBtn = document.getElementById("closeModalCrossBtn");
  const form = document.getElementById("newTaskForm");

  const titleInput = document.getElementById("taskTitleInput");
  const priorityInput = document.getElementById("taskPriorityInput");
  const dateInput = document.getElementById("taskDateInput");
  const timeInput = document.getElementById("taskTimeInput");
  const timeToggle = document.getElementById("taskIncludeTimeToggle");
  const timeToggleWrap = document.getElementById("timeToggleWrapper");
  const descInput = document.getElementById("taskDescInput");
  const urlInput = document.getElementById("taskUrlInput");
  const submitBtn = document.getElementById("submitTaskBtn");

  const dateBtns = modal.querySelectorAll(".modal-date-shortcuts .date-btn");
  const prioBtns = modal.querySelectorAll(".modal-prio-shortcuts .prio-btn");

  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const fmtTime = (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  function setDateActive(targetBtn) {
    dateBtns.forEach(b => b.classList.remove("active"));
    if (targetBtn) targetBtn.classList.add("active");
  }

  function setPrioActive(targetBtn, prioVal) {
    prioBtns.forEach(b => b.classList.remove("active"));
    if (targetBtn) targetBtn.classList.add("active");
    priorityInput.value = prioVal;
  }

  openBtn.addEventListener("click", () => {
    form.reset();
    priorityInput.value = "Medium";

    dateInput.value = fmt(new Date());
    dateInput.style.display = "block";

    timeInput.value = fmtTime(new Date());
    timeToggle.checked = false;
    timeInput.classList.add("hidden");
    if (timeToggleWrap) timeToggleWrap.style.display = "inline-flex";

    const todayBtn = modal.querySelector('.date-btn[data-date="today"]');
    setDateActive(todayBtn);

    const medBtn = modal.querySelector('.prio-btn[data-prio="Medium"]');
    setPrioActive(medBtn, "Medium");

    modal.classList.add("show");
    titleInput.focus();
  });

  const closeModal = () => modal.classList.remove("show");
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
      const prio = btn.dataset.prio;
      setPrioActive(btn, prio);
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (!title) return;

    const props = {
      [schemaProps.title]: { title: [{ text: { content: title } }] },
      [schemaProps.status]: { status: { name: "Not Started" } }
    };

    if (priorityInput.value && schemaProps.priority) {
      props[schemaProps.priority] = { select: { name: priorityInput.value } };
    }

    if (pareshUserId && schemaProps.person) {
      props[schemaProps.person] = { people: [{ id: pareshUserId }] };
    }

    if (dateInput.value && schemaProps.date) {
      let finalDate = dateInput.value;
      if (timeToggle.checked && timeInput.value) {
        const tVal = timeInput.value.length === 5 ? `${timeInput.value}:00` : timeInput.value;
        finalDate = `${dateInput.value}T${tVal}+05:30`;
      }
      props[schemaProps.date] = { date: { start: finalDate } };
    }

    if (descInput.value.trim() && schemaProps.desc) {
      props[schemaProps.desc] = { rich_text: [{ text: { content: descInput.value.trim() } }] };
    }

    if (urlInput.value.trim() && schemaProps.url) {
      props[schemaProps.url] = { url: urlInput.value.trim() };
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-rotate spin"></i> Creating...`;

    try {
      const res = await fetch("/api/notion/create-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ databaseId: TASK_DB_ID, properties: props })
      });
      if (!res.ok) throw new Error(await res.text());
      const page = await res.json();
      modal.classList.remove("show");
      showToast("Task created in Notion!");
      onTaskCreated(parseTask(page));
    } catch (err) {
      showToast(`Create failed: ${err.message.slice(0, 45)}`, true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> <span>Create Task</span>`;
    }
  });
}