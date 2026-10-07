import { fetchAllTasks, resolvePareshUser } from "/services/notion/common/api/api.client.js";
import { updateTelemetry } from "./telemetry/telemetry.js";
import { initFilterToolbar, getFilterState } from "./filter-toolbar/filter-toolbar.js";
import { renderMasterView, attachAccordionSync } from "./views/master-view/master-view.js";
import { renderInboxView } from "./views/inbox-view/inbox-view.js";
import { renderTaskCard, multiLevelTaskComparator } from "/services/notion/common/task-card/task-card.js";
import { initAddTask } from "./crud/add-task/add-task.js";
import { updateTaskStatus } from "./crud/update-task/update-task.js";
import { deleteTask } from "./crud/delete-task/delete-task.js";

let allTasks = [];
const container = document.getElementById("tasksContainer");

async function loadFragments() {
  document.getElementById("telemetrySlot").innerHTML = await (await fetch("./telemetry/telemetry.html")).text();
  document.getElementById("toolbarSlot").innerHTML = await (await fetch("./filter-toolbar/filter-toolbar.html")).text();
  document.getElementById("addTaskSlot").innerHTML = await (await fetch("./crud/add-task/add-task.html")).text();
}

function filterTasks(tasks) {
  const { query, status } = getFilterState();
  return tasks.filter(t => {
    if (query && !t.title.toLowerCase().includes(query)) return false;
    if (status === "todo" && (t.isDone || (t.status || "").toLowerCase().includes("progress"))) return false;
    if (status === "in-progress" && (t.isDone || !(t.status || "").toLowerCase().includes("progress"))) return false;
    if (status === "done" && !t.isDone) return false;
    return true;
  });
}

function render() {
  const { status } = getFilterState();
  const filtered = filterTasks(allTasks);

  if (status === "master") {
    container.innerHTML = renderMasterView(filtered);
    attachAccordionSync(container);
  } else if (status === "inbox") {
    container.innerHTML = renderInboxView(filtered);
  } else {
    filtered.sort(multiLevelTaskComparator);
    container.innerHTML = filtered.map(t => renderTaskCard(t, true)).join("");
  }
}

container.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  const task = allTasks.find(t => t.id === id);

  if (action === "toggle" && task) {
    const next = task.isDone ? "Not Started" : "Done";
    updateTaskStatus(task, next, () => { updateTelemetry(allTasks); render(); });
  } else if (action === "status" && task) {
    updateTaskStatus(task, btn.dataset.target, () => { updateTelemetry(allTasks); render(); });
  } else if (action === "delete") {
    deleteTask(id, () => {
      allTasks = allTasks.filter(t => t.id !== id);
      updateTelemetry(allTasks);
      render();
    });
  }
});

async function refresh() {
  const refBtn = document.getElementById("refreshBtn");
  if (refBtn) refBtn.classList.add("spinning");
  allTasks = await fetchAllTasks();
  updateTelemetry(allTasks);
  render();
  if (refBtn) refBtn.classList.remove("spinning");
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadFragments();
  initFilterToolbar(() => render());
  initAddTask((newTask) => {
    allTasks.unshift(newTask);
    updateTelemetry(allTasks);
    render();
  });
  document.getElementById("refreshBtn").addEventListener("click", refresh);
  await resolvePareshUser();
  await refresh();
});