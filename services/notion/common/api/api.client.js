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

function extractFormulaValue(p) {
  if (!p) return "";
  if (p.type === "formula" && p.formula) {
    if (p.formula.type === "date" && p.formula.date?.start) return p.formula.date.start;
    if (p.formula.type === "string" && p.formula.string) return p.formula.string;
    if (p.formula.date?.start) return p.formula.date.start;
    if (p.formula.string) return p.formula.string;
  }
  if (p.type === "date" && p.date?.start) return p.date.start;
  if (p.type === "rollup" && p.rollup?.date?.start) return p.rollup.date.start;
  return "";
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
    if (p.type === "checkbox") {
      if (p.checkbox) isDone = true;
    }
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

  let formulaDateWithoutTZ = "";
  for (const [key, p] of Object.entries(props)) {
    const k = key.toLowerCase();
    if (k.includes("formula due date") || k.includes("w/o tz") || k.includes("without tz")) {
      const extracted = extractFormulaValue(p);
      if (extracted && extracted.trim() !== "") {
        formulaDateWithoutTZ = extracted.trim();
        break;
      }
    }
  }

  let hasRecurProp = false;
  for (const [key, p] of Object.entries(props)) {
    const k = key.toLowerCase();
    if (k.includes("recur") || k.includes("repeat") || k.includes("frequency")) {
      if (p.type === "checkbox" && p.checkbox) hasRecurProp = true;
      if (p.type === "select" && p.select?.name && !["none", "never", "no"].includes(p.select.name.toLowerCase())) hasRecurProp = true;
      if (p.type === "formula" && p.formula?.boolean) hasRecurProp = true;
    }
  }

  const isRecurring = !!((formulaDateWithoutTZ && formulaDateWithoutTZ !== "") || hasRecurProp);

  let rawNativeDate = "";
  for (const [key, p] of Object.entries(props)) {
    if (p.type === "date" && p.date?.start) {
      schemaProps.date = key;
      rawNativeDate = p.date.start;
      break;
    }
  }

  let date = "";
  if (isRecurring && formulaDateWithoutTZ) {
    if (!formulaDateWithoutTZ.includes("T") && rawNativeDate && rawNativeDate.includes("T")) {
      const timePart = rawNativeDate.split("T")[1];
      const formulaDatePart = formulaDateWithoutTZ.slice(0, 10);
      date = `${formulaDatePart}T${timePart}`;
    } else {
      date = formulaDateWithoutTZ;
    }
  } else if (rawNativeDate) {
    date = rawNativeDate;
  }

  if (!date && formulaDateWithoutTZ) date = formulaDateWithoutTZ;

  const hasTime = !!(date && date.includes("T"));

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
    formulaDate: formulaDateWithoutTZ ? String(formulaDateWithoutTZ).trim() : "",
    hasTime,
    isRecurring,
    statusPropName: schemaProps.status,
    lastEdited: page.last_edited_time
  };
}

export function filterTasksRule(taskList) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return taskList.filter(task => {
    // 1. Drop if no due date (both native and formula date empty)
    const hasValidDueDate = !!((task.date && task.date.trim()) || (task.formulaDate && task.formulaDate.trim()));
    if (!hasValidDueDate) return false;

    // 2. Keep incomplete tasks
    if (!task.isDone) return true;

    // 3. For completed tasks: only keep completed today or later
    if (task.date && task.date.length >= 10) return task.date.slice(0, 10) >= todayStr;
    if (task.lastEdited && task.lastEdited.length >= 10) return task.lastEdited.slice(0, 10) >= todayStr;
    return false;
  });
}

export async function fetchAllTasks() {
  const taskMap = new Map();
  let currentCursor = null;
  let hasMore = true;

  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Notion API filter: Incomplete OR edited today
  const apiFilter = {
    or: [
      {
        property: schemaProps.status || "Status",
        status: {
          does_not_equal: "Done"
        }
      },
      {
        timestamp: "last_edited_time",
        last_edited_time: {
          on_or_after: todayISO
        }
      }
    ]
  };

  while (hasMore) {
    const payload = {
      databaseId: TASK_DB_ID,
      page_size: 100,
      filter: apiFilter,
      ...(currentCursor ? { start_cursor: currentCursor } : {})
    };

    let res = await fetch("/api/notion/query-database", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      delete payload.filter;
      res = await fetch("/api/notion/query-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
    }

    const data = await res.json();
    (data.results || []).forEach(p => {
      if (!taskMap.has(p.id)) taskMap.set(p.id, parseTask(p));
    });

    hasMore = !!(data.has_more && data.next_cursor);
    currentCursor = data.next_cursor || null;
  }

  return filterTasksRule(Array.from(taskMap.values()));
}