// File: services/notion/pages/task-tracker/features/filter-toolbar/filter-toolbar.js

let onFilterChangeCallback = null;
let currentStatus = "master";
let currentQuery = "";

export function initFilterToolbar(onChange) {
  onFilterChangeCallback = onChange;

  const input = document.getElementById("taskSearchInput");
  const clearBtn = document.getElementById("taskSearchClearBtn");
  const pills = document.querySelectorAll(".view-pill-btn");

  if (input) {
    input.addEventListener("input", (e) => {
      currentQuery = e.target.value.trim().toLowerCase();
      if (clearBtn) clearBtn.style.display = currentQuery ? "block" : "none";
      if (typeof onFilterChangeCallback === "function") onFilterChangeCallback();
    });
  }

  if (clearBtn && input) {
    clearBtn.addEventListener("click", () => {
      input.value = "";
      currentQuery = "";
      clearBtn.style.display = "none";
      input.focus();
      if (typeof onFilterChangeCallback === "function") onFilterChangeCallback();
    });
  }

  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      pills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentStatus = pill.dataset.status || "master";
      if (typeof onFilterChangeCallback === "function") onFilterChangeCallback();
    });
  });
}

export function getFilterState() {
  return {
    status: currentStatus,
    query: currentQuery
  };
}