// File: services/notion/task-tracker/views/inbox-view/api/api.client.js

export const TASK_DB_ID = "1a4fa716-53ca-8189-a7b5-d1e9b9ae9a5b";

export const schemaProps = {
  title: "Title",
  status: "Status",
  priority: "Priority",
  date: "Due Date"
};

export function parseInboxTask(page) {
  const props = page.properties || {};
  let title = "Untitled Task";

  for (const [key, p] of Object.entries(props)) {
    if (p.type === "title") {
      schemaProps.title = key;
      if (p.title && p.title.length > 0) {
        title = p.title.map(t => t.plain_text || t.text?.content || "").join("").trim() || title;
      }
      break;
    }
  }

  let rawStatusName = "";
  let isDone = false;
  for (const [key, p] of Object.entries(props)) {
    if (p.type === "status") {
      schemaProps.status = key;
      rawStatusName = p.status?.name || "";
      break;
    }
    if (p.type === "checkbox" && p.checkbox) {
      isDone = true;
    }
  }

  const sLower = rawStatusName.toLowerCase().trim();
  if (sLower === "done" || sLower === "completed" || sLower.includes("finish") || sLower.includes("closed")) {
    isDone = true;
  }

  let priority = "Medium";
  for (const [key, p] of Object.entries(props)) {
    if (key.toLowerCase().includes("priority") || (p.type === "select" && ["critical", "high", "medium", "low", "lowest"].includes((p.select?.name || "").toLowerCase()))) {
      schemaProps.priority = key;
      priority = p.select?.name || p.status?.name || priority;
      break;
    }
  }

  let rawNativeDate = "";
  for (const [key, p] of Object.entries(props)) {
    if (p.type === "date" && p.date?.start) {
      schemaProps.date = key;
      rawNativeDate = p.date.start;
      break;
    }
  }

  // Exact check from Notion property:
  let missingDataString = "";
  for (const [key, p] of Object.entries(props)) {
    if (key.trim().toLowerCase() === "missing data") {
      if (p.type === "formula" && p.formula?.string) {
        missingDataString = p.formula.string.trim();
      } else {
        const raw = JSON.stringify(p || {});
        if (raw.includes("Incorrect Due Date")) missingDataString = "❌ Incorrect Due Date";
        else if (raw.includes("Empty Due Date")) missingDataString = "❌ Empty Due Date";
      }
      break;
    }
  }

  const createdTime = page.created_time || props["Created Time"]?.created_time || props["Created time"]?.created_time || "";

  return {
    id: page.id,
    url: page.url || `https://notion.so/${page.id.replace(/-/g, "")}`,
    title,
    status: rawStatusName || (isDone ? "Done" : "Not Started"),
    isDone,
    priority,
    date: rawNativeDate ? String(rawNativeDate).trim() : "",
    nativeDate: rawNativeDate ? String(rawNativeDate).trim() : "",
    hasTime: !!(rawNativeDate && rawNativeDate.includes("T")),
    createdTime,
    missingDataString,
    properties: props,
    datePropName: schemaProps.date,
    lastEdited: page.last_edited_time
  };
}

export async function fetchInboxTasks() {
  const payload = {
    databaseId: TASK_DB_ID,
    page_size: 100
  };

  const res = await fetch("/api/notion/query-database", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) return [];

  const data = await res.json();
  const list = [];
  (data.results || []).forEach(p => {
    list.push(parseInboxTask(p));
  });

  return list;
}