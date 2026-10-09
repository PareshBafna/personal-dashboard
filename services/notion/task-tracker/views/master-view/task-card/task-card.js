// File: services/notion/task-tracker/views/master-view/task-card/task-card.js
// Renders individual task card markup, IST date/time parsing, dynamic status button toggle, and sorting logic

const PRIORITY_RANK = { critical: 1, high: 2, medium: 3, low: 4, lowest: 5 };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TZ = "Asia/Kolkata";
const HAS_OFFSET = /T.*(Z|[+-]\d{2}:?\d{2})$/;

// Extract true native date start property
export function getNativeDueDateRaw(task) {
  const props = task.properties || {};
  for (const [key, p] of Object.entries(props)) {
    if (!p || p.type !== "date" || !p.date || !p.date.start) continue;
    const k = key.trim().toLowerCase();
    if (k === "due date") return p.date.start;
  }
  return task.nativeDate || task.date || task.formulaDate || "";
}

// Convert date part to IST YYYY-MM-DD
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

// Convert time part to IST HH:mm wall clock
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

// Get standardized full IST sort key: "YYYY-MM-DD HH:mm"
function getTaskSortKey(task) {
  const raw = getNativeDueDateRaw(task) || task.date || task.formulaDate || "";
  const dStr = toLocalDateString(raw);
  if (!dStr) return "9999-99-99 99:99";
  const tStr = toLocalWallTime(raw);
  return `${dStr} ${tStr || "99:99"}`;
}

export function formatTaskDate(task) {
  const rawDate = getNativeDueDateRaw(task) || task.date || task.formulaDate || "";
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

export function hasIncorrectDueDate(task) {
  if (!task) return false;
  if (task.isDone || (task.status || "").toLowerCase().trim() === "done") return false;

  const vals = task.missingDataValues || [];
  return Array.isArray(vals) && vals.some(v => typeof v === "string" && v.includes("❌ Incorrect Due Date"));
}

// Sort Order: Due Date and Time -> Priority -> Name
export function multiLevelTaskComparator(a, b) {
  const keyA = getTaskSortKey(a);
  const keyB = getTaskSortKey(b);
  if (keyA !== keyB) return keyA.localeCompare(keyB);

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
  const taskDateIso = toLocalDateString(getNativeDueDateRaw(task));
  const isPastDue = taskDateIso && taskDateIso < new Date().toLocaleDateString("en-CA", { timeZone: TZ });
  const dateBadgeClass = isIncorrect || isPastDue ? "date-color-red" : "date-color-blue";

  return `
    <div class="checklist-item ${cardPrioClass} ${isCompleted ? "is-done" : ""} ${isInProg ? "is-in-progress" : ""}" data-id="${task.id}">
      <div class="item-text-wrap">
        <div class="task-info-section">
          <div class="task-info-top-row">
            <div class="item-title-with-icon">
              <i class="fa-solid fa-circle-check task-title-icon"></i>
              <span class="item-title">${task.title}</span>
            </div>
            <div class="item-top-right-actions">
              <button type="button" class="card-delete-btn" data-action="delete" data-id="${task.id}" title="Delete Task">
                <i class="fa-solid fa-trash-can"></i>
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
          <!-- Row 1: Date Shortcuts -->
          <div class="item-date-shortcuts">
            <button type="button" class="date-quick-btn" data-action="set-date-nodue" data-id="${task.id}" title="No Due Date">
              <i class="fa-solid fa-calendar-xmark"></i> No Due
            </button>
            <button type="button" class="date-quick-btn" data-action="set-date-today" data-id="${task.id}" title="Set Due Today">
              <i class="fa-regular fa-calendar-check"></i> Today
            </button>
            <button type="button" class="date-quick-btn" data-action="set-date-tomorrow" data-id="${task.id}" title="Set Due Tomorrow">
              <i class="fa-regular fa-calendar-plus"></i> Tomorrow
            </button>
            <button type="button" class="date-quick-btn" data-action="open-date-modal" data-id="${task.id}" title="Pick Date">
              <i class="fa-regular fa-calendar-days"></i> Custom
            </button>
          </div>

          <!-- Row 2: Priority Shortcuts -->
          <div class="item-prio-shortcuts">
            <button type="button" class="prio-quick-btn prio-btn-critical ${prioKey === "critical" ? "is-active" : ""}" data-action="set-priority" data-prio="Critical" data-id="${task.id}">
              <i class="fa-solid fa-angles-up"></i> Critical
            </button>
            <button type="button" class="prio-quick-btn prio-btn-high ${prioKey === "high" ? "is-active" : ""}" data-action="set-priority" data-prio="High" data-id="${task.id}">
              <i class="fa-solid fa-chevron-up"></i> High
            </button>
            <button type="button" class="prio-quick-btn prio-btn-medium ${prioKey === "medium" ? "is-active" : ""}" data-action="set-priority" data-prio="Medium" data-id="${task.id}">
              <i class="fa-solid fa-equals"></i> Medium
            </button>
            <button type="button" class="prio-quick-btn prio-btn-low ${prioKey === "low" ? "is-active" : ""}" data-action="set-priority" data-prio="Low" data-id="${task.id}">
              <i class="fa-solid fa-chevron-down"></i> Low
            </button>
            <button type="button" class="prio-quick-btn prio-btn-lowest ${prioKey === "lowest" ? "is-active" : ""}" data-action="set-priority" data-prio="Lowest" data-id="${task.id}">
              <i class="fa-solid fa-angles-down"></i> Lowest
            </button>
          </div>

          <!-- Row 3: Status Actions -->
          <div class="item-status-actions">
            ${isInProg ? `
              <button type="button" class="status-action-btn btn-to-todo" data-action="status" data-target="Not Started" data-id="${task.id}">
                <i class="fa-regular fa-circle-play"></i> Mark Not Started
              </button>
            ` : `
              <button type="button" class="status-action-btn btn-to-prog" data-action="status" data-target="In Progress" data-id="${task.id}">
                <i class="fa-solid fa-circle-half-stroke"></i> Mark In Progress
              </button>
            `}
            <button type="button" class="status-action-btn btn-to-done" data-action="status" data-target="Done" data-id="${task.id}">
              <i class="fa-solid fa-circle-check"></i> Mark Completed
            </button>
          </div>

          <!-- Row 4: Update, Duplicate & Notion Action Buttons -->
          <div class="item-notion-action">
            <button type="button" class="open-notion-btn update-data-card-btn" data-action="open-update-modal" data-id="${task.id}">
              <i class="fa-solid fa-pen-to-square"></i>
              <span>Update</span>
            </button>
            <button type="button" class="open-notion-btn duplicate-card-btn" data-action="duplicate" data-id="${task.id}" title="Duplicate Task">
              <i class="fa-regular fa-clone"></i>
              <span>Duplicate</span>
            </button>
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