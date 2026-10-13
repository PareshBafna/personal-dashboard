// File: services/notion/pages/task-tracker/views/master-view/features/task-delete/task-delete.js

import { showToast } from "../../../../../../features/toast/toast.js";

let deleteModalEl = null;
let pendingDeleteId = null;
let pendingOnSuccess = null;

async function ensureDeleteModalCreated() {
  if (deleteModalEl) return;

  const res = await fetch("./views/master-view/features/task-delete/task-delete.html");
  const modalHtml = await res.text();
  document.body.insertAdjacentHTML("beforeend", modalHtml);
  deleteModalEl = document.getElementById("deleteConfirmModal");

  const cancelBtn = document.getElementById("cancelDeleteModalBtn");
  const crossBtn = document.getElementById("closeDeleteModalCrossBtn");
  const confirmBtn = document.getElementById("confirmDeleteModalBtn");

  const closeModal = () => {
    deleteModalEl.classList.remove("show");
    pendingDeleteId = null;
    pendingOnSuccess = null;
  };

  cancelBtn.addEventListener("click", closeModal);
  crossBtn.addEventListener("click", closeModal);

  confirmBtn.addEventListener("click", async () => {
    if (!pendingDeleteId) return;

    const targetId = pendingDeleteId;
    const onSuccess = pendingOnSuccess;

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `<i class="fa-solid fa-rotate spin"></i> Deleting...`;

    try {
      const res = await fetch("/api/notion/delete-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: targetId })
      });

      if (!res.ok) throw new Error(await res.text());

      closeModal();
      showToast("Task deleted successfully");
      if (typeof onSuccess === "function") onSuccess();
    } catch (err) {
      showToast(`Delete failed: ${err.message.slice(0, 45)}`, true);
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = `<i class="fa-solid fa-trash"></i> <span>Delete</span>`;
    }
  });
}

export async function deleteTask(pageId, onSuccess) {
  await ensureDeleteModalCreated();
  pendingDeleteId = pageId;
  pendingOnSuccess = onSuccess;
  deleteModalEl.classList.add("show");
}