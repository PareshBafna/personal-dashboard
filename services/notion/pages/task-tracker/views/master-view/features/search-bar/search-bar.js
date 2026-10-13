// File: services/notion/pages/task-tracker/views/master-view/features/search-bar/search-bar.js

let masterQuery = "";
let onMasterSearchCallback = null;

export function initMasterSearchBar(onChange) {
  onMasterSearchCallback = onChange;

  const input = document.getElementById("masterSearchInput");
  const clearBtn = document.getElementById("masterSearchClearBtn");

  if (input) {
    input.value = masterQuery;
    if (clearBtn) clearBtn.style.display = masterQuery ? "block" : "none";

    input.addEventListener("input", (e) => {
      masterQuery = e.target.value.trim().toLowerCase();
      if (clearBtn) clearBtn.style.display = masterQuery ? "block" : "none";
      if (typeof onMasterSearchCallback === "function") onMasterSearchCallback(masterQuery);
    });
  }

  if (clearBtn && input) {
    clearBtn.addEventListener("click", () => {
      input.value = "";
      masterQuery = "";
      clearBtn.style.display = "none";
      input.focus();
      if (typeof onMasterSearchCallback === "function") onMasterSearchCallback("");
    });
  }
}

export function getMasterSearchQuery() {
  return masterQuery;
}

export function resetMasterSearch() {
  masterQuery = "";
  const input = document.getElementById("masterSearchInput");
  const clearBtn = document.getElementById("masterSearchClearBtn");
  if (input) input.value = "";
  if (clearBtn) clearBtn.style.display = "none";
}