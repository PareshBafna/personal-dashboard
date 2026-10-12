// File: services/notion/views/today-view/features/status-update/status-update.js

export async function updateTaskStatus(task, newStatus, onDone = null) {
  if (!task || !task.id) return;
  const statusProp = task.statusPropName || "Status";

  try {
    const res = await fetch("/api/notion/update-page", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: task.id,
        properties: {
          [statusProp]: {
            status: { name: newStatus }
          }
        }
      })
    });

    if (!res.ok) {
      // Fallback for select-type status
      await fetch("/api/notion/update-page", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: task.id,
          properties: {
            [statusProp]: {
              select: { name: newStatus }
            }
          }
        })
      });
    }

    task.status = newStatus;
    task.isDone = (newStatus === "Done" || newStatus === "Completed");

    if (typeof onDone === "function") onDone(task);
  } catch (err) {
    console.error("Status update error:", err);
  }
}