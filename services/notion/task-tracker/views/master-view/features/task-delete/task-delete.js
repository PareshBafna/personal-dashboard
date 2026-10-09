// File: services/notion/task-tracker/views/master-view/features/task-delete/task-delete.js
// Handles soft-deletion confirmation and Notion page archive requests

import { showToast } from "../../../../../common/features/toast/toast.js";

let deleteModalEl = null;
let pendingDeleteId = null;
let pendingOnSuccess = null;

function ensureDeleteModalCreated() {
  if (deleteModalEl) return;

  const modalHtml = `
    <div id="deleteConfirmModal" class="modal-backdrop">
      <div class="modal-card delete-confirm-card">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <i class="fa-solid fa-triangle-exclamation" style="color: #f43f5e; font-size: 1.1rem;"></i>
            <h3>Delete Task</h3>
          </div>
          <button type="button" id="closeDeleteModalCrossBtn" class="modal-cross-btn" title="Close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="modal-form delete-confirm-body">
          <p class="delete-confirm-text">Are you sure you want to delete this task? This action cannot be undone.</p>

          <div class="single-row-footer">
            <button type="button" id="cancelDeleteModalBtn" class="action-btn secondary-btn modal-btn">Cancel</button>
            <button type="button" id="confirmDeleteModalBtn" class="action-btn modal-btn btn-danger-delete">
              <i class="fa-solid fa-trash"></i>
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

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
      const res = await fetch("/api/notion/update-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: targetId,
          properties: {},
          archived: true
        })
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

export function deleteTask(pageId, onSuccess) {
  ensureDeleteModalCreated();
  pendingDeleteId = pageId;
  pendingOnSuccess = onSuccess;
  deleteModalEl.classList.add("show");
}