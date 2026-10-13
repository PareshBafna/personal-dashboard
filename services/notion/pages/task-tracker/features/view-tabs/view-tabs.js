// File: services/notion/pages/task-tracker/features/view-tabs/view-tabs.js

let currentTab = "master";
let onTabChangeCallback = null;

export function initViewTabs(onChange) {
  onTabChangeCallback = onChange;

  const pills = document.querySelectorAll(".view-pill-btn");
  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      pills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentTab = pill.dataset.status || "master";
      if (typeof onTabChangeCallback === "function") onTabChangeCallback(currentTab);
    });
  });
}

export function getActiveTab() {
  return currentTab;
}