const PRIORITY_RANK = { critical: 1, high: 2, medium: 3, low: 4, lowest: 5 };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const TZ = "Asia/Kolkata";
const HAS_OFFSET = /T.*(Z|[+-]\d{2}:?\d{2})$/;

// Real due date = native date-type prop named like "Due Date". Not the formula, not other date props.
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

// String with offset/Z = real instant -> convert to IST. Floating/date-only -> read text.
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

function formatInboxDate(task) {
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

const IST_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
});

// Same as Notion formatDate(x, "YYYY-MM-DD HH:mm:ss"), in IST.
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

// Formula "w/o TZ" comes from API as UTC ("+00:00") but its clock text is the real IST wall clock.
// So read clock text, ignore offset.
export function toFormulaStamp(rawVal) {
  if (!rawVal) return "";
  const s = String(rawVal).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s} 00:00:00`;
  const m = s.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  return m ? `${m[1]} ${m[2]}:${m[3]}:${m[4] || "00"}` : "";
}

const FORMULA_PROP_NAME = "formula due date w/o tz";

// Read ONLY the property named "Formula Due Date w/o TZ". No other formula, no fallback.
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

// Notion API evaluates formulas in UTC, Notion UI in IST. Same formula, different day.
// "Formula Due Date w/o TZ" = (date of [Due Date - Due Hours - Due Minutes]) + Due Hours:Due Minutes.
// Recompute it in IST (what UI shows). utcStamp = what API would return; used to verify model vs real API value.
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

// Mirrors Notion "Missing Data" formula, "❌ Incorrect Due Date" branch only:
// Created Time >= 2026-06-01 AND formula date not empty AND Due Date not empty
// AND formatDate(formula) != formatDate(Due Date). Done tasks excluded.
// Formula value = IST recompute when it reproduces API value, else raw API value.
export function isInboxTask(task) {
  if (!task) return false;
  if (task.isDone || (task.status || "").toLowerCase().trim() === "done") return false;

  const created = toIstStamp(task.createdTime);
  if (!created || created < "2026-06-01 00:00:00") return false;

  const dueRaw = getDueRaw(task);
  if (!dueRaw) return false;

  const exp = computeExpected(task);
  let fStamp = "";
  if (exp && exp.modelOk) fStamp = exp.istStamp;
  else fStamp = toFormulaStamp(getFormulaDueRaw(task));

  const dStamp = toIstStamp(dueRaw);
  if (!fStamp || !dStamp) return false;

  return fStamp !== dStamp;
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

function renderInboxTaskCard(task) {
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
            <button type="button" class="open-notion-btn fix-due-date-card-btn" data-action="fix-due-date" data-id="${task.id}">
              <i class="fa-solid fa-wrench"></i>
              <span>Fix Due Date</span>
            </button>
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