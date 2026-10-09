// File: services/notion/task-tracker/views/master-view/features/status-update/status-update.js
// Handles status mutations and in-progress/done transitions for Master View

import { schemaProps } from "../../api/api.client.js";
import { showToast } from "../../../../../common/features/toast/toast.js";

export async function updateTaskStatus(task, targetStatus, onDone) {
  const prevStatus = task.status;
  const prevIsDone = task.isDone;

  task.status = targetStatus;
  task.isDone = targetStatus.toLowerCase() === "done" || targetStatus.toLowerCase() === "completed";
  if (typeof onDone === "function") onDone();

  showToast(`Moved to ${targetStatus} - ${task.title}`);

  try {
    const res = await fetch("/api/notion/update-page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: task.id,
        properties: { [task.statusPropName || schemaProps.status || "Status"]: { status: { name: targetStatus } } }
      })
    });
    if (!res.ok) throw new Error(await res.text());
  } catch (err) {
    task.status = prevStatus;
    task.isDone = prevIsDone;
    if (typeof onDone === "function") onDone();
    showToast(`Error: ${err.message.slice(0, 40)}`, true);
  }
}