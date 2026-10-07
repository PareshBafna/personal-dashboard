export function initFilterToolbar(onFilterChange) {
  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");

  searchInput.addEventListener("input", (e) => {
    clearSearchBtn.classList.toggle("hidden", !e.target.value.trim());
    onFilterChange();
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearSearchBtn.classList.add("hidden");
    onFilterChange();
  });

  document.querySelectorAll("#statusFilterPills .pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll("#statusFilterPills .pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      onFilterChange();
    });
  });
}

export function getFilterState() {
  return {
    query: (document.getElementById("searchInput")?.value || "").trim().toLowerCase(),
    status: document.querySelector("#statusFilterPills .pill.active")?.dataset.status || "master"
  };
}