// File: services/notion/task-tracker/views/inbox-view/api/api.client.js
// Client API layer: queries, schemas, and parser isolated for Inbox View

export const TASK_DB_ID = "1a4fa716-53ca-8189-a7b5-d1e9b9ae9a5b";

export const schemaProps = {
  title: "Title",
  status: "Status",
  priority: "Priority",
  date: "Due Date"
};

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

function extractMissingDataValues(p) {
  if (!p) return [];

  if (p.type === "formula" && p.formula) {
    if (p.formula.type === "string" && p.formula.string) return [p.formula.string.trim()];
    if (p.formula.type === "array" && Array.isArray(p.formula.array)) {
      return p.formula.array.map(i => (typeof i === "string" ? i : (i?.string || i?.name || ""))).filter(Boolean);
    }
  }

  if (p.type === "rollup" && p.rollup && Array.isArray(p.rollup.array)) {
    return p.rollup.array.map(i => {
      if (typeof i === "string") return i;
      if (i?.formula?.string) return i.formula.string;
      if (i?.string) return i.string;
      if (i?.name) return i.name;
      return "";
    }).filter(Boolean);
  }

  if (p.type === "multi_select" && Array.isArray(p.multi_select)) {
    return p.multi_select.map(item => item.name || "");
  }

  if (p.type === "rich_text" && Array.isArray(p.rich_text)) {
    const text = p.rich_text.map(t => t.plain_text || "").join("").trim();
    return text ? [text] : [];
  }

  return [];
}

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

  let formulaDateWithoutTZ = "";
  for (const [key, p] of Object.entries(props)) {
    const k = key.toLowerCase();
    if (k.includes("formula due date w/o tz") || k.includes("w/o tz") || k.includes("without tz")) {
      const extracted = extractFormulaValue(p);
      if (extracted && extracted.trim() !== "") {
        formulaDateWithoutTZ = extracted.trim();
        break;
      }
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

  let date = rawNativeDate || formulaDateWithoutTZ;
  const hasTime = !!(date && date.includes("T"));

  let missingDataValues = [];
  for (const [key, p] of Object.entries(props)) {
    if (key.trim().toLowerCase() === "missing data") {
      missingDataValues = extractMissingDataValues(p);
    }
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
    nativeDate: rawNativeDate ? String(rawNativeDate).trim() : "",
    hasTime,
    missingDataValues,
    properties: props,
    datePropName: schemaProps.date,
    createdTime: page.created_time || props["Created Time"]?.created_time || props["Created time"]?.created_time || "",
    lastEdited: page.last_edited_time
  };
}