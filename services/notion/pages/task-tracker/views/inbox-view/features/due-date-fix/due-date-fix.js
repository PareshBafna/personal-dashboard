// File: services/notion/task-tracker/views/inbox-view/features/due-date-fix/due-date-fix.js
// Resolves expected due dates and patches Notion records without IST date rollback

import { showToast } from "../../../../../../common/features/toast/toast.js";
import { computeExpected, getFormulaDueRaw, toFormulaStamp } from "../../inbox-view.js";

function resolveDueDatePropName(task) {
  if (task.datePropName) return task.datePropName;
  const props = task.properties || {};
  for (const [key, p] of Object.entries(props)) {
    if (p.type === "date") return key;
  }
  return "Due Date";
}

// Convert target stamp directly to IST ISO 8601: YYYY-MM-DDTHH:mm:ss+05:30
export function getResolvedExpectedIstIso(task) {
  const exp = computeExpected(task);
  let targetStamp = "";

  if (exp && exp.istStamp) {
    targetStamp = exp.istStamp;
  } else {
    const fRaw = getFormulaDueRaw(task);
    targetStamp = toFormulaStamp(fRaw);
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