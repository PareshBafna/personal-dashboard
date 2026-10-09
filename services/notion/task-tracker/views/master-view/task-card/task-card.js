// File: services/notion/task-tracker/views/master-view/task-card/task-card.js
// Renders individual task card markup and sorting logic for Master View

const PRIORITY_RANK = { critical: 1, high: 2, medium: 3, low: 4, lowest: 5 };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TZ = "Asia/Kolkata";
const HAS_OFFSET = /(Z|[+-]\d{2}:?\d{2})$/;

const IST_PARTS_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23"
});

export function formatTaskDate(task) {
  const dStr = task.date || task.formulaDate || "";
  if (!dStr) return "No Due Date";

  const s = String(dStr).trim();

  let year = "", month = "", day = "", hour = "", minute = "";
  let hasTime = s.includes("T") || s.includes(":");

  if (HAS_OFFSET.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const parts = {};
      IST_PARTS_FMT.formatToParts(d).forEach(p => { parts[p.type] = p.value; });
      year = parts.year;
      month = parts.month;
      day = parts.day;
      hour = parts.hour;
      minute = parts.minute;
    }
  }

  if (!year) {
    const mDate = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (mDate) {
      year = mDate[1];
      month = mDate[2];
      day = mDate[3];
    }
    const mTime = s.match(/[T\s](\d{1,2}):(\d{2})/);
    if (mTime) {
      hour = String(mTime[1]).padStart(2, "0");
      minute = String(mTime[2]).padStart(2, "0");
      hasTime = true;
    } else {
      hasTime = false;
    }
  }

  if (!year || !month || !day) return dStr;

  const mIdx = parseInt(month, 10) - 1;
  const dNum = parseInt(day, 10);
  let out = `${MONTHS[mIdx]} ${dNum}`;

  if (hasTime && hour !== "" && minute !== "") {
    const hNum = parseInt(hour, 10);
    const mStr = minute;
    const h12 = hNum % 12 === 0 ? 12 : hNum % 12;
    const ampm = hNum >= 12 ? "PM" : "AM";
    out += ` ${String(h12).padStart(2, "0")}:${mStr} ${ampm}`;
  }

  return out;
}

export function hasIncorrectDueDate(task) {
  if (!task) return false;
  if (task.isDone || (task.status || "").toLowerCase().trim() === "done") return false;

  const vals = task.missingDataValues || [];
  return Array.isArray(vals) && vals.some(v => typeof v === "string" && v.includes("❌ Incorrect Due Date"));
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
  const currentPrio = (task.priority || "Medium").trim();
  const prioKey = currentPrio.toLowerCase();
  const cardPrioClass = `card-${prioKey}`;
  const isCompleted = overrideCol === "done" ? true : (overrideCol ? false : task.isDone);
  const isInProg = overrideCol === "in-progress" ? true : (!overrideCol && (task.status || "").toLowerCase().includes("progress"));

  const isIncorrect = hasIncorrectDueDate(task);
  const dateFormatted = formatTaskDate(task);
  const isPastDue = task.date && task.date.slice(0, 10) < new Date().toLocaleDateString("en-CA", { timeZone: TZ });
  const dateBadgeClass = isIncorrect || isPastDue ? "date-color-red" : "date-color-blue";

  return `
    <div class="checklist-item ${cardPrioClass} ${isCompleted ? "is-done" : ""} ${isInProg ? "is-in-progress" : ""}" data-id="${task.id}">
      <div class="item-text-wrap">
        <div class="task-info-section">
          <div class="task-info-top-row">
            <div class="item-title-with-icon">
              <i class="fa-regular fa-circle-check task-title-icon"></i>
              <span class="item-title">${task.title}</span>
            </div>
            <div class="item-top-right-actions">
              <button type="button" class="card-delete-btn" data-action="delete" data-id="${task.id}" title="Delete Task">
                <i class="fa-regular fa-trash-can"></i>
              </button>
            </div>
          </div>
          <div class="item-submeta">
            <span class="date-highlight-badge ${dateBadgeClass}">
              <i class="fa-regular fa-calendar"></i><span>${dateFormatted}</span>
            </span>
            <span class="task-priority prio-${prioKey}">${currentPrio}</span>
          </div>
        </div>

        <div class="task-card-divider"></div>

        <div class="task-actions-section">
          <div class="item-date-shortcuts">
            <button type="button" class="date-quick-btn" data-action="set-date-today" data-id="${task.id}" title="Set Due Today">
              <i class="fa-solid fa-calendar-day"></i> Today
            </button>
            <button type="button" class="date-quick-btn" data-action="set-date-tomorrow" data-id="${task.id}" title="Set Due Tomorrow">
              <i class="fa-solid fa-clock"></i> Tom
            </button>
            <button type="button" class="date-quick-btn" data-action="open-date-modal" data-id="${task.id}" title="Pick Date">
              <i class="fa-regular fa-calendar-plus"></i> Date
            </button>
            <button type="button" class="date-quick-btn" data-action="set-date-nodue" data-id="${task.id}" title="No Due Date">
              <i class="fa-solid fa-ban"></i> No Due
            </button>
          </div>

          <div class="item-prio-shortcuts">
            <button type="button" class="prio-quick-btn prio-btn-critical ${prioKey === "critical" ? "is-active" : ""}" data-action="set-priority" data-prio="Critical" data-id="${task.id}">
              <i class="fa-solid fa-angles-up"></i> Crit
            </button>
            <button type="button" class="prio-quick-btn prio-btn-high ${prioKey === "high" ? "is-active" : ""}" data-action="set-priority" data-prio="High" data-id="${task.id}">
              <i class="fa-solid fa-chevron-up"></i> High
            </button>
            <button type="button" class="prio-quick-btn prio-btn-medium ${prioKey === "medium" ? "is-active" : ""}" data-action="set-priority" data-prio="Medium" data-id="${task.id}">
              <i class="fa-solid fa-equals"></i> Med
            </button>
            <button type="button" class="prio-quick-btn prio-btn-low ${prioKey === "low" ? "is-active" : ""}" data-action="set-priority" data-prio="Low" data-id="${task.id}">
              <i class="fa-solid fa-chevron-down"></i> Low
            </button>
            <button type="button" class="prio-quick-btn prio-btn-lowest ${prioKey === "lowest" ? "is-active" : ""}" data-action="set-priority" data-prio="Lowest" data-id="${task.id}">
              <i class="fa-solid fa-angles-down"></i> Lowest
            </button>
          </div>

          <div class="item-status-actions">
            <button type="button" class="status-action-btn btn-to-prog" data-action="status" data-target="In Progress" data-id="${task.id}">
              <i class="fa-solid fa-spinner"></i> In Prog
            </button>
            <button type="button" class="status-action-btn btn-to-todo" data-action="status" data-target="Not Started" data-id="${task.id}">
              <i class="fa-regular fa-circle-play"></i> To Do
            </button>
            <button type="button" class="status-action-btn btn-to-done" data-action="status" data-target="Done" data-id="${task.id}">
              <i class="fa-solid fa-circle-check"></i> Done
            </button>
          </div>

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