// File: services/notion/views/today-view/features/search-bar/search-bar.js

let searchCallback = null;
let currentQuery = "";

export async function initSearchBar(containerEl, onSearch) {
  if (!containerEl) return;
  searchCallback = onSearch;

  const res = await fetch("./views/today-view/features/search-bar/search-bar.html");
  containerEl.innerHTML = await res.text();

  const input = document.getElementById("todaySearchInput");
  const clearBtn = document.getElementById("todaySearchClearBtn");
  if (!input) return;

  input.addEventListener("input", (e) => {
    currentQuery = e.target.value.trim().toLowerCase();
    if (clearBtn) clearBtn.style.display = currentQuery ? "block" : "none";
    if (typeof searchCallback === "function") searchCallback(currentQuery);
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      input.value = "";
      currentQuery = "";
      clearBtn.style.display = "none";
      input.focus();
      if (typeof searchCallback === "function") searchCallback("");
    });
  }
}

export function getSearchQuery() {
  return currentQuery;
}