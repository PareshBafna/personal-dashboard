// File: services/notion/views/today-view/features/sync-data/sync-data.js

export function initSyncButton(btnEl, onSyncTrigger) {
  if (!btnEl) return;

  btnEl.addEventListener("click", async () => {
    if (btnEl.disabled) return;
    setSyncButtonState(btnEl, true);
    try {
      if (typeof onSyncTrigger === "function") {
        await onSyncTrigger();
      }
    } finally {
      setSyncButtonState(btnEl, false);
    }
  });
}

export function setSyncButtonState(btnEl, isSyncing) {
  if (!btnEl) return;
  btnEl.disabled = isSyncing;
  if (isSyncing) {
    btnEl.classList.add("spinning");
  } else {
    btnEl.classList.remove("spinning");
  }
}