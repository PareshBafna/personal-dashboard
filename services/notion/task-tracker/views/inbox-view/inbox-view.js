import { renderTaskCard, multiLevelTaskComparator } from "/services/notion/common/task-card/task-card.js";

export function renderInboxView(taskList) {
  const undatedTasks = taskList.filter(t => !t.date && !t.formulaDate).sort(multiLevelTaskComparator);
  if (!undatedTasks.length) {
    return `<div style="display:flex; flex-direction:column; align-items:center; gap:8px; padding:48px 16px; color:var(--text-dim); border:1px dashed var(--panel-border); border-radius:16px;"><span>No undated inbox tasks</span></div>`;
  }
  return undatedTasks.map(t => renderTaskCard(t, true)).join("");
}