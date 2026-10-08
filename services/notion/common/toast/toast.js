export function showToast(text, isError = false) {
  const toast = document.getElementById("toast");
  const msg = document.getElementById("toast-msg");
  if (!toast || !msg) return;
  msg.textContent = text;
  toast.style.borderColor = isError ? "rgba(244, 63, 94, 0.4)" : "rgba(255, 255, 255, 0.15)";
  toast.classList.add("show");
  clearTimeout(window.__tId);
  window.__tId = setTimeout(() => toast.classList.remove("show"), 3200);
}