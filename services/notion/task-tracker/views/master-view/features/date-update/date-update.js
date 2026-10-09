// File: services/notion/task-tracker/views/master-view/features/date-update/date-update.js
// Quick date shortcut operations (Today, Tomorrow, No Due) for Master View tasks

import { schemaProps } from "../../api/api.client.js";

function resolveDueDatePropName(task) {
  if (task.datePropName) return task.datePropName;
  if (schemaProps.date) return schemaProps.date;
  const props = task.properties || {};
  for (const [key, p] of Object.entries(props)) {
    if (p.type === "date") return key;
  }
  return "Due Date";
}

export async function updateTaskDueDate(task, newDateString, onDone) {
  const prevDate = task.date;
  const prevHasTime = task.hasTime;

  task.date = newDateString || "";
  task.hasTime = !!(newDateString && newDateString.includes("T"));

  if (typeof onDone === "function") onDone();

  try {
    const propName = resolveDueDatePropName(task);
    const dateObj = newDateString ? { start: newDateString } : null;

    const body = {
      pageId: task.id,
      properties: {
        [propName]: {
          date: dateObj
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
    console.error("Failed to update task date:", err);
    task.date = prevDate;
    task.hasTime = prevHasTime;
    if (typeof onDone === "function") onDone();
  }
}

export function setDateTodayOrTomorrow(task, isTomorrow = false, onDone) {
  const now = new Date();
  if (isTomorrow) now.setDate(now.getDate() + 1);

  const baseDate = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  let finalDateStr = baseDate;
  const oldDate = task.date || task.formulaDate || "";
  if (oldDate.includes("T")) {
    const timeMatch = oldDate.match(/T(\d{2}:\d{2}(?::\d{2})?)/);
    const timePart = timeMatch ? timeMatch[1] : "18:00:00";
    finalDateStr = `${baseDate}T${timePart}+05:30`;
  }

  updateTaskDueDate(task, finalDateStr, onDone);
}