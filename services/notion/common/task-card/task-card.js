import { schemaProps } from "../api/api.client.js";

const PRIORITY_RANK = { critical: 1, high: 2, medium: 3, low: 4, lowest: 5 };

export function formatTaskDate(task) {
  const dStr = task.date || task.formulaDate || "";
  if (!dStr) return "No Due Date";

  const isWithTime = task.hasTime || dStr.includes("T");
  const d = new Date(dStr);
  if (isNaN(d.getTime())) return dStr;

  const mo = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();

  if (isWithTime) {
    let ho = d.getHours();
    const mi = String(d.getMinutes()).padStart(2, "0");
    const ampm = ho >= 12 ? "PM" : "AM";
    ho = ho % 12 || 12;
    return `${mo} ${day} ${String(ho).padStart(2, "0")}:${mi} ${ampm}`;
  }

  return `${mo} ${day}`;
}

export function hasIncorrectDueDate(task) {
  if (!task || !task.properties) return false;

  // Never flag completed tasks
  if (task.isDone || (task.status || "").toLowerCase().trim() === "done") {
    return false;
  }

  let missingProp = null;
  for (const [key, val] of Object.entries(task.properties)) {
    if (key.trim().toLowerCase() === "missing data") {
      missingProp = val;
      break;
    }
  }

  if (!missingProp) return false;

  let val = "";
  if (missingProp.type === "formula" && missingProp.formula) {
    val = missingProp.formula.string || "";
  } else if (missingProp.type === "rollup" && missingProp.rollup) {
    if (Array.isArray(missingProp.rollup.array)) {
      val = missingProp.rollup.array
        .map(i => (typeof i === "string" ? i : (i?.formula?.string || i?.string || "")))
        .join(" ");
    }
  } else if (missingProp.type === "rich_text" && Array.isArray(missingProp.rich_text)) {
    val = missingProp.rich_text.map(t => t.plain_text || "").join("");
  }

  return val.trim().includes("❌ Incorrect Due Date");
}

export function multiLevelTaskComparator(a, b) {
  const isPastDueA = a.date && a.date.slice(0, 10) < new Date().toISOString().slice(0, 10);
  const isPastDueB = b.date && b.date.slice(0, 10) < new Date().toISOString().slice(0, 10);
  if (isPastDueA !== isPastDueB) return isPastDueA ? -1 : 1;

  const rA = PRIORITY_RANK[(a.priority || "").toLowerCase()] || 3;
  const rB = PRIORITY_RANK[(b.priority || "").toLowerCase()] || 3;
  if (rA !== rB) return rA - rB;

  return (a.title || "").localeCompare(b.title || "");
}

export function renderTaskCard(task, showCheckbox = true, overrideCol = null) {
  const currentPrio = task.priority || "Medium";
  const cardPrioClass = `card-${currentPrio.toLowerCase()}`;
  const isCompleted = overrideCol === "done" ? true : (overrideCol ? false : task.isDone);
  const isIncorrect = hasIncorrectDueDate(task);

  const dateFormatted = formatTaskDate(task);
  const dateClass = isIncorrect ? "date-color-red" : "";
  const normStatus = (task.status || (isCompleted ? "Done" : "Not Started")).trim();

  let actionsHtml = "";
  if (isIncorrect) {
    actionsHtml = `
      <button type="button" class="open-notion-btn fix-due-date-card-btn" data-action="fix-due-date" data-id="${task.id}">
        <i class="fa-solid fa-wrench"></i>
        <span>Fix Due Date</span>
      </button>
    `;
  }

  return `
    <div class="checklist-item ${cardPrioClass} ${isCompleted ? "item-completed" : ""}" data-id="${task.id}">
      <div class="item-text-wrap">
        <div class="task-info-section">
          <div class="task-info-top-row">
            ${showCheckbox ? `
              <button type="button" class="task-checkbox-btn ${isCompleted ? "checked" : ""}" data-action="toggle" data-id="${task.id}">
                <i class="fa-solid fa-check"></i>
              </button>
            ` : `
              <div class="item-title-with-icon">
                <i class="fa-regular fa-circle-check task-title-icon"></i>
              </div>
            `}
            <span class="item-title ${isCompleted ? "strikethrough" : ""}">${task.title}</span>
          </div>
          <div class="item-submeta">
            <span class="date-highlight-badge ${dateClass}">
              <i class="fa-regular fa-calendar"></i><span>${dateFormatted}</span>
            </span>
            <span class="task-status-badge">${normStatus}</span>
          </div>
        </div>

        <div class="task-card-divider"></div>

        <div class="task-actions-section">
          <div class="item-notion-action">
            ${actionsHtml}
            <a href="${task.url}" target="_blank" class="open-notion-btn">
              <svg class="notion-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke-width="2.2"/>
                <path d="M7.5 7.5V16.5M7.5 8L16.5 16.5M16.5 7.5V16.5" stroke-width="2.2"/>
              </svg>
              <span>Open In Notion</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}