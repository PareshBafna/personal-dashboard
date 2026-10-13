// File: services/notion/views/today-view/features/search-bar/search-bar.js

const SEARCH_BAR_HTML = `
<div class="today-search-container">
  <div class="search-input-wrap">
    <i class="fa-solid fa-magnifying-glass search-icon"></i>
    <input type="text" id="todaySearchInput" class="today-search-input" placeholder="Search today's agenda..." autocomplete="off" />
    <button type="button" id="todaySearchClearBtn" class="search-clear-btn" style="display: none;">
      <i class="fa-solid fa-xmark"></i>
    </button>
  </div>
</div>
`;

let searchCallback = null;
let currentQuery = "";

export function initSearchBar(containerEl, onSearch) {
  if (!containerEl) return;
  searchCallback = onSearch;
  containerEl.innerHTML = SEARCH_BAR_HTML;

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