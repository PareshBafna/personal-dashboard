// File: services/notion/pages/task-tracker/views/master-view/features/task-duplicate/task-duplicate.js

import { TASK_DB_ID, parseTask } from "../../api/api.client.js";
import { showToast } from "../../../../../../features/toast/toast.js";

function prepareDuplicateProperties(task) {
  const originalProps = task.properties || {};
  const cleanProps = {};

  const readOnlyTypes = new Set([
    "formula",
    "rollup",
    "created_time",
    "created_by",
    "last_edited_time",
    "last_edited_by"
  ]);

  let priorityKey = null;

  for (const [key, prop] of Object.entries(originalProps)) {
    if (!prop || readOnlyTypes.has(prop.type)) continue;

    const kLower = key.trim().toLowerCase();

    if (prop.type === "title") {
      const origTitle = task.title || "Untitled Task";
      cleanProps[key] = {
        title: [{ text: { content: `${origTitle} - Duplicated` } }]
      };
      continue;
    }

    if (prop.type === "status") {
      if (kLower === "priority") {
        priorityKey = key;
        const prioVal = task.priority || prop.status?.name || "Medium";
        cleanProps[key] = { status: { name: prioVal } };
      } else {
        cleanProps[key] = { status: { name: prop.status?.name || "Not Started" } };
      }
      continue;
    }

    if (prop.type === "select") {
      if (kLower === "priority") {
        priorityKey = key;
        const prioVal = task.priority || prop.select?.name || "Medium";
        cleanProps[key] = { select: { name: prioVal } };
      } else if (prop.select?.name) {
        cleanProps[key] = { select: { name: prop.select.name } };
      }
      continue;
    }

    if (prop.type === "multi_select") {
      if (Array.isArray(prop.multi_select)) {
        cleanProps[key] = {
          multi_select: prop.multi_select.map(item => ({ name: item.name }))
        };
      }
      continue;
    }

    if (prop.type === "date") {
      const startVal = prop.date?.start || task.nativeDate || task.date;
      if (startVal) {
        cleanProps[key] = {
          date: {
            start: startVal,
            ...(prop.date?.end ? { end: prop.date.end } : {})
          }
        };
      }
      continue;
    }

    if (prop.type === "people") {
      if (Array.isArray(prop.people) && prop.people.length > 0) {
        cleanProps[key] = {
          people: prop.people.map(p => ({ id: p.id }))
        };
      }
      continue;
    }

    if (prop.type === "rich_text") {
      const text = Array.isArray(prop.rich_text)
        ? prop.rich_text.map(t => t.plain_text || t.text?.content || "").join("")
        : "";
      if (text) {
        cleanProps[key] = { rich_text: [{ text: { content: text } }] };
      }
      continue;
    }

    if (prop.type === "url") {
      if (prop.url) cleanProps[key] = { url: prop.url };
      continue;
    }

    if (prop.type === "checkbox") {
      cleanProps[key] = { checkbox: !!prop.checkbox };
      continue;
    }

    if (prop.type === "number") {
      if (typeof prop.number === "number") cleanProps[key] = { number: prop.number };
      continue;
    }

    if (prop.type === "email") {
      if (prop.email) cleanProps[key] = { email: prop.email };
      continue;
    }

    if (prop.type === "phone_number") {
      if (prop.phone_number) cleanProps[key] = { phone_number: prop.phone_number };
      continue;
    }
  }

  if (!priorityKey && task.priority) {
    cleanProps["Priority"] = { select: { name: task.priority } };
  }

  return cleanProps;
}

export async function duplicateTask(task, onDone) {
  const props = prepareDuplicateProperties(task);

  showToast(`Duplicating "${task.title}"...`);

  try {
    const res = await fetch("/api/notion/create-page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        databaseId: TASK_DB_ID,
        properties: props
      })
    });

    if (!res.ok) throw new Error(await res.text());

    const createdPage = await res.json();
    const newTask = parseTask(createdPage);

    showToast("Task duplicated successfully!");

    if (typeof onDone === "function") {
      onDone(newTask);
    }
  } catch (err) {
    console.error("Duplicate task error:", err);
    showToast(`Duplicate failed: ${err.message.slice(0, 45)}`, true);
  }
}