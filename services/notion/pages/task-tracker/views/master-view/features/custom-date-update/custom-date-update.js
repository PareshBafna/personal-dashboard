// File: services/notion/task-tracker/views/master-view/features/custom-date-update/custom-date-update.js
// Custom date picker modal controller for Master View

let activeTaskForDateModal = null;
let onDateSavedCallback = null;

export function initCustomDateModal(onSave) {
  onDateSavedCallback = onSave;

  const modal = document.getElementById("customDateModal");
  if (!modal) return;

  const checkbox = document.getElementById("customDateTimeCheckbox");
  const timeInput = document.getElementById("customTimeInput");
  const closeBtn = document.getElementById("closeCustomDateModalBtn");
  const cancelBtn = document.getElementById("cancelCustomDateBtn");
  const saveBtn = document.getElementById("saveCustomDateBtn");

  checkbox.addEventListener("change", () => {
    timeInput.style.display = checkbox.checked ? "block" : "none";
  });

  const closeModal = () => {
    modal.classList.remove("show");
    activeTaskForDateModal = null;
  };

  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  saveBtn.addEventListener("click", async () => {
    const targetTask = activeTaskForDateModal;
    const dateVal = document.getElementById("customDateInput").value;
    if (!dateVal || !targetTask) return;

    let finalDateStr = dateVal;
    if (checkbox.checked && timeInput.value) {
      finalDateStr = `${dateVal}T${timeInput.value}:00+05:30`;
    }

    closeModal();
    if (typeof onDateSavedCallback === "function") {
      await onDateSavedCallback(targetTask, finalDateStr);
    }
  });
}

export function openCustomDateModal(task) {
  activeTaskForDateModal = task;
  const modal = document.getElementById("customDateModal");
  if (!modal) return;

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