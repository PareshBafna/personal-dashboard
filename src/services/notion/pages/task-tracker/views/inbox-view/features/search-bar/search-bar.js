// File: services/notion/pages/task-tracker/views/inbox-view/features/search-bar/search-bar.js

let inboxQuery = "";
let onInboxSearchCallback = null;

export function initInboxSearchBar(onChange) {
  onInboxSearchCallback = onChange;

  const input = document.getElementById("inboxSearchInput");
  const clearBtn = document.getElementById("inboxSearchClearBtn");

  if (input) {
    input.value = inboxQuery;
    if (clearBtn) clearBtn.style.display = inboxQuery ? "block" : "none";

    input.addEventListener("input", (e) => {
      inboxQuery = e.target.value.trim().toLowerCase();
      if (clearBtn) clearBtn.style.display = inboxQuery ? "block" : "none";
      if (typeof onInboxSearchCallback === "function") onInboxSearchCallback(inboxQuery);
    });
  }

  if (clearBtn && input) {
    clearBtn.addEventListener("click", () => {
      input.value = "";
      inboxQuery = "";
      clearBtn.style.display = "none";
      input.focus();
      if (typeof onInboxSearchCallback === "function") onInboxSearchCallback("");
    });
  }
}

export function getInboxSearchQuery() {
  return inboxQuery;
}

export function resetInboxSearch() {
  inboxQuery = "";
  const input = document.getElementById("inboxSearchInput");
  const clearBtn = document.getElementById("inboxSearchClearBtn");
  if (input) input.value = "";
  if (clearBtn) clearBtn.style.display = "none";
}