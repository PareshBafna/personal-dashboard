import { showToast } from "/services/notion/common/toast/toast.js";

export async function deleteTask(taskId, onDeleted) {
  try {
    const res = await fetch("/api/notion/delete-page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: taskId })
    });
    if (!res.ok) throw new Error(await res.text());
    showToast("Task archived");
    onDeleted(taskId);
  } catch (err) {
    showToast(`Delete error: ${err.message.slice(0, 40)}`, true);
  }
}