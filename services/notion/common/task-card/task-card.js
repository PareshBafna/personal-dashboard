const PRIORITY_ORDER = ["Critical", "High", "Medium", "Low", "Lowest"];
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
  const currentPrio = task.priority || "Medium";
  const cardPrioClass = `card-${currentPrio.toLowerCase()}`;
  const dateFormatted = formatTaskDate(task);
  const normStatus = (task.status || "").toLowerCase().includes("progress") ? "in-progress" : (task.isDone ? "done" : "todo");
  const isInProgress = !task.isDone && normStatus === "in-progress";

  const currentContext = columnType || normStatus;
  let actionBtns = "";

  if (currentContext === "in-progress") {
    actionBtns = `
      <button type="button" class="status-action-btn btn-to-todo" data-action="status" data-id="${task.id}" data-target="Not Started"><i class="fa-regular fa-circle-play"></i> Mark Not Started</button>
      <button type="button" class="status-action-btn btn-to-done" data-action="status" data-id="${task.id}" data-target="Done"><i class="fa-solid fa-circle-check"></i> Mark Completed</button>
    `;
  } else if (currentContext === "todo") {
    actionBtns = `
      <button type="button" class="status-action-btn btn-to-prog" data-action="status" data-id="${task.id}" data-target="In Progress"><i class="fa-solid fa-circle-half-stroke"></i> Mark In Progress</button>
      <button type="button" class="status-action-btn btn-to-done" data-action="status" data-id="${task.id}" data-target="Done"><i class="fa-solid fa-circle-check"></i> Mark Completed</button>
    `;
  } else if (currentContext === "done") {
    actionBtns = `
      <button type="button" class="status-action-btn btn-to-todo" data-action="status" data-id="${task.id}" data-target="Not Started"><i class="fa-regular fa-circle-play"></i> Mark Not Started</button>
      <button type="button" class="status-action-btn btn-to-prog" data-action="status" data-id="${task.id}" data-target="In Progress"><i class="fa-solid fa-circle-half-stroke"></i> Mark In Progress</button>
    `;
  }

  const priorityBtnsHtml = PRIORITY_ORDER.map(pName => {
    const isCurrent = currentPrio.toLowerCase() === pName.toLowerCase();
    const pIcon = getJiraPriorityIcon(pName);
    const activeClass = isCurrent ? "is-active" : "";
    return `
      <button type="button" class="prio-quick-btn prio-btn-${pName.toLowerCase()} ${activeClass}" data-action="set-priority" data-id="${task.id}" data-prio="${pName}">
        <i class="fa-solid ${pIcon}"></i> ${pName}
      </button>
    `;
  }).join("");

  return `
    <div class="checklist-item ${cardPrioClass} ${task.isDone ? "is-done" : ""} ${isInProgress ? "is-in-progress" : ""}" data-id="${task.id}">
      <div class="item-text-wrap">
        <!-- SECTION 1: TASK DATA -->
        <div class="task-info-section">
          <div class="task-info-top-row">
            <div class="item-title-with-icon">
              <i class="fa-solid fa-circle-check task-title-icon"></i>
              <span class="item-title">${task.title}</span>
            </div>
            <div class="item-top-right-actions">
              ${showStatusBadge ? `<span class="task-status-badge">${task.status}</span>` : ""}
              <button type="button" class="card-delete-btn" data-action="delete" data-id="${task.id}" title="Delete Task">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
          <div class="item-submeta">
            <span class="date-highlight-badge ${task.hasTime ? "has-time" : ""}">
              <i class="fa-regular fa-calendar"></i><span>${dateFormatted}</span>
            </span>
          </div>
        </div>

        <!-- DIVIDER: TASK DATA VS ACTIONS -->
        <div class="task-card-divider"></div>

        <!-- SECTION 2: TASK ACTIONS -->
        <div class="task-actions-section">
          <!-- Row 1: Neutral Date Buttons -->
          <div class="item-date-shortcuts">
            <button type="button" class="date-quick-btn date-btn-nodue" data-action="set-date-nodue" data-id="${task.id}">
              <i class="fa-solid fa-calendar-xmark"></i> No Due
            </button>
            <button type="button" class="date-quick-btn date-btn-today" data-action="set-date-today" data-id="${task.id}">
              <i class="fa-regular fa-calendar-check"></i> Today
            </button>
            <button type="button" class="date-quick-btn date-btn-tomorrow" data-action="set-date-tomorrow" data-id="${task.id}">
              <i class="fa-regular fa-calendar-plus"></i> Tomorrow
            </button>
            <button type="button" class="date-quick-btn date-btn-custom" data-action="open-date-modal" data-id="${task.id}">
              <i class="fa-regular fa-calendar-days"></i> Custom
            </button>
          </div>

          <!-- Row 2: Priority Buttons -->
          <div class="item-prio-shortcuts">
            ${priorityBtnsHtml}
          </div>

          <!-- Row 3: Status Actions (Full Width) -->
          <div class="item-status-actions">
            ${actionBtns}
          </div>

          <!-- Row 4: Notion & Update Action Buttons -->
          <div class="item-notion-action">
            <button type="button" class="open-notion-btn update-data-card-btn" data-action="open-update-modal" data-id="${task.id}">
              <i class="fa-solid fa-pen-to-square"></i>
              <span>Update Data</span>
            </button>
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