export const TASK_DB_ID = "1a4fa716-53ca-8189-a7b5-d1e9b9ae9a5b";

export const schemaProps = {
  title: "Title",
  status: "Status",
  priority: "Priority",
  date: "Due Date",
  person: null,
  desc: null,
  url: null,
  recurring: null
};

export let pareshUserId = null;

export async function resolvePareshUser() {
  try {
    const res = await fetch("/api/notion/users");
    if (!res.ok) return;
    const data = await res.json();
    const user = (data.results || []).find(u => (u.name || "").toLowerCase().includes("paresh"));
    if (user && user.id) pareshUserId = user.id;
  } catch (err) {
    console.warn("Could not resolve Notion user ID:", err);
  }
}

export function parseTask(page) {
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
    if (p.type === "checkbox" && p.checkbox) isDone = true;
  }

  if (!rawStatusName) {
    for (const [key, p] of Object.entries(props)) {
      if (p.type === "select" && (key.toLowerCase().includes("status") || key.toLowerCase().includes("state"))) {
        schemaProps.status = key;
        rawStatusName = p.select?.name || "";
        break;
      }
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

  let isRecurring = false;
  for (const [key, p] of Object.entries(props)) {
    const k = key.toLowerCase();
    if (k.includes("recur") || k.includes("repeat") || k.includes("frequency") || k.includes("cycle")) {
      schemaProps.recurring = key;
      if ((p.type === "checkbox" && p.checkbox) || (p.type === "select" && p.select?.name) || (p.type === "multi_select" && p.multi_select?.length > 0) || (p.type === "formula" && (p.formula?.boolean || p.formula?.string))) {
        isRecurring = true;
      }
    }
  }

  if (title.toLowerCase().includes("[recurring]") || title.includes("🔁") || title.includes("🔄") || title.toLowerCase().includes("recurring")) {
    isRecurring = true;
  }

  let formulaDate = "";
  for (const [key, p] of Object.entries(props)) {
    const k = key.toLowerCase();
    if (k.includes("formula due date") || k.includes("due date w/o tz") || k.includes("without tz")) {
      formulaDate = p.formula?.date?.start || p.formula?.string || (p.type === "date" ? p.date?.start : "") || "";
      if (formulaDate) break;
    }
  }
  if (formulaDate) isRecurring = true;

  let rawNativeDate = "";
  for (const [key, p] of Object.entries(props)) {
    if (p.type === "date" && p.date?.start) {
      schemaProps.date = key;
      rawNativeDate = p.date.start;
      break;
    }
  }

  let date = "";
  if (isRecurring && formulaDate) {
    if (!formulaDate.includes("T") && rawNativeDate && rawNativeDate.includes("T")) {
      date = `${formulaDate.slice(0, 10)}T${rawNativeDate.split("T")[1]}`;
    } else {
      date = formulaDate;
    }
  } else if (rawNativeDate) {
    date = rawNativeDate;
  }

  if (!date) {
    for (const [key, p] of Object.entries(props)) {
      if (p.type === "formula" && p.formula?.date?.start) { date = p.formula.date.start; break; }
      if (p.type === "rollup" && p.rollup?.date?.start) { date = p.rollup.date.start; break; }
    }
  }
  if (!date && formulaDate) date = formulaDate;

  for (const [key, p] of Object.entries(props)) {
    if (!schemaProps.person && (p.type === "people" || key.toLowerCase().includes("person"))) schemaProps.person = key;
    if (!schemaProps.desc && p.type === "rich_text" && (key.toLowerCase().includes("desc") || key.toLowerCase().includes("note"))) schemaProps.desc = key;
    if (!schemaProps.url && p.type === "url") schemaProps.url = key;
  }

  return {
    id: page.id,
    url: page.url || `https://notion.so/${page.id.replace(/-/g, "")}`,
    title,
    status: rawStatusName || (isDone ? "Done" : "Not Started"),
    isDone,
    priority,
    date: date ? String(date).trim() : "",
    formulaDate: formulaDate ? String(formulaDate).trim() : "",
    hasTime: !!(date && date.includes("T")),
    isRecurring,
    statusPropName: schemaProps.status,
    lastEdited: page.last_edited_time
  };
}

export function filterTasksRule(taskList) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return taskList.filter(task => {
    if (!task.isDone) return true;
    if (task.date && task.date.length >= 10) return task.date.slice(0, 10) >= todayStr;
    if (task.lastEdited && task.lastEdited.length >= 10) return task.lastEdited.slice(0, 10) >= todayStr;
    return false;
  });
}

export async function fetchAllTasks() {
  const taskMap = new Map();
  let currentCursor = null;
  let hasMore = true;
  let pages = 0;

  while (hasMore && pages < 4) {
    pages++;
    const res = await fetch("/api/notion/query-database", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ databaseId: TASK_DB_ID, page_size: 100, ...(currentCursor ? { start_cursor: currentCursor } : {}) })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    (data.results || []).forEach(p => {
      if (!taskMap.has(p.id)) taskMap.set(p.id, parseTask(p));
    });
    hasMore = data.has_more && data.next_cursor;
    currentCursor = data.next_cursor;
  }
  return filterTasksRule(Array.from(taskMap.values()));
}