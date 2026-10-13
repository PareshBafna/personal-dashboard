// File: services/notion/task-tracker/views/master-view/features/priority-update/priority-update.js
// Priority badge and button update handler for Master View tasks

import { schemaProps } from "../../api/api.client.js";

export async function updateTaskPriority(task, newPriority, onDone) {
  const prevPrio = task.priority;
  task.priority = newPriority;

  if (typeof onDone === "function") onDone();

  try {
    const propName = schemaProps.priority || task.priorityPropName || "Priority";
    const body = {
      pageId: task.id,
      properties: {
        [propName]: {
          select: { name: newPriority }
        }
      }
    };

    const res = await fetch("/api/notion/update-page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(await res.text());
  } catch (err) {
    console.error("Failed to update task priority:", err);
    task.priority = prevPrio;
    if (typeof onDone === "function") onDone();
  }
}