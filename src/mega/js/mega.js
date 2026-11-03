const grid = document.getElementById("accountsGrid");
const refreshBtn = document.getElementById("refreshBtn");
const searchInput = document.getElementById("searchInput");
const filterPills = document.querySelectorAll(".pill");

const totalCapacityEl = document.getElementById("totalCapacity");
const totalUsedEl = document.getElementById("totalUsed");
const totalFreeEl = document.getElementById("totalFree");
const totalPercentEl = document.getElementById("totalPercent");
const masterProgressBar = document.getElementById("masterProgressBar");

const modal = document.getElementById("detailModal");
const modalClose = document.getElementById("modalClose");
const modalName = document.getElementById("modalName");
const modalEmail = document.getElementById("modalEmail");
const modalLimit = document.getElementById("modalLimit");
const modalUsed = document.getElementById("modalUsed");
const modalFree = document.getElementById("modalFree");
const modalPercent = document.getElementById("modalPercent");
const modalFolderList = document.getElementById("modalFolderList");
const modalFolderCount = document.getElementById("modalFolderCount");
const modalCopyEmail = document.getElementById("modalCopyEmail");
const modalOpenDrive = document.getElementById("modalOpenDrive");

let cachedAccounts = [];
let currentFilter = "all";
let currentSearch = "";

function animateValue(element, start, end, duration, suffix = "") {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const value = (progress * (end - start) + start).toFixed(progress === 1 ? 2 : 1);
    element.textContent = `${value}${suffix}`;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

function formatMegaName(name) {
  return name.replace(/\bMega\b/gi, "MEGA");
}

function getAvatarInitials(name) {
  if (name.toLowerCase().includes("transfer")) return "TD";
  const numMatch = name.match(/#?(\d+)/);
  if (numMatch) return `#${numMatch[1]}`;
  return name.slice(0, 2).toUpperCase();
}

function formatByteSize(bytes, fallbackSizeGB) {
  if (bytes !== undefined && bytes !== null) {
    const b = Number(bytes);
    const gb = 1073741824;
    const mb = 1048576;
    if (b >= gb) {
      return `${(b / gb).toFixed(2)} GB`;
    }
    return `${(b / mb).toFixed(2)} MB`;
  }

  const numGB = parseFloat(fallbackSizeGB || 0);
  if (numGB >= 1) {
    return `${numGB.toFixed(2)} GB`;
  }
  return `${(numGB * 1024).toFixed(2)} MB`;
}

function getTier(percent) {
  if (percent === null || percent === undefined) return "low";
  const p = parseFloat(percent);
  if (p >= 80) return "high";
  if (p >= 50) return "mid";
  return "low";
}

async function loadInitialAccounts() {
  try {
    const res = await fetch("/api/mega/accounts");
    cachedAccounts = await res.json();
    applyFilters();
  } catch (err) {
    grid.innerHTML = `<div style="grid-column: 1/-1; color: var(--color-red); padding: 20px;">Failed to load accounts: ${err.message}</div>`;
  }
}

async function syncSingleAccount(id, buttonEl) {
  buttonEl.classList.add("spinning");

  try {
    const res = await fetch("/api/mega/sync-one", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    const updated = await res.json();

    const idx = cachedAccounts.findIndex((a) => a.id === id);
    if (idx !== -1) {
      cachedAccounts[idx] = updated;
      applyFilters();

      if (modal.classList.contains("open") && modalEmail.textContent === updated.email) {
        openModal(updated);
      }
    }
  } catch (err) {
    console.error("Sync error:", err);
  } finally {
    buttonEl.classList.remove("spinning");
  }
}

async function syncAllAccounts() {
  refreshBtn.classList.add("spinning");

  try {
    const res = await fetch("/api/mega/sync-all", { method: "POST" });
    cachedAccounts = await res.json();
    applyFilters();
  } catch (err) {
    console.error("Sync all error:", err);
  } finally {
    refreshBtn.classList.remove("spinning");
  }
}

function applyFilters() {
  let filtered = cachedAccounts.filter((acc) => {
    const matchSearch = acc.name.toLowerCase().includes(currentSearch) || acc.email.toLowerCase().includes(currentSearch);
    if (!matchSearch) return false;

    const percent = acc.percent !== null ? parseFloat(acc.percent) : null;
    const isPrimary = acc.name.toLowerCase().includes("transfer");

    if (currentFilter === "primary") return isPrimary;
    if (currentFilter === "warning") return percent !== null && percent >= 50 && percent < 80;
    if (currentFilter === "danger") return percent !== null && percent >= 80;
    return true;
  });

  renderGrid(filtered);
  updateMasterTelemetry(cachedAccounts);
}

function renderGrid(accounts) {
  grid.innerHTML = "";
  const CIRCUMFERENCE = 138.2;

  accounts.forEach((acc, index) => {
    const displayName = formatMegaName(acc.name);
    const isPrimary = acc.name.toLowerCase().includes("transfer");
    const isSynced = acc.synced === true && acc.limitGB !== null;

    const limitNum = isSynced ? parseFloat(acc.limitGB) : null;
    const usedNum = isSynced ? parseFloat(acc.usedGB) : null;
    const freeNum = isSynced ? Math.max(0, limitNum - usedNum).toFixed(2) : null;
    const percent = isSynced ? parseFloat(acc.percent || 0) : null;
    const tier = getTier(percent);
    const themeIdx = index % 8;

    const offset = isSynced
      ? CIRCUMFERENCE - (Math.min(percent, 100) / 100) * CIRCUMFERENCE
      : CIRCUMFERENCE;

    const card = document.createElement("div");
    card.className = `interactive-card theme-${themeIdx} ${isPrimary ? "is-primary" : ""}`;

    card.innerHTML = `
      <div class="card-spotlight"></div>

      <div class="card-header-row">
        <div class="account-info">
          <div class="account-avatar">${getAvatarInitials(acc.name)}</div>
          <div class="title-wrap">
            <div class="acc-title-line">
              <span class="acc-name">${displayName}</span>
              ${isPrimary ? '<span class="hub-tag">Primary</span>' : ""}
            </div>
            <span class="acc-email">${acc.email}</span>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          <button class="single-sync-btn action-btn secondary-btn" data-id="${acc.id}" title="Sync this account" style="padding: 6px 10px; border-radius: 8px;">
            <svg class="refresh-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3L21.5 8M22 12.5a10 10 0 0 1-18.8 4.2L2.5 16"/>
            </svg>
          </button>

          <div class="gauge-box">
            <svg class="gauge-svg" width="52" height="52">
              <circle class="gauge-bg" stroke-width="4.5" fill="transparent" r="22" cx="26" cy="26"/>
              <circle class="gauge-bar tier-${tier}" stroke-width="4.5" fill="transparent" r="22" cx="26" cy="26" style="stroke-dashoffset: ${offset};"/>
            </svg>
            <span class="gauge-text highlight-num">${isSynced ? Math.round(percent) + "%" : "--"}</span>
          </div>
        </div>
      </div>

      ${acc.error ? `<div style="font-size:0.75rem; color:var(--color-red); margin-top: -6px;">${acc.error}</div>` : ""}

      <div class="card-track">
        <div class="card-fill tier-${tier}" style="width: ${isSynced ? Math.min(percent, 100) : 0}%;"></div>
      </div>

      <div class="card-footer">
        <div class="footer-stat">
          <span class="stat-label">Limit</span>
          <span class="val alloc-num">${isSynced ? limitNum.toFixed(2) + " GB" : "--"}</span>
        </div>
        <div class="footer-stat">
          <span class="stat-label">Used</span>
          <span class="val accent-num">${isSynced ? usedNum.toFixed(2) + " GB" : "--"}</span>
        </div>
        <div class="footer-stat">
          <span class="stat-label">Free</span>
          <span class="val free-num">${isSynced ? freeNum + " GB" : "--"}</span>
        </div>
        <span class="tier-tag">${isSynced ? (acc.folders?.length || 0) + " Folders" : "Idle"}</span>
      </div>
    `;

    const syncBtn = card.querySelector(".single-sync-btn");
    syncBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      syncSingleAccount(acc.id, syncBtn);
    });

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    });

    card.addEventListener("click", () => openModal(acc));
    grid.appendChild(card);
  });
}

function updateMasterTelemetry(accounts) {
  let aggregatedLimit = 0;
  let aggregatedUsed = 0;
  let hasSynced = false;

  accounts.forEach((acc) => {
    if (acc.synced === true && acc.limitGB !== null) {
      hasSynced = true;
      aggregatedLimit += parseFloat(acc.limitGB);
      aggregatedUsed += parseFloat(acc.usedGB);
    }
  });

  if (hasSynced && aggregatedLimit > 0) {
    const aggregatedFree = Math.max(0, aggregatedLimit - aggregatedUsed);
    const finalPercent = (aggregatedUsed / aggregatedLimit) * 100;

    animateValue(totalCapacityEl, 0, aggregatedLimit, 600, " GB");
    animateValue(totalUsedEl, 0, aggregatedUsed, 600, " GB");
    animateValue(totalFreeEl, 0, aggregatedFree, 600, " GB");
    animateValue(totalPercentEl, 0, finalPercent, 600, "%");
    masterProgressBar.style.width = `${Math.min(finalPercent, 100)}%`;
  } else {
    totalCapacityEl.textContent = "--";
    totalUsedEl.textContent = "--";
    totalFreeEl.textContent = "--";
    totalPercentEl.textContent = "--";
    masterProgressBar.style.width = "0%";
  }
}

function renderFolderTree(folder, depth = 0) {
  const container = document.createElement("div");
  container.style.cssText = "display: flex; flex-direction: column; width: 100%;";

  const hasSub = folder.children && folder.children.length > 0;
  const paddingLeft = depth * 18;
  const displaySize = folder.formattedSize || formatByteSize(folder.bytes, folder.sizeGB);

  const row = document.createElement("div");
  row.style.cssText = `display: flex; align-items: center; justify-content: space-between; padding: 7px 10px 7px ${paddingLeft + 10}px; border-radius: 8px; background: rgba(255, 255, 255, ${depth === 0 ? "0.03" : "0.015"}); border: 1px solid var(--panel-border); font-size: 0.8rem; cursor: ${hasSub ? "pointer" : "default"}; margin-bottom: 3px;`;

  row.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; min-width: 0; padding-right: 10px;">
      ${hasSub ? '<i class="fa-solid fa-chevron-right toggle-icon" style="font-size: 0.65rem; color: var(--text-dim); transition: transform 0.2s;"></i>' : '<span style="width: 10px;"></span>'}
      <i class="fa-solid fa-folder" style="color: ${depth === 0 ? "#ef4444" : "#f97316"}; flex-shrink: 0; font-size: 0.85rem;"></i>
      <span style="color: var(--text-main); font-weight: ${depth === 0 ? "600" : "400"}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${folder.name}">
        ${folder.name}
      </span>
      ${hasSub ? `<span style="font-size: 0.68rem; color: var(--text-dim); font-family: 'JetBrains Mono', monospace;">(${folder.children.length})</span>` : ""}
    </div>
    <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.76rem; font-weight: 700; color: var(--telemetry-alloc); flex-shrink: 0;">
      ${displaySize}
    </span>
  `;

  container.appendChild(row);

  if (hasSub) {
    const subContainer = document.createElement("div");
    subContainer.style.cssText = "display: none; flex-direction: column; width: 100%;";

    folder.children.forEach((sub) => {
      subContainer.appendChild(renderFolderTree(sub, depth + 1));
    });

    container.appendChild(subContainer);

    row.addEventListener("click", () => {
      const isClosed = subContainer.style.display === "none";
      subContainer.style.display = isClosed ? "flex" : "none";
      const icon = row.querySelector(".toggle-icon");
      if (icon) {
        icon.style.transform = isClosed ? "rotate(90deg)" : "rotate(0deg)";
      }
    });
  }

  return container;
}

function openModal(acc) {
  const isSynced = acc.synced === true && acc.limitGB !== null;
  const limitNum = isSynced ? parseFloat(acc.limitGB) : null;
  const usedNum = isSynced ? parseFloat(acc.usedGB) : null;
  const freeGB = isSynced ? (limitNum - usedNum).toFixed(2) : null;

  const folders = (acc.folders || []).slice().sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
  );

  modalName.textContent = formatMegaName(acc.name);
  modalEmail.textContent = acc.email;
  modalLimit.textContent = isSynced ? `${limitNum.toFixed(2)} GB` : "--";
  modalUsed.textContent = isSynced ? `${usedNum.toFixed(2)} GB` : "--";
  modalFree.textContent = isSynced ? `${Math.max(0, freeGB)} GB` : "--";
  modalPercent.textContent = isSynced ? `${acc.percent}%` : "--";
  modalFolderCount.textContent = `${folders.length} folder${folders.length === 1 ? "" : "s"}`;

  modalFolderList.innerHTML = "";

  if (!isSynced) {
    modalFolderList.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--text-dim); font-size: 0.8rem;">
        Account not synced yet. Click the sync icon on the account card to fetch folders.
      </div>
    `;
  } else if (folders.length === 0) {
    modalFolderList.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--text-dim); font-size: 0.8rem;">
        No folders found in this MEGA root directory.
      </div>
    `;
  } else {
    folders.forEach((f) => {
      modalFolderList.appendChild(renderFolderTree(f, 0));
    });
  }

  modalCopyEmail.onclick = () => {
    navigator.clipboard.writeText(acc.email);
    modalCopyEmail.textContent = "Copied!";
    setTimeout(() => {
      modalCopyEmail.textContent = "Copy Email";
    }, 1500);
  };

  modalOpenDrive.href = "https://mega.nz";
  modal.classList.add("open");
}

modalClose.addEventListener("click", () => modal.classList.remove("open"));
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.remove("open");
});

searchInput.addEventListener("input", (e) => {
  currentSearch = e.target.value.toLowerCase();
  applyFilters();
});

filterPills.forEach((pill) => {
  pill.addEventListener("click", () => {
    filterPills.forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    currentFilter = pill.getAttribute("data-filter");
    applyFilters();
  });
});

refreshBtn.addEventListener("click", syncAllAccounts);

loadInitialAccounts();