let allDatabases = [];
let activeDatabase = null;
let searchQuery = "";
let propSearchQuery = "";

const container = document.getElementById("notion-container");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const refreshBtn = document.getElementById("refreshBtn");
const dbCountEl = document.getElementById("dbCount");

const modal = document.getElementById("schemaModal");
const modalClose = document.getElementById("modalClose");
const modalDbName = document.getElementById("modalDbName");
const modalDbId = document.getElementById("modalDbId");
const modalAvatar = document.getElementById("modalAvatar");
const modalPropCount = document.getElementById("modalPropCount");
const modalPropSearch = document.getElementById("modalPropSearch");
const propertiesList = document.getElementById("propertiesList");
const modalCopyId = document.getElementById("modalCopyId");
const modalOpenNotion = document.getElementById("modalOpenNotion");

function extractRawTitle(item) {
  if (Array.isArray(item.title) && item.title.length > 0) {
    const t = item.title.map(x => x.plain_text || x.text?.content || "").join("").trim();
    if (t) return t;
  }
  if (item.url) {
    try {
      const parts = new URL(item.url).pathname.split("/").pop().split("-");
      parts.pop();
      const name = parts.join(" ").trim();
      if (name) return decodeURIComponent(name);
    } catch (_) {}
  }
  return "Untitled Database";
}

function getAvatarInitials(name) {
  const parts = name.trim().split(/[\s-_]+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "DB";
}

function getPropIcon(type) {
  const map = {
    title: "fa-heading", rich_text: "fa-align-left", number: "fa-hashtag", select: "fa-circle-chevron-down",
    multi_select: "fa-tags", date: "fa-calendar", people: "fa-users", files: "fa-paperclip", checkbox: "fa-square-check",
    url: "fa-link", email: "fa-envelope", phone_number: "fa-phone", formula: "fa-calculator", relation: "fa-diagram-project",
    rollup: "fa-chart-pie", created_time: "fa-clock", status: "fa-list-check"
  };
  return map[type] || "fa-cube";
}

function showToast(text) {
  const toast = document.getElementById("toast");
  const msg = document.getElementById("toast-msg");
  if (!toast || !msg) return;
  msg.textContent = text;
  toast.classList.add("show");
  clearTimeout(window.__tId);
  window.__tId = setTimeout(() => toast.classList.remove("show"), 2200);
}

async function fetchDatabases() {
  if (!container) return;
  if (refreshBtn) refreshBtn.classList.add("spinning");

  try {
    const res = await fetch("/api/notion/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forceRefresh: true })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    allDatabases = (data.results || []).filter(item => item.object === "database");
    if (dbCountEl) dbCountEl.textContent = allDatabases.length;
    render();
  } catch (err) {
    container.innerHTML = `<div style="grid-column: 1 / -1; padding: 24px; color: var(--color-red); text-align: center;">Failed to fetch databases: ${err.message}</div>`;
  } finally {
    if (refreshBtn) refreshBtn.classList.remove("spinning");
  }
}

function render() {
  if (!container) return;
  const query = searchQuery.trim().toLowerCase();

  const filtered = allDatabases.filter(item => {
    if (!query) return true;
    return extractRawTitle(item).toLowerCase().includes(query);
  }).sort((a, b) => extractRawTitle(a).localeCompare(extractRawTitle(b)));

  if (!filtered.length) {
    container.innerHTML = `<div style="grid-column: 1 / -1; padding: 48px; text-align: center; color: var(--text-dim);">No databases found</div>`;
    return;
  }

  container.innerHTML = filtered.map((item, idx) => {
    const rawTitle = extractRawTitle(item);
    const initials = getAvatarInitials(rawTitle);
    const props = item.properties || {};

    return `
      <div class="account-card theme-${idx % 8}" data-db-id="${item.id}">
        <div class="account-header">
          <div class="account-info">
            <div class="account-avatar">${initials}</div>
            <div class="title-wrap">
              <span class="acc-name">${rawTitle}</span>
              <span class="acc-email">${item.id}</span>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <span class="footer-left-stat">${Object.keys(props).length} Properties</span>
          <span class="tier-tag">Inspect Schema ↗</span>
        </div>
      </div>
    `;
  }).join("");

  container.querySelectorAll(".account-card").forEach(card => {
    card.addEventListener("click", () => {
      const db = allDatabases.find(d => d.id === card.dataset.dbId);
      if (db) openSchemaModal(db);
    });
  });
}

function openSchemaModal(db) {
  activeDatabase = db;
  propSearchQuery = "";
  if (modalPropSearch) modalPropSearch.value = "";

  const rawTitle = extractRawTitle(db);
  const props = db.properties || {};

  modalDbName.textContent = rawTitle;
  modalDbId.textContent = `ID: ${db.id}`;
  modalAvatar.textContent = getAvatarInitials(rawTitle);
  modalPropCount.textContent = Object.keys(props).length;
  modalOpenNotion.href = db.url || `https://notion.so/${db.id.replace(/-/g, "")}`;

  renderPropertiesList();
  modal.classList.add("show");
}

function renderPropertiesList() {
  if (!activeDatabase || !propertiesList) return;
  const props = activeDatabase.properties || {};
  const query = propSearchQuery.trim().toLowerCase();

  const entries = Object.entries(props).filter(([name, data]) => {
    if (!query) return true;
    return name.toLowerCase().includes(query) || (data.type || "").toLowerCase().includes(query);
  });

  if (!entries.length) {
    propertiesList.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-dim);">No properties matching "${propSearchQuery}"</div>`;
    return;
  }

  propertiesList.innerHTML = entries.map(([name, data]) => `
    <div class="property-row">
      <div class="prop-left">
        <div class="prop-type-icon"><i class="fa-solid ${getPropIcon(data.type)}"></i></div>
        <div>
          <div class="prop-name">${name}</div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: var(--text-dim);">id: ${data.id}</div>
        </div>
      </div>
      <div class="prop-right"><span class="prop-type-tag">${data.type}</span></div>
    </div>
  `).join("");
}

if (modalClose) modalClose.addEventListener("click", () => modal.classList.remove("show"));
modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("show"); });

if (modalPropSearch) modalPropSearch.addEventListener("input", (e) => { propSearchQuery = e.target.value; renderPropertiesList(); });
if (modalCopyId) modalCopyId.addEventListener("click", () => {
  if (activeDatabase) { navigator.clipboard.writeText(activeDatabase.id); showToast("Database ID copied!"); }
});

if (searchInput) searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  if (clearSearchBtn) clearSearchBtn.classList.toggle("hidden", !searchQuery.trim());
  render();
});
if (clearSearchBtn) clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  searchQuery = "";
  clearSearchBtn.classList.add("hidden");
  render();
});
if (refreshBtn) refreshBtn.addEventListener("click", fetchDatabases);

document.addEventListener("DOMContentLoaded", fetchDatabases);