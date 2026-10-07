import { showToast } from "/services/notion/common/toast/toast.js";

export async function updateTaskStatus(task, targetStatus, onDone) {
  const prevStatus = task.status;
  const prevIsDone = task.isDone;

  task.status = targetStatus;
  task.isDone = targetStatus.toLowerCase() === "done" || targetStatus.toLowerCase() === "completed";
  onDone();

  showToast(`Moved to ${targetStatus} - ${task.title}`);

  try {
    const res = await fetch("/api/notion/update-page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: task.id,
        properties: { [task.statusPropName]: { status: { name: targetStatus } } }
      })
    });
    if (!res.ok) throw new Error(await res.text());
  } catch (err) {
    task.status = prevStatus;
    task.isDone = prevIsDone;
    onDone();
    showToast(`Error: ${err.message.slice(0, 40)}`, true);
  }
}