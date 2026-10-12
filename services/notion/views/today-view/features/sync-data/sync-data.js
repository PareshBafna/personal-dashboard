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
  const icon = btnEl.querySelector("i");
  const text = btnEl.querySelector("span");

  if (icon) {
    if (isSyncing) icon.classList.add("spin");
    else icon.classList.remove("spin");
  }
  if (text) {
    text.textContent = isSyncing ? "Syncing..." : "Sync";
  }
}