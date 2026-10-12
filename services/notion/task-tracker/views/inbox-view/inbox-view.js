// File: services/notion/task-tracker/views/inbox-view/inbox-view.js
// Filtering logic, date calculations, and container renderer for Inbox View

import { renderInboxTaskCard, getDueRaw, toLocalDateString, toWallTime } from "./task-card/task-card.js";

const PRIORITY_RANK = { critical: 1, high: 2, medium: 3, low: 4, lowest: 5 };
const TZ = "Asia/Kolkata";
const HAS_OFFSET = /T.*(Z|[+-]\d{2}:?\d{2})$/;

const IST_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
});

export { getDueRaw, toLocalDateString };

export function toIstStamp(rawVal) {
  if (!rawVal) return "";
  const s = String(rawVal).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s} 00:00:00`;
  if (HAS_OFFSET.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const o = {};
      IST_FMT.formatToParts(d).forEach(x => { o[x.type] = x.value; });
      return `${o.year}-${o.month}-${o.day} ${o.hour}:${o.minute}:${o.second}`;
    }
  }
  const m = s.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  return m ? `${m[1]} ${m[2]}:${m[3]}:${m[4] || "00"}` : "";
}

export function toFormulaStamp(rawVal) {
  if (!rawVal) return "";
  const s = String(rawVal).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s} 00:00:00`;
  const m = s.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  return m ? `${m[1]} ${m[2]}:${m[3]}:${m[4] || "00"}` : "";
}

const FORMULA_PROP_NAME = "formula due date w/o tz";

export function getFormulaDueRaw(task) {
  const props = task.properties || {};
  for (const [key, p] of Object.entries(props)) {
    if (key.trim().toLowerCase() !== FORMULA_PROP_NAME) continue;
    if (!p || p.type !== "formula" || !p.formula) return "";
    const f = p.formula;
    if (f.type === "date") return (f.date && f.date.start) ? String(f.date.start).trim() : "";
    if (f.type === "string") return f.string ? String(f.string).trim() : "";
    return "";
  }
  return "";
}

function getNumProp(task, name) {
  const props = task.properties || {};
  for (const [key, p] of Object.entries(props)) {
    if (key.trim().toLowerCase() !== name || !p) continue;
    let v = null;
    if (p.type === "number") v = p.number;
    else if (p.type === "formula" && p.formula) v = p.formula.number;
    else if (p.type === "rollup" && p.rollup) v = p.rollup.number;
    return (typeof v === "number") ? v : null;
  }
  return null;
}

function fmtIstStamp(d) {
  const o = {};
  IST_FMT.formatToParts(d).forEach(x => { o[x.type] = x.value; });
  return `${o.year}-${o.month}-${o.day} ${o.hour}:${o.minute}:${o.second}`;
}

export function computeExpected(task) {
  const dueRaw = getDueRaw(task);
  const H = getNumProp(task, "due hours");
  const M = getNumProp(task, "due minutes");
  if (!dueRaw || H == null || M == null) return null;
  const dueStamp = toIstStamp(dueRaw);
  if (!dueStamp) return null;

  const dueInstant = new Date(dueStamp.replace(" ", "T") + "+05:30");
  const offsetMs = (H * 60 + M) * 60000;
  const base = new Date(dueInstant.getTime() - offsetMs);

  const istDate = base.toLocaleDateString("en-CA", { timeZone: TZ });
  const istStamp = fmtIstStamp(new Date(Date.parse(`${istDate}T00:00:00+05:30`) + offsetMs));

  const utcDate = base.toISOString().slice(0, 10);
  const utcStamp = new Date(Date.parse(`${utcDate}T00:00:00Z`) + offsetMs).toISOString().slice(0, 19).replace("T", " ");

  const apiStamp = toFormulaStamp(getFormulaDueRaw(task));
  return { istStamp, utcStamp, apiStamp, modelOk: !!apiStamp && apiStamp === utcStamp };
}

export function isInboxTask(task) {
  if (!task) return false;

  const dueRaw = getDueRaw(task);
  if (!dueRaw) return false;

  // 1. If task has recur logic / expected model, verify against real IST stamp
  const exp = computeExpected(task);
  if (exp && exp.istStamp) {
    const currentIstStamp = toIstStamp(dueRaw);
    return currentIstStamp !== exp.istStamp;
  }

  // 2. For standard tasks without recur offsets, check if Missing Data flag is present AND date is missing/broken
  const missingVals = task.missingDataValues || [];
  const hasFlag = Array.isArray(missingVals) && missingVals.some(v => typeof v === "string" && v.includes("❌ Incorrect Due Date"));
  
  if (hasFlag) {
    const fRaw = getFormulaDueRaw(task);
    if (!fRaw) return false;
    const dStamp = toIstStamp(dueRaw);
    const fStamp = toFormulaStamp(fRaw);
    return dStamp.slice(0, 10) !== fStamp.slice(0, 10);
  }

  return false;
}

function extractTaskTime(task) {
  const raw = getDueRaw(task);
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
  if (!taskDate) return "No Due Date";
  const dOnly = toLocalDateString(taskDate);

  const now = new Date();
  const today = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  const tom = new Date(now.getTime() + 86400000);
  const tomorrow = tom.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  if (dOnly < today) return "Past Due";
  if (dOnly === today) return "Due Today";
  if (dOnly === tomorrow) return "Due Tomorrow";
  return "Future Due";
}

export function renderInboxView(inboxTasks, applyDefaults = true) {
  if (!inboxTasks || !inboxTasks.length) {
    return `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 48px 16px; color: var(--text-dim); border: 1px dashed var(--panel-border); border-radius: 16px;">
        <i class="fa-solid fa-circle-check" style="font-size: 1.8rem; color: #52c41a;"></i>
        <span style="font-size: 0.95rem; font-weight: 600; color: #fff;">Inbox Zero: No tasks with incorrect due dates!</span>
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
    const targetDate = getDueRaw(t);
    const s1 = getStage1Bucket(targetDate);
    if (!tree.has(s1)) tree.set(s1, new Map());

    const s2Date = targetDate ? toLocalDateString(targetDate) : "No Date";
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
      const taskArr = s1Map.get(dKey);
      if (!taskArr || taskArr.length === 0) continue;

      taskArr.sort(inboxTaskComparator);

      let dLabel = dKey;
      if (dKey !== "No Date") {
        const dObj = new Date(dKey + "T00:00:00Z");
        dLabel = dObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
      }

      const s2Key = `s2-${s1Name.replace(/\s+/g, "_")}-${dKey}`;
      const s2OpenAttr = (applyDefaults && isDueToday) ? "open" : "";

      htmlFragments.push(`
        <details class="stage2-group" data-accord-key="${s2Key}" ${s2OpenAttr}>
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