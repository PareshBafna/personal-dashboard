// File: services/notion/pages/task-tracker/views/inbox-view/features/due-date-fix/due-date-fix.js

import { showToast } from "../../../../../../common/features/toast/toast.js";

const TZ = "Asia/Kolkata";
const HAS_OFFSET = /T.*(Z|[+-]\d{2}:?\d{2})$/;
const IST_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
});

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
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
  return m ? `${m[1]} ${m[2]}:${m[3]}:${m[4] || "00"}` : "";
}

export function getFormulaDueRaw(task) {
  if (task.formulaDate) return task.formulaDate;
  const props = task.properties || {};
  for (const [key, p] of Object.entries(props)) {
    const k = key.trim().toLowerCase();
    if (!k.includes("formula due date w/o tz") && !k.includes("without tz") && !k.includes("w/o tz")) continue;
    if (!p) return "";
    if (p.type === "formula" && p.formula) {
      if (p.formula.date?.start) return p.formula.date.start;
      if (p.formula.string) return p.formula.string;
    }
    if (p.type === "date" && p.date?.start) return p.date.start;
    if (p.type === "rollup" && p.rollup?.date?.start) return p.rollup.date.start;
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

export function computeExpected(task) {
  const createdRaw = task.createdTime || task.properties?.["Created Time"]?.created_time || task.properties?.["Created time"]?.created_time;
  const H = getNumProp(task, "due hours");
  const M = getNumProp(task, "due minutes");

  if (!createdRaw || H == null || M == null) return null;

  const createdIstStamp = toIstStamp(createdRaw);
  if (!createdIstStamp) return null;
  const createdDateOnly = createdIstStamp.slice(0, 10);

  const hh = String(H).padStart(2, "0");
  const mm = String(M).padStart(2, "0");
  const expectedStamp = `${createdDateOnly} ${hh}:${mm}:00`;

  return { expectedStamp, istStamp: expectedStamp };
}

export function isInboxTask(task) {
  if (!task) return false;

  const flag = task.missingDataString || "";
  let hasIncorrectFlag = flag.includes("Incorrect Due Date");

  if (!hasIncorrectFlag && task.properties) {
    for (const [key, p] of Object.entries(task.properties)) {
      if (key.trim().toLowerCase() === "missing data") {
        const s = JSON.stringify(p || {});
        if (s.includes("Incorrect Due Date")) {
          hasIncorrectFlag = true;
          break;
        }
      }
    }
  }

  if (!hasIncorrectFlag) return false;

  const dueRaw = task.nativeDate || task.date;
  if (!dueRaw) return true;

  const exp = computeExpected(task);
  if (!exp || !exp.expectedStamp) return true;

  const actualDueIstStamp = toIstStamp(dueRaw);
  return actualDueIstStamp !== exp.expectedStamp;
}

function resolveDueDatePropName(task) {
  if (task.datePropName) return task.datePropName;
  const props = task.properties || {};
  for (const [key, p] of Object.entries(props)) {
    if (p.type === "date") return key;
  }
  return "Due Date";
}

export function getResolvedExpectedIstIso(task) {
  const exp = computeExpected(task);
  let targetStamp = "";

  if (exp && exp.istStamp) {
    targetStamp = exp.istStamp;
  } else {
    const fRaw = getFormulaDueRaw(task);
    targetStamp = toIstStamp(fRaw);
  }

  if (!targetStamp) return null;

  const m = targetStamp.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}:\d{2})(?::(\d{2}))?)?/);
  if (m) {
    const datePart = m[1];
    const timePart = m[2] || "00:00";
    const secPart = m[3] || "00";
    return `${datePart}T${timePart}:${secPart}+05:30`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(targetStamp)) {
    return targetStamp;
  }

  return null;
}

export function renderFixDueDateButton(taskId) {
  return `
    <button type="button" class="open-notion-btn fix-due-date-card-btn" data-action="fix-due-date" data-id="${taskId}">
      <i class="fa-solid fa-wrench"></i>
      <span>Fix Due Date</span>
    </button>
  `;
}

export async function triggerFixDueDate(task, btn, onComplete) {
  const finalDateStr = getResolvedExpectedIstIso(task);
  if (!finalDateStr) {
    showToast("Could not compute expected due date", true);
    return;
  }

  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-rotate spin"></i> Fixing...`;

  try {
    const propName = resolveDueDatePropName(task);

    const res = await fetch("/api/notion/update-page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: task.id,
        properties: {
          [propName]: {
            date: {
              start: finalDateStr
            }
          }
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText);
    }

    showToast("Due date updated");
    if (typeof onComplete === "function") await onComplete();
  } catch (err) {
    console.error("Fix Due Date error:", err);
    showToast(`Fix failed: ${err.message.slice(0, 45)}`, true);
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}