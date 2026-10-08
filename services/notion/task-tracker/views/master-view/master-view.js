import { renderTaskCard, multiLevelTaskComparator } from "/services/notion/common/task-card/task-card.js";

function getStage1Bucket(taskDate) {
  if (!taskDate) return null;
  const dOnly = taskDate.slice(0, 10);
  const now = new Date();
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const today = fmt(now);
  const tom = new Date(now);
  tom.setDate(tom.getDate() + 1);
  const tomorrow = fmt(tom);

  if (dOnly < today) return "Past Due";
  if (dOnly === today) return "Due Today";
  if (dOnly === tomorrow) return "Due Tomorrow";
  return "Future Due";
}

function getStage3Type(task) {
  if (task.isRecurring) return "Recurring Tasks";
  if (task.hasTime) return "Due Date & Time";
  return "Due Date";
}

const PRIORITY_ORDER = ["Critical", "High", "Medium", "Low", "Lowest"];

function getJiraPriorityIcon(prio) {
  const p = (prio || "").toLowerCase();
  if (p === "critical") return "fa-angles-up";
  if (p === "high") return "fa-chevron-up";
  if (p === "medium") return "fa-equals";
  if (p === "low") return "fa-chevron-down";
  return "fa-angles-down";
}

function renderStatusColumns(tasks, columnClass, keyPrefix, isPastDue, isParentDueToday, applyDefaults = true) {
  const inProgressList = [];
  const notStartedList = [];
  const doneList = [];

  for (const item of tasks) {
    const norm = (item.status || "").toLowerCase();
    if (item.isDone || norm === "done" || norm.includes("complete")) {
      doneList.push(item);
    } else if (norm.includes("progress")) {
      inProgressList.push(item);
    } else {
      notStartedList.push(item);
    }
  }

  inProgressList.sort(multiLevelTaskComparator);
  notStartedList.sort(multiLevelTaskComparator);
  doneList.sort(multiLevelTaskComparator);

  const openColAttr = (applyDefaults && isParentDueToday) ? "open" : "";

  return `
    <div class="${columnClass}">
      <details class="stage4-col-details" data-accord-key="${keyPrefix}-prog" data-col="in-progress" ${openColAttr}>
        <summary class="stage4-col-summary col-prog">
          <i class="fa-solid fa-circle-half-stroke"></i>
          <span>In Progress</span>
          <span class="status-badge-prog badge-count">${inProgressList.length}</span>
          <i class="fa-solid fa-chevron-down chevron-icon"></i>
        </summary>
        <div class="stage4-col-tasks">
          ${inProgressList.length > 0 ? inProgressList.map(t => renderTaskCard(t, false, "in-progress")).join("") : `<div class="empty-col-msg" style="font-size: 0.7rem; color: var(--text-dim); padding: 8px 4px; text-align: center;">None</div>`}
        </div>
      </details>

      <details class="stage4-col-details" data-accord-key="${keyPrefix}-todo" data-col="todo" ${openColAttr}>
        <summary class="stage4-col-summary col-todo">
          <i class="fa-regular fa-circle-play"></i>
          <span>Not Started</span>
          <span class="status-badge-todo badge-count">${notStartedList.length}</span>
          <i class="fa-solid fa-chevron-down chevron-icon"></i>
        </summary>
        <div class="stage4-col-tasks">
          ${notStartedList.length > 0 ? notStartedList.map(t => renderTaskCard(t, false, "todo")).join("") : `<div class="empty-col-msg" style="font-size: 0.7rem; color: var(--text-dim); padding: 8px 4px; text-align: center;">None</div>`}
        </div>
      </details>

      ${!isPastDue ? `
        <details class="stage4-col-details" data-accord-key="${keyPrefix}-done" data-col="done">
          <summary class="stage4-col-summary col-done">
            <i class="fa-solid fa-circle-check"></i>
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
  `;
}

export function renderMasterView(taskList, applyDefaults = true) {
  const datedTasks = taskList.filter(t => (t.date || t.formulaDate || "").trim());
  if (!datedTasks.length) {
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

    const isDueToday = s1Name === "Due Today";
    const s1OpenAttr = (applyDefaults && isDueToday) ? "open" : "";
    const s1Key = `s1-${s1Name.replace(/\s+/g, "_")}`;

    htmlFragments.push(`
      <details class="stage1-group ${s1Class}" data-accord-key="${s1Key}" ${s1OpenAttr}>
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
      const s2Key = `s2-${s1Name.replace(/\s+/g, "_")}-${dKey}`;
      const s2OpenAttr = (applyDefaults && isDueToday) ? "open" : "";

      htmlFragments.push(`
        <details class="stage2-group" data-accord-key="${s2Key}" ${s2OpenAttr}>
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

        const isPastDue = s1Name === "Past Due";
        const columnClass = isPastDue ? "stage4-columns-past-due" : "stage4-columns";
        const s3Key = `${s2Key}-${s3Name.replace(/[\s&]+/g, "_")}`;
        const s3OpenAttr = (applyDefaults && isDueToday) ? "open" : "";

        let innerContentHtml = "";

        if (s3Name === "Recurring Tasks" || s3Name === "Due Date & Time") {
          innerContentHtml = renderStatusColumns(s3Tasks, columnClass, s3Key, isPastDue, isDueToday, applyDefaults);
        } else {
          const prioMap = new Map();
          for (const p of PRIORITY_ORDER) {
            prioMap.set(p, []);
          }

          for (const item of s3Tasks) {
            const rawPrio = (item.priority || "Medium").toLowerCase();
            const matchKey = PRIORITY_ORDER.find(p => p.toLowerCase() === rawPrio) || "Medium";
            prioMap.get(matchKey).push(item);
          }

          const prioHtmlFragments = [];

          for (const pName of PRIORITY_ORDER) {
            const pTasks = prioMap.get(pName);
            if (!pTasks || pTasks.length === 0) continue;

            const pKey = `${s3Key}-prio-${pName.toLowerCase()}`;
            const prioThemeClass = `prio-grp-${pName.toLowerCase()}`;
            const prioColumnsHtml = renderStatusColumns(pTasks, columnClass, pKey, isPastDue, isDueToday, applyDefaults);
            const jiraIcon = getJiraPriorityIcon(pName);
            const prioOpenAttr = (applyDefaults && isDueToday) ? "open" : "";

            prioHtmlFragments.push(`
              <details class="stage-prio-group ${prioThemeClass}" data-accord-key="${pKey}" ${prioOpenAttr}>
                <summary class="stage-prio-summary">
                  <i class="fa-solid ${jiraIcon} jira-prio-icon"></i>
                  <span>${pName}</span>
                  <span class="stage-prio-badge">${pTasks.length}</span>
                  <i class="fa-solid fa-chevron-down chevron-icon"></i>
                </summary>
                <div class="stage-prio-content">
                  ${prioColumnsHtml}
                </div>
              </details>
            `);
          }

          innerContentHtml = `
            <div class="priority-groups-container">
              ${prioHtmlFragments.join("")}
            </div>
          `;
        }

        htmlFragments.push(`
          <details class="stage3-group ${s3ThemeClass}" data-accord-key="${s3Key}" ${s3OpenAttr}>
            <summary class="stage3-summary">
              <i class="fa-solid ${s3Icon}"></i>
              <span>${s3Name}</span>
              <span class="stage3-badge">${s3Tasks.length}</span>
              <i class="fa-solid fa-chevron-down chevron-icon"></i>
            </summary>
            <div class="stage3-content">
              ${innerContentHtml}
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

export function attachDateAccordionSync(container) {
  if (!container) return;
  container.querySelectorAll(".stage2-group").forEach(stage2 => {
    const summary = stage2.querySelector(":scope > summary");
    if (!summary) return;
    summary.addEventListener("click", () => {
      // click fires before native toggle: open === false means about to open
      if (stage2.open) return;
      stage2.querySelectorAll(".stage3-group").forEach(s3 => { s3.open = true; });
      stage2.querySelectorAll(".stage-prio-group").forEach(sp => { sp.open = true; });
      stage2.querySelectorAll(".stage4-col-details").forEach(col => {
        if (col.dataset.col !== "done") col.open = true;
      });
    });
  });
}