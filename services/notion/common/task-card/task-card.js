const PRIORITY_RANK = { critical: 1, high: 2, medium: 3, low: 4, lowest: 5 };

function getJiraPriorityIcon(prio) {
  const p = (prio || "").toLowerCase();
  if (p === "critical") return "fa-angles-up";
  if (p === "high") return "fa-chevron-up";
  if (p === "medium") return "fa-equals";
  if (p === "low") return "fa-chevron-down";
  return "fa-angles-down";
}

export function formatTaskDate(task) {
  const str = task.date || task.formulaDate || "";
  if (!str.trim()) return "No Due Date";
  const d = new Date(str);
  let out = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (task.hasTime) out += " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return out;
}

export function multiLevelTaskComparator(a, b) {
  const dateA = a.date || a.formulaDate || "";
  const dateB = b.date || b.formulaDate || "";
  if (dateA !== dateB) {
    if (!dateA) return 1;
    if (!dateB) return -1;
    const diff = dateA.localeCompare(dateB);
    if (diff !== 0) return diff;
  }
  const rA = PRIORITY_RANK[(a.priority || "").toLowerCase()] || 3;
  const rB = PRIORITY_RANK[(b.priority || "").toLowerCase()] || 3;
  if (rA !== rB) return rA - rB;
  return (a.title || "").localeCompare(b.title || "");
}

export function renderTaskCard(task, showStatusBadge = false, columnType = "") {
  const prioClass = `prio-${(task.priority || "lowest").toLowerCase()}`;
  const cardPrioClass = `card-${(task.priority || "lowest").toLowerCase()}`;
  const dateFormatted = formatTaskDate(task);
  const normStatus = (task.status || "").toLowerCase().includes("progress") ? "in-progress" : (task.isDone ? "done" : "todo");
  const isInProgress = !task.isDone && normStatus === "in-progress";

  const currentContext = columnType || normStatus;
  let actionBtns = "";

  if (currentContext === "in-progress") {
    actionBtns = `<button type="button" class="status-action-btn btn-to-todo" data-action="status" data-id="${task.id}" data-target="Not Started"><i class="fa-regular fa-circle-play"></i> Mark Not Started</button>`;
  } else if (currentContext === "todo") {
    actionBtns = `<button type="button" class="status-action-btn btn-to-prog" data-action="status" data-id="${task.id}" data-target="In Progress"><i class="fa-solid fa-circle-half-stroke"></i> Mark In Progress</button>`;
  } else if (currentContext === "done") {
    actionBtns = `
      <button type="button" class="status-action-btn btn-to-todo" data-action="status" data-id="${task.id}" data-target="Not Started"><i class="fa-regular fa-circle-play"></i> Mark Not Started</button>
      <button type="button" class="status-action-btn btn-to-prog" data-action="status" data-id="${task.id}" data-target="In Progress"><i class="fa-solid fa-circle-half-stroke"></i> Mark In Progress</button>
    `;
  }

  const prioIcon = getJiraPriorityIcon(task.priority);

  return `
    <div class="checklist-item ${cardPrioClass} ${task.isDone ? "is-done" : ""} ${isInProgress ? "is-in-progress" : ""}" data-id="${task.id}">
      <div class="item-left">
        <div class="check-box" data-action="toggle" data-id="${task.id}">
          <i class="fa-solid ${isInProgress ? "fa-minus" : "fa-check"}"></i>
        </div>
        <div class="item-text-wrap">
          <span class="item-title">${task.title}</span>
          <div class="item-submeta">
            <span class="date-highlight-badge ${task.hasTime ? "has-time" : ""}">
              <i class="fa-regular fa-calendar"></i><span>${dateFormatted}</span>
            </span>
            ${task.priority ? `
              <span class="task-priority ${prioClass}">
                <i class="fa-solid ${prioIcon}" style="margin-right: 4px; font-size: 0.65rem;"></i>${task.priority}
              </span>
            ` : ""}
          </div>

          <!-- Date shortcut buttons above status actions -->
          <div class="item-date-shortcuts">
            <button type="button" class="date-quick-btn" data-action="set-date-today" data-id="${task.id}">
              <i class="fa-regular fa-calendar-check"></i> Today
            </button>
            <button type="button" class="date-quick-btn" data-action="set-date-tomorrow" data-id="${task.id}">
              <i class="fa-regular fa-calendar-plus"></i> Tomorrow
            </button>
            <button type="button" class="date-quick-btn" data-action="open-date-modal" data-id="${task.id}">
              <i class="fa-regular fa-calendar-days"></i> Custom
            </button>
          </div>

          <div class="item-status-actions">
            ${actionBtns}
            <button type="button" class="status-action-btn" data-action="delete" data-id="${task.id}" style="color:#f43f5e; background:rgba(244,63,94,0.12);"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>
      <div class="item-right">
        ${showStatusBadge ? `<span class="task-status-badge">${task.status}</span>` : ""}
        <a href="${task.url}" target="_blank" class="open-link-btn" title="Open Notion">
          <svg class="notion-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke-width="2.2"/><path d="M7.5 7.5V16.5M7.5 8L16.5 16.5M16.5 7.5V16.5" stroke-width="2.2"/></svg>
        </a>
      </div>
    </div>
  `;
}