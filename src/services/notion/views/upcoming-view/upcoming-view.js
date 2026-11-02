// File: services/notion/views/upcoming-view/upcoming-view.js
// Only future tasks: Tomorrow and Future Due. (No Due belongs to All view)

import { renderUpcomingTaskCard, upcomingTaskComparator, toLocalDateString, getNativeDueDateRaw } from "./task-card/task-card.js";

const TZ = "Asia/Kolkata";

function isTaskCompleted(item) {
  const norm = (item.status || "").toLowerCase();
  return !!(item.isDone || norm === "done" || norm.includes("complete"));
}

function getTomorrowDateString() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

function getUpcomingBucket(task) {
  const rawDue = getNativeDueDateRaw(task);
  const dOnly = toLocalDateString(rawDue);

  if (!dOnly) return null; // No Due goes to All view!

  const tomorrow = getTomorrowDateString();

  if (dOnly === tomorrow) return "Tomorrow";
  if (dOnly > tomorrow) return "Future Due";
  return null;
}

export function renderUpcomingView(taskList) {
  const activeTasks = (taskList || []).filter(t => !isTaskCompleted(t));

  const buckets = {
    "Tomorrow": [],
    "Future Due": []
  };

  for (const t of activeTasks) {
    const b = getUpcomingBucket(t);
    if (b && buckets[b]) {
      buckets[b].push(t);
    }
  }

  const L1_ORDER = [
    { key: "Tomorrow", class: "s1-tomorrow", icon: "fa-calendar-day" },
    { key: "Future Due", class: "s1-future", icon: "fa-calendar-week" }
  ];

  const totalCount = buckets["Tomorrow"].length + buckets["Future Due"].length;

  if (totalCount === 0) {
    return `
      <div class="empty-placeholder">
        <i class="fa-solid fa-calendar-check" style="font-size: 2rem; color: var(--c-futuredue); margin-bottom: 6px;"></i>
        <h3>No Upcoming Tasks</h3>
        <p>No tasks scheduled for tomorrow or future dates.</p>
      </div>
    `;
  }

  const html = [];

  for (const l1 of L1_ORDER) {
    const tasks = buckets[l1.key];
    if (!tasks.length) continue;

    const inProgTasks = tasks.filter(t => (t.status || "").toLowerCase().includes("progress"));
    const notStartedTasks = tasks.filter(t => !(t.status || "").toLowerCase().includes("progress"));

    inProgTasks.sort(upcomingTaskComparator);
    notStartedTasks.sort(upcomingTaskComparator);

    html.push(`
      <details class="stage1-group ${l1.class}" open>
        <summary class="stage1-summary">
          <i class="fa-solid ${l1.icon}"></i>
          <span>${l1.key}</span>
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
              <div class="stage4-columns">
                <details class="stage4-col-details" data-col="in-progress" open>
                  <summary class="stage4-col-summary col-prog">
                    <i class="fa-solid fa-circle-half-stroke"></i>
                    <span>In Progress</span>
                    <span class="status-badge-prog badge-count">${inProgTasks.length}</span>
                    <i class="fa-solid fa-chevron-down chevron-icon"></i>
                  </summary>
                  <div class="stage4-col-tasks">
                    ${inProgTasks.length > 0
                      ? inProgTasks.map(t => renderUpcomingTaskCard(t, "in-progress")).join("")
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
                      ? notStartedTasks.map(t => renderUpcomingTaskCard(t, "todo")).join("")
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