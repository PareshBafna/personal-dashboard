// File: services/notion/views/upcoming-view/task-card/task-card.js

const PRIORITY_RANK = { critical: 1, high: 2, medium: 3, low: 4, lowest: 5 };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TZ = "Asia/Kolkata";
const HAS_OFFSET = /T.*(Z|[+-]\d{2}:?\d{2})$/;

export function getNativeDueDateRaw(task) {
  const props = task.properties || {};
  for (const [key, p] of Object.entries(props)) {
    if (!p || p.type !== "date" || !p.date || !p.date.start) continue;
    if (key.trim().toLowerCase() === "due date") return p.date.start;
  }
  return task.nativeDate || task.date || task.formulaDate || "";
}

export function toLocalDateString(rawVal) {
  if (!rawVal) return "";
  const s = String(rawVal).trim();
  if (HAS_OFFSET.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toLocaleDateString("en-CA", { timeZone: TZ });
  }
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

export function toLocalWallTime(rawVal) {
  if (!rawVal) return "";
  const s = String(rawVal).trim();
  if (!s.includes("T")) return "";
  if (HAS_OFFSET.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("en-GB", { timeZone: TZ, hourCycle: "h23", hour: "2-digit", minute: "2-digit" });
    }
  }
  const m = s.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "";
}

export function formatTaskDate(task) {
  const rawDate = getNativeDueDateRaw(task);
  const dStr = toLocalDateString(rawDate);
  if (!dStr) return "No Due Date";

  const [, mo, da] = dStr.split("-").map(Number);
  let out = `${MONTHS[mo - 1]} ${da}`;

  const tStr = toLocalWallTime(rawDate);
  if (tStr) {
    const [h, mi] = tStr.split(":").map(Number);
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const ampm = h >= 12 ? "PM" : "AM";
    out += ` ${String(h12).padStart(2, "0")}:${String(mi).padStart(2, "0")} ${ampm}`;
  }
  return out;
}

export function upcomingTaskComparator(a, b) {
  const rawA = getNativeDueDateRaw(a);
  const rawB = getNativeDueDateRaw(b);
  const hasTimeA = !!toLocalWallTime(rawA);
  const hasTimeB = !!toLocalWallTime(rawB);

  const dateA = toLocalDateString(rawA) || "9999-99-99";
  const dateB = toLocalDateString(rawB) || "9999-99-99";

  // First sort by calendar date ascending
  if (dateA !== dateB) return dateA.localeCompare(dateB);

  // If same day, tasks with time first
  if (hasTimeA !== hasTimeB) return hasTimeA ? -1 : 1;

  const timeA = toLocalWallTime(rawA) || "99:99";
  const timeB = toLocalWallTime(rawB) || "99:99";
  if (timeA !== timeB) return timeA.localeCompare(timeB);

  const rA = PRIORITY_RANK[(a.priority || "").toLowerCase()] || 3;
  const rB = PRIORITY_RANK[(b.priority || "").toLowerCase()] || 3;
  if (rA !== rB) return rA - rB;

  return (a.title || "").localeCompare(b.title || "");
}

export function renderUpcomingTaskCard(task, overrideCol = null) {
  const currentPrio = (task.priority || "Medium").trim();
  const prioKey = currentPrio.toLowerCase();
  const cardPrioClass = `card-${prioKey}`;
  const isCompleted = overrideCol === "done" ? true : (overrideCol ? false : task.isDone);
  const isInProg = overrideCol === "in-progress" ? true : (!overrideCol && (task.status || "").toLowerCase().includes("progress"));

  const dateFormatted = formatTaskDate(task);

  return `
    <div class="checklist-item ${cardPrioClass} ${isCompleted ? "is-done" : ""} ${isInProg ? "is-in-progress" : ""}" data-id="${task.id}">
      <div class="item-text-wrap">
        <div class="task-info-section">
          <div class="task-info-top-row">
            <div class="item-title-with-icon">
              <i class="fa-solid fa-circle-check task-title-icon"></i>
              <span class="item-title">${task.title}</span>
            </div>
          </div>
          <div class="item-submeta">
            <span class="date-highlight-badge date-color-future">
              <i class="fa-regular fa-calendar"></i><span>${dateFormatted}</span>
            </span>
            <span class="task-priority prio-${prioKey}">${currentPrio}</span>
          </div>
        </div>

        <div class="task-card-divider"></div>

        <div class="task-actions-section">
          <div class="item-status-actions">
            ${isInProg ? `
              <button type="button" class="status-action-btn btn-to-todo" data-action="status" data-target="Not Started" data-id="${task.id}">
                <i class="fa-regular fa-circle-play"></i> Mark Not Started
              </button>
              <button type="button" class="status-action-btn btn-to-done" data-action="status" data-target="Done" data-id="${task.id}">
                <i class="fa-solid fa-circle-check"></i> Mark Completed
              </button>
            ` : `
              <button type="button" class="status-action-btn btn-to-prog" data-action="status" data-target="In Progress" data-id="${task.id}">
                <i class="fa-solid fa-circle-half-stroke"></i> Mark In Progress
              </button>
              <button type="button" class="status-action-btn btn-to-done" data-action="status" data-target="Done" data-id="${task.id}">
                <i class="fa-solid fa-circle-check"></i> Mark Completed
              </button>
            `}
          </div>

          <div class="item-notion-action">
            <a href="${task.url}" target="_blank" class="open-notion-btn">
              <svg class="notion-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke-width="2.2"/>
                <path d="M7.5 7.5V16.5M7.5 8L16.5 16.5M16.5 7.5V16.5" stroke-width="2.2"/>
              </svg>
              <span>Notion</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}