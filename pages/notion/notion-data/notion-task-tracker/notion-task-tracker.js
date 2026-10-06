const TASK_DB_ID = "1a4fa716-53ca-8189-a7b5-d1e9b9ae9a5b";

let allTasks = [];
let activeStatusFilter = "master";
let searchQuery = "";

let discoveredTitleProp = "Title";
let discoveredStatusProp = "Status";
let discoveredPriorityProp = "Priority";
let discoveredDateProp = "Due Date";
let discoveredPersonProp = null;
let discoveredDescProp = null;
let discoveredUrlProp = null;
let discoveredRecurringProp = null;

let pareshUserId = null;

const container = document.getElementById("tasksContainer");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const refreshBtn = document.getElementById("refreshBtn");

const totalCountEl = document.getElementById("totalCount");
const todoCountEl = document.getElementById("todoCount");
const progressCountEl = document.getElementById("progressCount");
const completedCountEl = document.getElementById("completedCount");

const openNewTaskBtn = document.getElementById("openNewTaskBtn");
const newTaskModal = document.getElementById("newTaskModal");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const newTaskForm = document.getElementById("newTaskForm");

const taskTitleInput = document.getElementById("taskTitleInput");
const taskPriorityInput = document.getElementById("taskPriorityInput");
const taskDateInput = document.getElementById("taskDateInput");
const taskTimeInput = document.getElementById("taskTimeInput");
const taskIncludeTimeToggle = document.getElementById("taskIncludeTimeToggle");
const btnDateToday = document.getElementById("btnDateToday");
const btnDateTomorrow = document.getElementById("btnDateTomorrow");
const btnDateNoDue = document.getElementById("btnDateNoDue");
const taskDescInput = document.getElementById("taskDescInput");
const taskUrlInput = document.getElementById("taskUrlInput");
const submitTaskBtn = document.getElementById("submitTaskBtn");

const PRIORITY_RANK = {
  "critical": 1,
  "high": 2,
  "medium": 3,
  "low": 4,
  "lowest": 5
};

const NOTION_SVG_ICON = `
  <svg class="notion-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke-width="2.2" stroke="currentColor" fill="none"/>
    <path d="M7.5 7.5V16.5M7.5 8L16.5 16.5M16.5 7.5V16.5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

function showToast(text, isError = false) {
  const toast = document.getElementById("toast");
  const msg = document.getElementById("toast-msg");
  if (!toast || !msg) return;
  msg.textContent = text;
  toast.style.borderColor = isError ? "rgba(244, 63, 94, 0.4)" : "rgba(255, 255, 255, 0.15)";
  toast.classList.add("show");
  clearTimeout(window.__tId);
  window.__tId = setTimeout(() => toast.classList.remove("show"), 3200);
}

async function resolvePareshUser() {
  try {
    const res = await fetch("/api/notion/users");
    if (!res.ok) return;
    const data = await res.json();
    const user = (data.results || []).find(u => (u.name || "").toLowerCase().includes("paresh"));
    if (user && user.id) {
      pareshUserId = user.id;
    }
  } catch (err) {
    console.warn("Could not resolve Notion user ID:", err);
  }
}

function parseTask(page) {
  const props = page.properties || {};

  let title = "Untitled Task";
  for (const [key, p] of Object.entries(props)) {
    if (p.type === "title") {
      discoveredTitleProp = key;
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
      discoveredStatusProp = key;
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
        discoveredStatusProp = key;
        rawStatusName = p.select?.name || "";
        break;
      }
    }
  }

  const sLower = rawStatusName.toLowerCase().trim();
  if (sLower === "done" || sLower === "completed" || sLower.includes("finish") || sLower.includes("closed")) {
    isDone = true;
  }

  const displayStatus = rawStatusName || (isDone ? "Done" : "Not Started");

  let priority = "Medium";
  for (const [key, p] of Object.entries(props)) {
    if (key.toLowerCase().includes("priority") || (p.type === "select" && ["critical", "high", "medium", "low", "lowest"].includes((p.select?.name || "").toLowerCase()))) {
      discoveredPriorityProp = key;
      priority = p.select?.name || p.status?.name || priority;
      break;
    }
  }

  let isRecurring = false;
  for (const [key, p] of Object.entries(props)) {
    const k = key.toLowerCase();
    if (k.includes("recur") || k.includes("repeat") || k.includes("frequency") || k.includes("cycle")) {
      discoveredRecurringProp = key;
      if (p.type === "checkbox" && p.checkbox) isRecurring = true;
      if (p.type === "select" && p.select?.name) isRecurring = true;
      if (p.type === "multi_select" && p.multi_select?.length > 0) isRecurring = true;
      if (p.type === "relation" && p.relation?.length > 0) isRecurring = true;
      if (p.type === "formula" && (p.formula?.boolean || p.formula?.string)) isRecurring = true;
    }
  }

  if (title.toLowerCase().includes("[recurring]") || title.includes("🔁") || title.includes("🔄") || title.toLowerCase().includes("recurring")) {
    isRecurring = true;
  }

  let formulaDateWithoutTZ = "";
  for (const [key, p] of Object.entries(props)) {
    const k = key.toLowerCase();
    if (k.includes("formula due date") || k.includes("due date w/o tz") || k.includes("without tz")) {
      if (p.type === "formula") {
        if (p.formula?.date?.start) {
          formulaDateWithoutTZ = p.formula.date.start;
        } else if (p.formula?.string) {
          formulaDateWithoutTZ = p.formula.string;
        }
      } else if (p.type === "date" && p.date?.start) {
        formulaDateWithoutTZ = p.date.start;
      }
      if (formulaDateWithoutTZ) break;
    }
  }

  if (formulaDateWithoutTZ) {
    isRecurring = true;
  }

  let rawNativeDate = "";
  for (const [key, p] of Object.entries(props)) {
    if (p.type === "date" && p.date?.start) {
      discoveredDateProp = key;
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

  if (!date) {
    for (const [key, p] of Object.entries(props)) {
      if (p.type === "formula" && p.formula?.date?.start) {
        date = p.formula.date.start;
        break;
      }
      if (p.type === "rollup" && p.rollup?.date?.start) {
        date = p.rollup.date.start;
        break;
      }
    }
  }

  if (!date && formulaDateWithoutTZ) {
    date = formulaDateWithoutTZ;
  }

  const hasTime = !!(date && date.includes("T"));

  for (const [key, p] of Object.entries(props)) {
    if (!discoveredPersonProp && (p.type === "people" || key.toLowerCase().includes("person") || key.toLowerCase().includes("assign"))) {
      discoveredPersonProp = key;
    }
    if (!discoveredDescProp && p.type === "rich_text" && (key.toLowerCase().includes("desc") || key.toLowerCase().includes("note"))) {
      discoveredDescProp = key;
    }
    if (!discoveredUrlProp && p.type === "url") {
      discoveredUrlProp = key;
    }
  }

  return {
    id: page.id,
    url: page.url || `https://notion.so/${page.id.replace(/-/g, "")}`,
    title,
    status: displayStatus,
    isDone,
    priority,
    date: date ? String(date).trim() : "",
    formulaDate: formulaDateWithoutTZ ? String(formulaDateWithoutTZ).trim() : "",
    hasTime,
    isRecurring,
    statusPropName: discoveredStatusProp,
    lastEdited: page.last_edited_time
  };
}

function getStatusClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "done" || s.includes("complete")) return "status-done";
  if (s.includes("progress") || s.includes("doing") || s.includes("working")) return "status-progress";
  return "status-todo";
}

function getNormalizedStatus(status) {
  const s = (status || "").toLowerCase();
  if (s === "done" || s.includes("complete")) return "done";
  if (s.includes("progress") || s.includes("doing") || s.includes("working")) return "in-progress";
  return "todo";
}

function getPriorityClass(prio) {
  const p = (prio || "").toLowerCase();
  if (p === "critical") return "prio-critical";
  if (p === "high") return "prio-high";
  if (p === "medium") return "prio-medium";
  if (p === "low") return "prio-low";
  return "prio-lowest";
}

function getPriorityCardClass(prio) {
  const p = (prio || "").toLowerCase();
  if (p === "critical") return "card-critical";
  if (p === "high") return "card-high";
  if (p === "medium") return "card-medium";
  if (p === "low") return "card-low";
  return "card-lowest";
}

function getStage1Bucket(taskDate) {
  if (!taskDate) return null;

  const taskDateOnly = taskDate.slice(0, 10);
  const now = new Date();
  const formatD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatD(now);
  const tom = new Date(now);
  tom.setDate(tom.getDate() + 1);
  const tomorrowStr = formatD(tom);

  if (taskDateOnly < todayStr) return "Past Due";
  if (taskDateOnly === todayStr) return "Due Today";
  if (taskDateOnly === tomorrowStr) return "Due Tomorrow";
  return "Future Due";
}

function getStage3Type(task) {
  if (task.isRecurring) return "Recurring Tasks";
  if (task.hasTime) return "Due Date & Time";
  return "Due Date";
}

function filterTasksRule(taskList) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;

  return taskList.filter(task => {
    if (!task.isDone) return true;
    if (task.date && task.date.length >= 10) {
      return task.date.slice(0, 10) >= todayStr;
    }
    if (task.lastEdited && task.lastEdited.length >= 10) {
      return task.lastEdited.slice(0, 10) >= todayStr;
    }
    return false;
  });
}

function updateTelemetry() {
  const total = allTasks.length;
  const completed = allTasks.filter(t => t.isDone).length;
  const inProgress = allTasks.filter(t => !t.isDone && getNormalizedStatus(t.status) === "in-progress").length;
  const todo = allTasks.filter(t => !t.isDone && getNormalizedStatus(t.status) === "todo").length;

  if (totalCountEl) totalCountEl.textContent = total;
  if (todoCountEl) todoCountEl.textContent = todo;
  if (progressCountEl) progressCountEl.textContent = inProgress;
  if (completedCountEl) completedCountEl.textContent = completed;
}

async function fetchTasks() {
  if (!container) return;
  if (refreshBtn) refreshBtn.classList.add("spinning");

  try {
    const taskMap = new Map();
    let currentCursor = null;
    let hasMorePages = true;
    let pageCounter = 0;

    while (hasMorePages && pageCounter < 4) {
      pageCounter++;

      const payload = {
        databaseId: TASK_DB_ID,
        page_size: 100
      };

      if (currentCursor) {
        payload.start_cursor = currentCursor;
      }

      const res = await fetch("/api/notion/query-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      const results = data.results || [];

      for (let i = 0; i < results.length; i++) {
        const page = results[i];
        if (!taskMap.has(page.id)) {
          taskMap.set(page.id, parseTask(page));
        }
      }

      if (data.has_more && data.next_cursor) {
        currentCursor = data.next_cursor;
      } else {
        hasMorePages = false;
      }
    }

    const rawList = Array.from(taskMap.values());
    allTasks = filterTasksRule(rawList);

    updateTelemetry();
    render();
  } catch (err) {
    console.error("Fetch tasks error:", err);
    container.innerHTML = `
      <div style="padding: 24px; color: #f43f5e; border: 1px dashed rgba(244,63,94,0.4); border-radius: 16px; text-align: center;">
        Failed to fetch checklist: ${err.message}
      </div>
    `;
  } finally {
    if (refreshBtn) refreshBtn.classList.remove("spinning");
  }
}

function formatTaskDate(task) {
  const displayDateStr = task.date || task.formulaDate || "";
  if (!displayDateStr || displayDateStr.trim() === "") return "No Due Date";
  const d = new Date(displayDateStr);
  let str = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (task.hasTime) {
    str += " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return str;
}

function renderTaskCard(task, showStatusBadge = false, columnType = "") {
  const statusClass = getStatusClass(task.status);
  const prioClass = getPriorityClass(task.priority);
  const cardPrioClass = getPriorityCardClass(task.priority);
  const dateFormatted = formatTaskDate(task);
  const hasValidDate = dateFormatted !== "No Due Date";
  const normStatus = getNormalizedStatus(task.status);
  const isInProgress = !task.isDone && normStatus === "in-progress";

  let checkIcon = `<i class="fa-solid fa-check"></i>`;
  if (isInProgress) {
    checkIcon = `<i class="fa-solid fa-minus"></i>`;
  }

  let actionButtonsHtml = "";
  const currentContext = columnType || (task.isDone ? "done" : normStatus);

  if (currentContext === "in-progress") {
    actionButtonsHtml = `
      <div class="item-status-actions">
        <button type="button" class="status-action-btn btn-to-todo" onclick="handleStatusTransition(event, '${task.id}', 'Not Started')">
          <i class="fa-regular fa-circle-play"></i> Mark Not Started
        </button>
      </div>
    `;
  } else if (currentContext === "todo") {
    actionButtonsHtml = `
      <div class="item-status-actions">
        <button type="button" class="status-action-btn btn-to-prog" onclick="handleStatusTransition(event, '${task.id}', 'In Progress')">
          <i class="fa-solid fa-circle-half-stroke"></i> Mark In Progress
        </button>
      </div>
    `;
  } else if (currentContext === "done") {
    actionButtonsHtml = `
      <div class="item-status-actions">
        <button type="button" class="status-action-btn btn-to-todo" onclick="handleStatusTransition(event, '${task.id}', 'Not Started')">
          <i class="fa-regular fa-circle-play"></i> Mark Not Started
        </button>
        <button type="button" class="status-action-btn btn-to-prog" onclick="handleStatusTransition(event, '${task.id}', 'In Progress')">
          <i class="fa-solid fa-circle-half-stroke"></i> Mark In Progress
        </button>
      </div>
    `;
  }

  return `
    <div class="checklist-item ${cardPrioClass} ${task.isDone ? 'is-done' : ''} ${isInProgress ? 'is-in-progress' : ''}" data-id="${task.id}">
      <div class="item-left">
        <div class="check-box" onclick="handleCheckboxClick(event, '${task.id}')">
          ${checkIcon}
        </div>
        <div class="item-text-wrap">
          <span class="item-title">${task.title}</span>
          <div class="item-submeta">
            ${hasValidDate ? `
              <span class="date-highlight-badge ${task.hasTime ? 'has-time' : ''}">
                <i class="fa-regular fa-calendar"></i>
                <span>${dateFormatted}</span>
              </span>
            ` : `
              <span style="color: var(--text-dim); opacity: 0.75;"><i class="fa-regular fa-calendar-xmark"></i> No Date</span>
            `}
            ${task.priority ? `<span class="task-priority ${prioClass}">${task.priority}</span>` : ""}
          </div>
          ${actionButtonsHtml}
        </div>
      </div>

      <div class="item-right">
        ${showStatusBadge ? `<span class="task-status-badge ${statusClass}">${task.status}</span>` : ""}
        <a href="${task.url}" target="_blank" class="open-link-btn" title="Open in Notion" aria-label="Open in Notion">
          ${NOTION_SVG_ICON}
        </a>
      </div>
    </div>
  `;
}

function multiLevelTaskComparator(a, b) {
  const dateA = a.date || a.formulaDate || "";
  const dateB = b.date || b.formulaDate || "";
  if (dateA !== dateB) {
    if (!dateA) return 1;
    if (!dateB) return -1;
    const diff = dateA.localeCompare(dateB);
    if (diff !== 0) return diff;
  }

  const rankA = PRIORITY_RANK[(a.priority || "").toLowerCase()] || 3;
  const rankB = PRIORITY_RANK[(b.priority || "").toLowerCase()] || 3;
  if (rankA !== rankB) return rankA - rankB;

  return (a.title || "").localeCompare(b.title || "");
}

function renderMasterView(taskList) {
  const datedTasks = [];
  for (let i = 0; i < taskList.length; i++) {
    const d = taskList[i].date || taskList[i].formulaDate;
    if (d && d.trim() !== "") {
      datedTasks.push(taskList[i]);
    }
  }

  if (datedTasks.length === 0) {
    return `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 48px 16px; color: var(--text-dim); border: 1px dashed var(--panel-border); border-radius: 16px;">
        <i class="fa-solid fa-calendar-xmark" style="font-size: 1.8rem; color: var(--notion-grey-primary);"></i>
        <span style="font-size: 0.95rem; font-weight: 600; color: #fff;">No tasks with due dates</span>
      </div>
    `;
  }

  const STAGE_1_ORDER = ["Past Due", "Due Today", "Due Tomorrow", "Future Due"];
  const STAGE_3_ORDER = ["Recurring Tasks", "Due Date & Time", "Due Date"];

  const tree = new Map();
  for (let i = 0; i < STAGE_1_ORDER.length; i++) {
    tree.set(STAGE_1_ORDER[i], new Map());
  }

  for (let i = 0; i < datedTasks.length; i++) {
    const t = datedTasks[i];
    const targetDate = t.date || t.formulaDate;
    const s1 = getStage1Bucket(targetDate);
    if (!s1 || !tree.has(s1)) continue;

    const s2Date = targetDate.slice(0, 10);
    const s1Map = tree.get(s1);

    if (!s1Map.has(s2Date)) {
      s1Map.set(s2Date, new Map());
      for (let j = 0; j < STAGE_3_ORDER.length; j++) {
        s1Map.get(s2Date).set(STAGE_3_ORDER[j], []);
      }
    }

    const s3Type = getStage3Type(t);
    const s3Bucket = s1Map.get(s2Date).get(s3Type) || s1Map.get(s2Date).get("Due Date");
    s3Bucket.push(t);
  }

  const htmlFragments = [];

  for (let i = 0; i < STAGE_1_ORDER.length; i++) {
    const s1Name = STAGE_1_ORDER[i];
    const s1Map = tree.get(s1Name);
    if (s1Map.size === 0) continue;

    let totalS1Count = 0;
    for (const dMap of s1Map.values()) {
      for (const arr of dMap.values()) {
        totalS1Count += arr.length;
      }
    }
    if (totalS1Count === 0) continue;

    let s1Icon = "fa-calendar-days";
    let s1Class = "s1-pastdue";
    if (s1Name === "Past Due") { s1Icon = "fa-triangle-exclamation"; s1Class = "s1-pastdue"; }
    else if (s1Name === "Due Today") { s1Icon = "fa-calendar-day"; s1Class = "s1-today"; }
    else if (s1Name === "Due Tomorrow") { s1Icon = "fa-clock"; s1Class = "s1-tomorrow"; }
    else if (s1Name === "Future Due") { s1Icon = "fa-calendar-week"; s1Class = "s1-future"; }

    const isOpenS1 = s1Name === "Due Today" ? "open" : "";
    const s1Key = `s1-${s1Name.replace(/\s+/g, "_")}`;

    htmlFragments.push(`
      <details class="stage1-group ${s1Class}" data-accord-key="${s1Key}" ${isOpenS1}>
        <summary class="stage1-summary">
          <i class="fa-solid ${s1Icon}"></i>
          <span>${s1Name}</span>
          <span class="stage1-badge">${totalS1Count}</span>
          <i class="fa-solid fa-chevron-down chevron-icon"></i>
        </summary>
        <div class="stage1-content">
    `);

    const sortedDates = Array.from(s1Map.keys()).sort((a, b) => a.localeCompare(b));

    for (let dIdx = 0; dIdx < sortedDates.length; dIdx++) {
      const dKey = sortedDates[dIdx];
      const s3Map = s1Map.get(dKey);

      let totalDateCount = 0;
      for (const arr of s3Map.values()) {
        totalDateCount += arr.length;
      }
      if (totalDateCount === 0) continue;

      const dObj = new Date(dKey);
      const dLabel = dObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

      const isOpenS2 = s1Name === "Due Today" ? "open" : "";
      const s2Key = `s2-${s1Name}-${dKey}`;

      htmlFragments.push(`
        <details class="stage2-group" data-accord-key="${s2Key}" ${isOpenS2}>
          <summary class="stage2-summary">
            <i class="fa-regular fa-calendar-check"></i>
            <span class="stage2-date-text">${dLabel}</span>
            <span class="stage2-badge">${totalDateCount}</span>
            <i class="fa-solid fa-chevron-down chevron-icon"></i>
          </summary>
          <div class="stage2-content">
      `);

      for (let s3Idx = 0; s3Idx < STAGE_3_ORDER.length; s3Idx++) {
        const s3Name = STAGE_3_ORDER[s3Idx];
        const s3Tasks = s3Map.get(s3Name);
        if (!s3Tasks || s3Tasks.length === 0) continue;

        let s3Icon = "fa-calendar";
        let s3ThemeClass = "stage3-theme-date";

        if (s3Name === "Recurring Tasks") {
          s3Icon = "fa-arrows-rotate";
          s3ThemeClass = "stage3-theme-recur";
        } else if (s3Name === "Due Date & Time") {
          s3Icon = "fa-clock";
          s3ThemeClass = "stage3-theme-datetime";
        }

        const inProgressList = [];
        const notStartedList = [];
        const doneList = [];

        for (let k = 0; k < s3Tasks.length; k++) {
          const item = s3Tasks[k];
          if (item.isDone) {
            doneList.push(item);
          } else if (getNormalizedStatus(item.status) === "in-progress") {
            inProgressList.push(item);
          } else {
            notStartedList.push(item);
          }
        }

        inProgressList.sort(multiLevelTaskComparator);
        notStartedList.sort(multiLevelTaskComparator);
        doneList.sort(multiLevelTaskComparator);

        const isOpenS3 = s1Name === "Due Today" ? "open" : "";
        const isPastDue = s1Name === "Past Due";
        const columnClass = isPastDue ? "stage4-columns-past-due" : "stage4-columns";
        const s3Key = `s3-${s1Name}-${dKey}-${s3Name.replace(/\s+/g, "_")}`;

        htmlFragments.push(`
          <details class="stage3-group ${s3ThemeClass}" data-accord-key="${s3Key}" ${isOpenS3}>
            <summary class="stage3-summary">
              <i class="fa-solid ${s3Icon}"></i>
              <span>${s3Name}</span>
              <span class="stage3-badge">${s3Tasks.length}</span>
              <i class="fa-solid fa-chevron-down chevron-icon"></i>
            </summary>
            <div class="stage3-content">
              <div class="${columnClass}">
                <!-- 1. IN PROGRESS -->
                <details class="stage4-col-details" data-accord-key="${s3Key}-prog" data-col="in-progress">
                  <summary class="stage4-col-summary col-prog">
                    <span>In Progress</span>
                    <span class="status-badge-prog badge-count">${inProgressList.length}</span>
                    <i class="fa-solid fa-chevron-down chevron-icon"></i>
                  </summary>
                  <div class="stage4-col-tasks">
                    ${inProgressList.length > 0 ? inProgressList.map(t => renderTaskCard(t, false, "in-progress")).join("") : `<div class="empty-col-msg" style="font-size: 0.7rem; color: var(--text-dim); padding: 8px 4px; text-align: center;">None</div>`}
                  </div>
                </details>

                <!-- 2. NOT STARTED -->
                <details class="stage4-col-details" data-accord-key="${s3Key}-todo" data-col="todo">
                  <summary class="stage4-col-summary col-todo">
                    <span>Not Started</span>
                    <span class="status-badge-todo badge-count">${notStartedList.length}</span>
                    <i class="fa-solid fa-chevron-down chevron-icon"></i>
                  </summary>
                  <div class="stage4-col-tasks">
                    ${notStartedList.length > 0 ? notStartedList.map(t => renderTaskCard(t, false, "todo")).join("") : `<div class="empty-col-msg" style="font-size: 0.7rem; color: var(--text-dim); padding: 8px 4px; text-align: center;">None</div>`}
                  </div>
                </details>

                ${!isPastDue ? `
                  <!-- 3. COMPLETED -->
                  <details class="stage4-col-details" data-accord-key="${s3Key}-done" data-col="done">
                    <summary class="stage4-col-summary col-done">
                      <span>Completed</span>
                      <span class="status-badge-done badge-count">${doneList.length}</span>
                      <i class="fa-solid fa-chevron-down chevron-icon"></i>
                    </summary>
                    <div class="stage4-col-tasks">
                      ${doneList.length > 0 ? doneList.map(t => renderTaskCard(t, false, "done")).join("") : `<div class="empty-col-msg" style="font-size: 0.7rem; color: var(--text-dim); padding: 8px 4px; text-align: center;">None</div>`}
                    </div>
                  </details>
                ` : ""}
              </div>
            </div>
          </details>
        `);
      }

      htmlFragments.push(`</div></details>`);
    }

    htmlFragments.push(`</div></details>`);
  }

  return htmlFragments.join("");
}

function attachAccordionSync() {
  if (!container) return;
  const dateAccordions = container.querySelectorAll(".stage2-group");
  dateAccordions.forEach(stage2 => {
    stage2.addEventListener("toggle", () => {
      if (stage2.open) {
        const colDetails = stage2.querySelectorAll(".stage4-col-details");
        colDetails.forEach(col => {
          if (col.dataset.col !== "done") {
            col.open = true;
          }
        });
      }
    });
  });
}

function render(preserveOpenState = false) {
  if (!container) return;

  const prevScrollTop = container.scrollTop;
  const openKeys = new Set();
  const hasExistingState = preserveOpenState && container.querySelectorAll("details").length > 0;

  if (hasExistingState) {
    container.querySelectorAll("details").forEach(d => {
      if (d.dataset.accordKey && d.open) {
        openKeys.add(d.dataset.accordKey);
      }
    });
  }

  const query = searchQuery.trim().toLowerCase();

  const filtered = allTasks.filter(task => {
    const norm = getNormalizedStatus(task.status);

    if (activeStatusFilter === "done" && !task.isDone) return false;
    if (activeStatusFilter === "todo" && (task.isDone || norm !== "todo")) return false;
    if (activeStatusFilter === "in-progress" && (task.isDone || norm !== "in-progress")) return false;

    if (query && !task.title.toLowerCase().includes(query)) {
      return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 48px 16px; color: var(--text-dim); border: 1px dashed var(--panel-border); border-radius: 16px;">
        <i class="fa-solid fa-list-check" style="font-size: 1.8rem; color: var(--notion-grey-primary);"></i>
        <span style="font-size: 0.95rem; font-weight: 600; color: #fff;">No items found</span>
      </div>
    `;
    return;
  }

  if (activeStatusFilter === "master") {
    container.innerHTML = renderMasterView(filtered);
    attachAccordionSync();

    if (hasExistingState) {
      container.querySelectorAll("details").forEach(d => {
        if (d.dataset.accordKey) {
          d.open = openKeys.has(d.dataset.accordKey);
        }
      });
    } else {
      container.querySelectorAll(".stage4-col-details").forEach(d => {
        if (d.dataset.col !== "done") d.open = true;
      });
    }

    if (preserveOpenState) {
      container.scrollTop = prevScrollTop;
    }
    return;
  }

  filtered.sort(multiLevelTaskComparator);
  container.innerHTML = filtered.map(t => renderTaskCard(t, true)).join("");

  if (preserveOpenState) {
    container.scrollTop = prevScrollTop;
  }
}

window.handleCheckboxClick = function(event, id) {
  if (event) {
    event.stopPropagation();
  }
  toggleTask(id);
};

window.handleStatusTransition = async function(event, id, targetStatusName) {
  if (event) {
    event.stopPropagation();
  }

  const task = allTasks.find(t => t.id === id);
  if (!task) return;

  const previousStatus = task.status;
  const previousIsDone = task.isDone;

  const isDoneTarget = targetStatusName.toLowerCase() === "done" || targetStatusName.toLowerCase() === "completed";
  task.status = targetStatusName;
  task.isDone = isDoneTarget;
  updateTelemetry();

  render(true);

  showToast(`Moved to ${targetStatusName} - ${task.title}`);

  try {
    const res = await fetch("/api/notion/update-page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: task.id,
        properties: {
          [task.statusPropName]: {
            status: { name: targetStatusName }
          }
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText);
    }
  } catch (err) {
    console.error("Notion update error:", err);
    task.status = previousStatus;
    task.isDone = previousIsDone;
    updateTelemetry();
    render(true);
    showToast(`Error: ${err.message.slice(0, 40)}`, true);
  }
};

window.toggleTask = async function(id) {
  const task = allTasks.find(t => t.id === id);
  if (!task) return;

  const previousState = task.isDone;
  const previousStatus = task.status;

  const targetState = !previousState;
  const targetStatusName = targetState ? "Done" : "Not Started";

  task.isDone = targetState;
  task.status = targetStatusName;
  updateTelemetry();

  render(true);

  if (targetState) {
    const formattedDateTime = formatTaskDate(task);
    showToast(`Task marked completed - ${task.title} - ${formattedDateTime}`);
  } else {
    showToast(`Marked Not Started - ${task.title}`);
  }

  try {
    const res = await fetch("/api/notion/update-page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: task.id,
        properties: {
          [task.statusPropName]: {
            status: { name: targetStatusName }
          }
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText);
    }
  } catch (err) {
    console.error("Notion update error:", err);
    task.isDone = previousState;
    task.status = previousStatus;
    updateTelemetry();
    render(true);
    showToast(`Error: ${err.message.slice(0, 40)}`, true);
  }
};

function getLocalISODate(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLocalISOTime(d = new Date()) {
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${mins}`;
}

function setDateShortcutsActive(activeBtn) {
  [btnDateToday, btnDateTomorrow, btnDateNoDue].forEach(b => b.classList.remove("active"));
  if (activeBtn) activeBtn.classList.add("active");
}

function openModal() {
  if (newTaskForm) newTaskForm.reset();
  taskPriorityInput.value = "Medium";
  taskDateInput.value = getLocalISODate();
  taskTimeInput.value = getLocalISOTime();
  taskIncludeTimeToggle.checked = false;
  taskTimeInput.classList.add("hidden");
  setDateShortcutsActive(btnDateToday);

  if (newTaskModal) newTaskModal.classList.add("show");
  if (taskTitleInput) taskTitleInput.focus();
}

function closeModal() {
  if (newTaskModal) newTaskModal.classList.remove("show");
}

if (openNewTaskBtn) openNewTaskBtn.addEventListener("click", openModal);
if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);

taskIncludeTimeToggle.addEventListener("change", (e) => {
  taskTimeInput.classList.toggle("hidden", !e.target.checked);
});

taskDateInput.addEventListener("input", () => {
  const today = getLocalISODate();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = getLocalISODate(tomorrowDate);

  if (taskDateInput.value === today) {
    setDateShortcutsActive(btnDateToday);
  } else if (taskDateInput.value === tomorrow) {
    setDateShortcutsActive(btnDateTomorrow);
  } else if (!taskDateInput.value) {
    setDateShortcutsActive(btnDateNoDue);
  } else {
    setDateShortcutsActive(null);
  }
});

btnDateToday.addEventListener("click", () => {
  taskDateInput.value = getLocalISODate();
  setDateShortcutsActive(btnDateToday);
});

btnDateTomorrow.addEventListener("click", () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  taskDateInput.value = getLocalISODate(d);
  setDateShortcutsActive(btnDateTomorrow);
});

btnDateNoDue.addEventListener("click", () => {
  taskDateInput.value = "";
  setDateShortcutsActive(btnDateNoDue);
});

if (newTaskForm) {
  newTaskForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = taskTitleInput.value.trim();
    if (!title) return;

    const priorityVal = taskPriorityInput.value;
    const dateVal = taskDateInput.value;
    const hasTime = taskIncludeTimeToggle.checked && taskTimeInput.value;
    const descVal = taskDescInput.value.trim();
    const urlVal = taskUrlInput.value.trim();

    const createProps = {
      [discoveredTitleProp]: {
        title: [{ text: { content: title } }]
      },
      [discoveredStatusProp]: {
        status: { name: "Not Started" }
      }
    };

    if (priorityVal && discoveredPriorityProp) {
      createProps[discoveredPriorityProp] = {
        select: { name: priorityVal }
      };
    }

    if (pareshUserId && discoveredPersonProp) {
      createProps[discoveredPersonProp] = {
        people: [{ id: pareshUserId }]
      };
    }

    if (dateVal && discoveredDateProp) {
      let finalDateString = dateVal;
      if (hasTime) {
        const timeVal = taskTimeInput.value.length === 5 ? `${taskTimeInput.value}:00` : taskTimeInput.value;
        finalDateString = `${dateVal}T${timeVal}+05:30`;
      }
      createProps[discoveredDateProp] = {
        date: { start: finalDateString }
      };
    }

    if (descVal && discoveredDescProp) {
      createProps[discoveredDescProp] = {
        rich_text: [{ text: { content: descVal } }]
      };
    }

    if (urlVal && discoveredUrlProp) {
      createProps[discoveredUrlProp] = {
        url: urlVal
      };
    }

    if (submitTaskBtn) {
      submitTaskBtn.disabled = true;
      submitTaskBtn.innerHTML = `<i class="fa-solid fa-rotate spin"></i> Creating...`;
    }

    const payload = {
      databaseId: TASK_DB_ID,
      properties: createProps,
      icon: {
        type: "external",
        external: {
          url: "https://www.notion.so/icons/checkmark_gray.svg"
        }
      }
    };

    try {
      let res = await fetch("/api/notion/create-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        payload.icon = {
          type: "emoji",
          emoji: "✔"
        };

        res = await fetch("/api/notion/create-page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const fallbackText = await res.text();
          throw new Error(fallbackText);
        }
      }

      const createdPage = await res.json();
      const newTaskObj = parseTask(createdPage);

      allTasks.unshift(newTaskObj);
      updateTelemetry();
      render();
      closeModal();
      showToast("Task created in Notion!");
    } catch (err) {
      console.error("Failed to create task:", err);
      showToast(`Create failed: ${err.message.slice(0, 45)}`, true);
    } finally {
      if (submitTaskBtn) {
        submitTaskBtn.disabled = false;
        submitTaskBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> <span>Create Task</span>`;
      }
    }
  });
}

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    if (clearSearchBtn) clearSearchBtn.classList.toggle("hidden", searchQuery.trim().length === 0);
    render();
  });
}

if (clearSearchBtn) {
  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchQuery = "";
    clearSearchBtn.classList.add("hidden");
    render();
  });
}

if (refreshBtn) {
  refreshBtn.addEventListener("click", () => fetchTasks());
}

document.querySelectorAll("#statusFilterPills .pill").forEach(pill => {
  pill.addEventListener("click", () => {
    document.querySelectorAll("#statusFilterPills .pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    activeStatusFilter = pill.dataset.status;
    render();
  });
});

document.addEventListener("DOMContentLoaded", async () => {
  await resolvePareshUser();
  fetchTasks();
});