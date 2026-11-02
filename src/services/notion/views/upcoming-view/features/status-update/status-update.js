// File: services/notion/views/upcoming-view/features/status-update/status-update.js

export async function updateUpcomingTaskStatus(task, newStatus, onComplete) {
  try {
    const res = await fetch(`/api/notion/update-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: task.id, status: newStatus })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    task.status = newStatus;
    if (newStatus.toLowerCase().includes("done") || newStatus.toLowerCase().includes("complete")) {
      task.isDone = true;
    }
    if (typeof onComplete === "function") onComplete();
  } catch (err) {
    console.error("Status update error:", err);
    alert("Failed to update status: " + err.message);
    if (typeof onComplete === "function") onComplete();
  }
}