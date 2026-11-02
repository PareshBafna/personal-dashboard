// File: services/notion/views/upcoming-view/features/sync-data/sync-data.js

export function initSyncButton(btnEl, onSyncClick) {
  if (!btnEl) return;
  btnEl.addEventListener("click", () => {
    if (typeof onSyncClick === "function") {
      onSyncClick();
    }
  });
}

export function setSyncButtonState(btnEl, isSyncing) {
  if (!btnEl) return;
  const icon = btnEl.querySelector("i");
  if (isSyncing) {
    btnEl.classList.add("disabled");
    btnEl.disabled = true;
    if (icon) icon.classList.add("spin");
  } else {
    btnEl.classList.remove("disabled");
    btnEl.disabled = false;
    if (icon) icon.classList.remove("spin");
  }
}