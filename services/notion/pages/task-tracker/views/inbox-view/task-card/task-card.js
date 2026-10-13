// File: services/notion/pages/task-tracker/views/inbox-view/task-card/task-card.js

import { renderFixDueDateButton } from "../features/due-date-fix/due-date-fix.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TZ = "Asia/Kolkata";
const HAS_OFFSET = /T.*(Z|[+-]\d{2}:?\d{2})$/;

export function getDueRaw(task) {
  const props = task.properties || {};
  let best = null;
  for (const [key, p] of Object.entries(props)) {
    if (!p || p.type !== "date" || !p.date || !p.date.start) continue;
    const k = key.trim().toLowerCase();
    if (k === "due date") return p.date.start;
    if (!best && k.includes("due")) best = p.date.start;
  }
  return best || task.nativeDate || task.date || task.formulaDate || "";
}

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

export function toWallTime(rawVal) {
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

export function formatInboxDate(task) {
  const raw = getDueRaw(task);
  const dStr = toLocalDateString(raw);
  if (!dStr) return "No Due Date";
  const [, mo, da] = dStr.split("-").map(Number);
  let out = `${MONTHS[mo - 1]} ${da}`;
  const t = toWallTime(raw);
  if (t) {
    const [h, mi] = t.split(":").map(Number);
    const h12 = h % 12 === 0 ? 12 : h % 12;
    out += ` ${String(h12).padStart(2, "0")}:${String(mi).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  }
  return out;
}

export function renderInboxTaskCard(task) {
  const currentPrio = task.priority || "Medium";
  const cardPrioClass = `card-${currentPrio.toLowerCase()}`;
  const dateFormatted = formatInboxDate(task);
  const normStatus = (task.status || "Not Started").trim();

  return `
    <div class="checklist-item ${cardPrioClass}" data-id="${task.id}">
      <div class="item-text-wrap">
        <div class="task-info-section">
          <div class="task-info-top-row">
            <div class="item-title-with-icon">
              <i class="fa-regular fa-circle-check task-title-icon"></i>
              <span class="item-title">${task.title}</span>
            </div>
          </div>
          <div class="item-submeta">
            <span class="date-highlight-badge date-color-red">
              <i class="fa-regular fa-calendar"></i><span>${dateFormatted}</span>
            </span>
            <span class="task-status-badge">${normStatus}</span>
          </div>
        </div>

        <div class="task-card-divider"></div>

        <div class="task-actions-section">
          <div class="item-notion-action">
            ${renderFixDueDateButton(task.id)}
            <a href="${task.url}" target="_blank" class="open-notion-btn">
              <svg class="notion-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke-width="2.2"/>
                <path d="M7.5 7.5V16.5M7.5 8L16.5 16.5M16.5 7.5V16.5" stroke-width="2.2"/>
              </svg>
              <span>Open In Notion</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}