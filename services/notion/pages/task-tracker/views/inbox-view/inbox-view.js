// File: services/notion/pages/task-tracker/views/inbox-view/inbox-view.js

import { renderInboxTaskCard, getDueRaw, toLocalDateString, toWallTime } from "./task-card/task-card.js";
import { isInboxTask } from "./features/due-date-fix/due-date-fix.js";

export { isInboxTask };

const PRIORITY_RANK = { critical: 1, high: 2, medium: 3, low: 4, lowest: 5 };

function extractTaskTime(task) {
  const raw = getDueRaw(task) || task.nativeDate || task.date;
  return toWallTime(raw) || "99:99";
}

function inboxTaskComparator(a, b) {
  const timeA = extractTaskTime(a);
  const timeB = extractTaskTime(b);
  if (timeA !== timeB) return timeA.localeCompare(timeB);

  const rA = PRIORITY_RANK[(a.priority || "").toLowerCase()] || 3;
  const rB = PRIORITY_RANK[(b.priority || "").toLowerCase()] || 3;
  if (rA !== rB) return rA - rB;

  return (a.title || "").localeCompare(b.title || "");
}

function getStage1Bucket(taskDate) {
  if (!taskDate) return "Past Due";
  const dOnly = toLocalDateString(taskDate);
  if (!dOnly) return "Past Due";

  const now = new Date();
  const today = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  const tom = new Date(now.getTime() + 86400000);
  const tomorrow = tom.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  if (dOnly < today) return "Past Due";
  if (dOnly === today) return "Due Today";
  if (dOnly === tomorrow) return "Due Tomorrow";
  return "Future Due";
}

export function renderInboxView(inboxTasks) {
  if (!inboxTasks || !inboxTasks.length) {
    return `
      <div class="inbox-zero-banner">
        <i class="fa-solid fa-circle-check"></i>
        <span>Inbox Zero: No tasks with incorrect due dates!</span>
      </div>
    `;
  }

  const STAGE_1_ORDER = ["Past Due", "Due Today", "Due Tomorrow", "Future Due", "No Due Date"];

  const tree = new Map();
  for (let i = 0; i < STAGE_1_ORDER.length; i++) {
    tree.set(STAGE_1_ORDER[i], new Map());
  }

  for (let i = 0; i < inboxTasks.length; i++) {
    const t = inboxTasks[i];
    const targetDate = getDueRaw(t) || t.nativeDate || t.date || "";
    const s1 = getStage1Bucket(targetDate);
    if (!tree.has(s1)) tree.set(s1, new Map());

    const s2Date = targetDate ? (toLocalDateString(targetDate) || "No Date") : "No Date";
    const s1Map = tree.get(s1);

    if (!s1Map.has(s2Date)) {
      s1Map.set(s2Date, []);
    }

    s1Map.get(s2Date).push(t);
  }

  const htmlFragments = [];

  for (let i = 0; i < STAGE_1_ORDER.length; i++) {
    const s1Name = STAGE_1_ORDER[i];
    const s1Map = tree.get(s1Name);
    if (!s1Map || s1Map.size === 0) continue;

    let totalS1Count = 0;
    for (const arr of s1Map.values()) {
      totalS1Count += arr.length;
    }
    if (totalS1Count === 0) continue;

    let s1Icon = "fa-calendar-days";
    let s1Class = "s1-pastdue";
    if (s1Name === "Past Due") { s1Icon = "fa-triangle-exclamation"; s1Class = "s1-pastdue"; }
    else if (s1Name === "Due Today") { s1Icon = "fa-calendar-day"; s1Class = "s1-today"; }
    else if (s1Name === "Due Tomorrow") { s1Icon = "fa-clock"; s1Class = "s1-tomorrow"; }
    else if (s1Name === "Future Due") { s1Icon = "fa-calendar-week"; s1Class = "s1-future"; }
    else if (s1Name === "No Due Date") { s1Icon = "fa-calendar-xmark"; s1Class = "s1-future"; }

    const s1Key = `s1-${s1Name.replace(/\s+/g, "_")}`;

    htmlFragments.push(`
      <details class="stage1-group ${s1Class}" data-accord-key="${s1Key}" open>
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
      const taskArr = s1Map.get(dKey);
      if (!taskArr || taskArr.length === 0) continue;

      taskArr.sort(inboxTaskComparator);

      let dLabel = dKey;
      if (dKey !== "No Date") {
        const dObj = new Date(dKey + "T00:00:00Z");
        dLabel = !isNaN(dObj.getTime())
          ? dObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })
          : dKey;
      }

      const s2Key = `s2-${s1Name.replace(/\s+/g, "_")}-${dKey}`;

      htmlFragments.push(`
        <details class="stage2-group" data-accord-key="${s2Key}" open>
          <summary class="stage2-summary">
            <i class="fa-regular fa-calendar-check"></i>
            <span class="stage2-date-text">${dLabel}</span>
            <span class="stage2-badge">${taskArr.length}</span>
            <i class="fa-solid fa-chevron-down chevron-icon"></i>
          </summary>
          <div class="stage2-content" style="padding-top: 8px;">
            <div class="inbox-cards-grid">
              ${taskArr.map(t => renderInboxTaskCard(t)).join("")}
            </div>
          </div>
        </details>
      `);
    }

    htmlFragments.push(`</div></details>`);
  }

  return htmlFragments.join("");
}