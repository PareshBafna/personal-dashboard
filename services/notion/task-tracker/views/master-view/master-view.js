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

export function renderMasterView(taskList) {
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
                <details class="stage4-col-details" data-accord-key="${s3Key}-prog" data-col="in-progress" open>
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
                <details class="stage4-col-details" data-accord-key="${s3Key}-todo" data-col="todo" open>
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

export function attachAccordionSync(container) {
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