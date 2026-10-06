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
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "DB";
}

function getPropIcon(type) {
  const map = {
    title: "fa-heading",
    rich_text: "fa-align-left",
    number: "fa-hashtag",
    select: "fa-circle-chevron-down",
    multi_select: "fa-tags",
    date: "fa-calendar",
    people: "fa-users",
    files: "fa-paperclip",
    checkbox: "fa-square-check",
    url: "fa-link",
    email: "fa-envelope",
    phone_number: "fa-phone",
    formula: "fa-calculator",
    relation: "fa-diagram-project",
    rollup: "fa-chart-pie",
    created_time: "fa-clock",
    created_by: "fa-user-pen",
    last_edited_time: "fa-stopwatch",
    last_edited_by: "fa-user-gear",
    status: "fa-list-check"
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

// Live fetch every time (No local storage)
async function fetchDatabases() {
  if (!container) return;
  if (refreshBtn) refreshBtn.classList.add("spinning");

  try {
    const res = await fetch("/api/notion/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forceRefresh: true })
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    allDatabases = (data.results || []).filter(item => item.object === "database");

    if (dbCountEl) dbCountEl.textContent = allDatabases.length;
    render();
  } catch (err) {
    console.error("Fetch error:", err);
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 24px; color: var(--color-red); border: 1px dashed rgba(244,63,94,0.4); border-radius: 18px; text-align: center;">
        Failed to fetch Notion databases: ${err.message}
      </div>
    `;
  } finally {
    if (refreshBtn) refreshBtn.classList.remove("spinning");
  }
}

function render() {
  if (!container) return;

  const query = searchQuery.trim().toLowerCase();

  const sortedDatabases = allDatabases.slice().sort((a, b) => {
    const nameA = extractRawTitle(a);
    const nameB = extractRawTitle(b);
    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" });
  });

  const filtered = sortedDatabases.filter(item => {
    if (!query) return true;
    return extractRawTitle(item).toLowerCase().includes(query);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 48px 16px; color: var(--text-dim); border: 1px dashed var(--panel-border); border-radius: 20px;">
        <i class="fa-solid fa-database" style="font-size: 2rem; color: #60a5fa;"></i>
        <span style="font-size: 0.95rem; font-weight: 600; color: #fff;">No databases found</span>
        <span style="font-size: 0.8rem;">Ensure integration is invited to the database in Notion</span>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((item, idx) => {
    const rawTitle = extractRawTitle(item);
    const initials = getAvatarInitials(rawTitle);
    const themeClass = `theme-${idx % 8}`;
    const props = item.properties || {};
    const propCount = Object.keys(props).length;

    return `
      <div class="account-card ${themeClass}" data-db-id="${item.id}">
        <div class="account-header">
          <div class="account-info">
            <div class="account-avatar">
              ${initials}
            </div>
            <div class="title-wrap">
              <div class="acc-title-line">
                <span class="acc-name">${rawTitle}</span>
              </div>
              <span class="acc-email">${item.id}</span>
            </div>
          </div>
        </div>

        <div class="card-footer">
          <span class="footer-left-stat">${propCount} Properties</span>
          <span class="tier-tag">Inspect Schema ↗</span>
        </div>
      </div>
    `;
  }).join("");

  container.querySelectorAll(".account-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.dataset.dbId;
      const db = allDatabases.find(d => d.id === id);
      if (db) openSchemaModal(db);
    });
  });
}

function openSchemaModal(db) {
  activeDatabase = db;
  propSearchQuery = "";
  if (modalPropSearch) modalPropSearch.value = "";

  const rawTitle = extractRawTitle(db);
  const initials = getAvatarInitials(rawTitle);
  const props = db.properties || {};
  const propKeys = Object.keys(props);

  modalDbName.textContent = rawTitle;
  modalDbId.textContent = `ID: ${db.id}`;
  modalAvatar.textContent = initials;
  modalPropCount.textContent = propKeys.length;
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

  if (entries.length === 0) {
    propertiesList.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--text-dim); font-size: 0.85rem;">
        No properties matching "${propSearchQuery}"
      </div>
    `;
    return;
  }

  propertiesList.innerHTML = entries.map(([name, data]) => {
    const iconClass = getPropIcon(data.type);
    return `
      <div class="property-row">
        <div class="prop-left">
          <div class="prop-type-icon">
            <i class="fa-solid ${iconClass}"></i>
          </div>
          <div>
            <div class="prop-name">${name}</div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: var(--text-dim);">
              id: ${data.id}
            </div>
          </div>
        </div>
        <div class="prop-right">
          <span class="prop-type-tag">${data.type}</span>
        </div>
      </div>
    `;
  }).join("");
}

if (modalClose) modalClose.addEventListener("click", () => modal.classList.remove("show"));
modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("show"); });

if (modalPropSearch) {
  modalPropSearch.addEventListener("input", (e) => {
    propSearchQuery = e.target.value;
    renderPropertiesList();
  });
}

if (modalCopyId) {
  modalCopyId.addEventListener("click", () => {
    if (!activeDatabase) return;
    navigator.clipboard.writeText(activeDatabase.id);
    showToast("Database ID copied to clipboard!");
  });
}

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    if (clearSearchBtn) clearSearchBtn.classList.toggle("hidden", searchQuery.trim().length === 0);
    render();
  });
}

if (clearSearchBtn) {
  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchQuery = "";
    clearSearchBtn.classList.add("hidden");
    render();
  });
}

if (refreshBtn) {
  refreshBtn.addEventListener("click", () => fetchDatabases());
}

document.addEventListener("DOMContentLoaded", () => {
  fetchDatabases();
});