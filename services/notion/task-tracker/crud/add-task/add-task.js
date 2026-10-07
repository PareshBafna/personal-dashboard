import { TASK_DB_ID, schemaProps, pareshUserId, parseTask } from "/services/notion/common/api/api.client.js";
import { showToast } from "/services/notion/common/toast/toast.js";

export function initAddTask(onTaskCreated) {
  const openBtn = document.getElementById("openNewTaskBtn");
  const modal = document.getElementById("newTaskModal");
  const cancelBtn = document.getElementById("cancelModalBtn");
  const form = document.getElementById("newTaskForm");

  const titleInput = document.getElementById("taskTitleInput");
  const priorityInput = document.getElementById("taskPriorityInput");
  const dateInput = document.getElementById("taskDateInput");
  const timeInput = document.getElementById("taskTimeInput");
  const timeToggle = document.getElementById("taskIncludeTimeToggle");
  const descInput = document.getElementById("taskDescInput");
  const urlInput = document.getElementById("taskUrlInput");
  const submitBtn = document.getElementById("submitTaskBtn");

  const btnToday = document.getElementById("btnDateToday");
  const btnTomorrow = document.getElementById("btnDateTomorrow");
  const btnNoDue = document.getElementById("btnDateNoDue");

  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const fmtTime = (d) => `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;

  function setDateBtnActive(btn) {
    [btnToday, btnTomorrow, btnNoDue].forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
  }

  openBtn.addEventListener("click", () => {
    form.reset();
    priorityInput.value = "Medium";
    dateInput.value = fmt(new Date());
    timeInput.value = fmtTime(new Date());
    timeToggle.checked = false;
    timeInput.classList.add("hidden");
    setDateBtnActive(btnToday);
    modal.classList.add("show");
    titleInput.focus();
  });

  cancelBtn.addEventListener("click", () => modal.classList.remove("show"));
  timeToggle.addEventListener("change", (e) => timeInput.classList.toggle("hidden", !e.target.checked));

  btnToday.addEventListener("click", () => { dateInput.value = fmt(new Date()); setDateBtnActive(btnToday); });
  btnTomorrow.addEventListener("click", () => { const d = new Date(); d.setDate(d.getDate() + 1); dateInput.value = fmt(d); setDateBtnActive(btnTomorrow); });
  btnNoDue.addEventListener("click", () => { dateInput.value = ""; setDateBtnActive(btnNoDue); });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (!title) return;

    const props = {
      [schemaProps.title]: { title: [{ text: { content: title } }] },
      [schemaProps.status]: { status: { name: "Not Started" } }
    };

    if (priorityInput.value && schemaProps.priority) props[schemaProps.priority] = { select: { name: priorityInput.value } };
    if (pareshUserId && schemaProps.person) props[schemaProps.person] = { people: [{ id: pareshUserId }] };

    if (dateInput.value && schemaProps.date) {
      let finalDate = dateInput.value;
      if (timeToggle.checked && timeInput.value) {
        const tVal = timeInput.value.length === 5 ? `${timeInput.value}:00` : timeInput.value;
        finalDate = `${dateInput.value}T${tVal}+05:30`;
      }
      props[schemaProps.date] = { date: { start: finalDate } };
    }

    if (descInput.value.trim() && schemaProps.desc) props[schemaProps.desc] = { rich_text: [{ text: { content: descInput.value.trim() } }] };
    if (urlInput.value.trim() && schemaProps.url) props[schemaProps.url] = { url: urlInput.value.trim() };

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