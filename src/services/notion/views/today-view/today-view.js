// File: services/notion/views/today-view/today-view.js

import { renderTodayTaskCard, todayTaskComparator, toLocalDateString, getNativeDueDateRaw } from "./task-card/task-card.js";

const TZ = "Asia/Kolkata";

function isTaskCompleted(item) {
  const norm = (item.status || "").toLowerCase();
  return !!(item.isDone || norm === "done" || norm.includes("complete"));
}

function getTodayLevel1Bucket(task) {
  const rawDue = getNativeDueDateRaw(task) || task.date || task.formulaDate || "";
  const dOnly = toLocalDateString(rawDue);
  if (!dOnly) return null;

  const today = new Date().toLocaleDateString("en-CA", { timeZone: TZ });
  if (dOnly < today) return "Past Due";
  if (dOnly === today) return "Due Today";
  return null;
}

export function renderTodayView(taskList) {
  const activeTasks = (taskList || []).filter(t => !isTaskCompleted(t));

  const buckets = {
    "Past Due": [],
    "Due Today": []
  };

  for (const t of activeTasks) {
    const b = getTodayLevel1Bucket(t);
    if (b && buckets[b]) {
      buckets[b].push(t);
    }
  }

  const L1_ORDER = ["Past Due", "Due Today"];
  const totalCount = buckets["Past Due"].length + buckets["Due Today"].length;

  if (totalCount === 0) {
    return `
      <div class="empty-placeholder">
        <i class="fa-solid fa-circle-check" style="font-size: 2rem; color: #52c41a; margin-bottom: 6px;"></i>
        <h3>All Caught Up</h3>
        <p>No past due or due today tasks in Task Tracker.</p>
      </div>
    `;
  }

  const html = [];

  for (const l1Name of L1_ORDER) {
    const tasks = buckets[l1Name];
    if (!tasks.length) continue;

    const isPast = l1Name === "Past Due";
    const l1Class = isPast ? "s1-pastdue" : "s1-today";
    const l1Icon = isPast ? "fa-triangle-exclamation" : "fa-calendar-day";

    const inProgTasks = tasks.filter(t => (t.status || "").toLowerCase().includes("progress"));
    const notStartedTasks = tasks.filter(t => !(t.status || "").toLowerCase().includes("progress"));

    inProgTasks.sort(todayTaskComparator);
    notStartedTasks.sort(todayTaskComparator);

    html.push(`
      <details class="stage1-group ${l1Class}" open>
        <summary class="stage1-summary">
          <i class="fa-solid ${l1Icon}"></i>
          <span>${l1Name}</span>
          <span class="stage1-badge">${tasks.length}</span>
          <i class="fa-solid fa-chevron-down chevron-icon"></i>
        </summary>
        <div class="stage1-content">
          <details class="stage2-group" open>
            <summary class="stage2-summary">
              <i class="fa-solid fa-list-check"></i>
              <span class="stage2-date-text">Task Tracker</span>
              <span class="stage2-badge">${tasks.length}</span>
              <i class="fa-solid fa-chevron-down chevron-icon"></i>
            </summary>
            <div class="stage2-content" style="padding-top: 8px;">
              <div class="${isPast ? "stage4-columns-past-due" : "stage4-columns"}">
                <details class="stage4-col-details" data-col="in-progress" open>
                  <summary class="stage4-col-summary col-prog">
                    <i class="fa-solid fa-circle-half-stroke"></i>
                    <span>In Progress</span>
                    <span class="status-badge-prog badge-count">${inProgTasks.length}</span>
                    <i class="fa-solid fa-chevron-down chevron-icon"></i>
                  </summary>
                  <div class="stage4-col-tasks">
                    ${inProgTasks.length > 0
                      ? inProgTasks.map(t => renderTodayTaskCard(t, "in-progress")).join("")
                      : `<div class="empty-col-msg" style="font-size: 0.7rem; color: var(--text-dim); padding: 8px 4px; text-align: center;">None</div>`
                    }
                  </div>
                </details>

                <details class="stage4-col-details" data-col="todo" open>
                  <summary class="stage4-col-summary col-todo">
                    <i class="fa-regular fa-circle-play"></i>
                    <span>Not Started</span>
                    <span class="status-badge-todo badge-count">${notStartedTasks.length}</span>
                    <i class="fa-solid fa-chevron-down chevron-icon"></i>
                  </summary>
                  <div class="stage4-col-tasks">
                    ${notStartedTasks.length > 0
                      ? notStartedTasks.map(t => renderTodayTaskCard(t, "todo")).join("")
                      : `<div class="empty-col-msg" style="font-size: 0.7rem; color: var(--text-dim); padding: 8px 4px; text-align: center;">None</div>`
                    }
                  </div>
                </details>
              </div>
            </div>
          </details>
        </div>
      </details>
    `);
  }

  return html.join("");
}