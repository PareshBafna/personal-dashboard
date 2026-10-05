const grid = document.getElementById("accountsGrid");
const refreshBtn = document.getElementById("refreshBtn");
const searchInput = document.getElementById("searchInput");
const filterPills = document.querySelectorAll(".pill");

const totalCapacityEl = document.getElementById("totalCapacity");
const totalUsedEl = document.getElementById("totalUsed");
const totalFreeEl = document.getElementById("totalFree");
const totalPercentEl = document.getElementById("totalPercent");
const masterProgressBar = document.getElementById("masterProgressBar");

// Modal elements
const modal = document.getElementById("detailModal");
const modalClose = document.getElementById("modalClose");
const modalName = document.getElementById("modalName");
const modalEmail = document.getElementById("modalEmail");
const modalLimit = document.getElementById("modalLimit");
const modalUsed = document.getElementById("modalUsed");
const modalFree = document.getElementById("modalFree");
const modalPercent = document.getElementById("modalPercent");
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

function getAvatarInitials(name) {
  if (name.includes("Transfer")) return "TD";
  const numMatch = name.match(/#?(\d+)/);
  if (numMatch) return `#${numMatch[1]}`;
  return name.slice(0, 2).toUpperCase();
}

function getTier(percent) {
  const p = parseFloat(percent);
  if (p >= 80) return "high";
  if (p >= 50) return "mid";
  return "low";
}

async function fetchStorageData() {
  refreshBtn.classList.add("spinning");

  try {
    const res = await fetch("/api/google/storage");
    const accounts = await res.json();
    cachedAccounts = accounts;
    applyFilters();
  } catch (err) {
    grid.innerHTML = `<div style="grid-column: 1/-1; color: var(--color-red); padding: 20px;">Failed to load accounts: ${err.message}</div>`;
  } finally {
    refreshBtn.classList.remove("spinning");
  }
}

function applyFilters() {
  let filtered = cachedAccounts.filter(acc => {
    const matchSearch = acc.name.toLowerCase().includes(currentSearch) || acc.email.toLowerCase().includes(currentSearch);
    if (!matchSearch) return false;

    const percent = parseFloat(acc.percent || 0);
    const isPrimary = (parseFloat(acc.limitGB) > 1000) || acc.name.toLowerCase().includes("transfer");

    if (currentFilter === "primary") return isPrimary;
    if (currentFilter === "warning") return percent >= 50 && percent < 80;
    if (currentFilter === "danger") return percent >= 80;
    return true;
  });

  renderGrid(filtered);
  updateMasterTelemetry(cachedAccounts);
}

function renderGrid(accounts) {
  grid.innerHTML = "";
  const CIRCUMFERENCE = 138.2;

  accounts.forEach((acc, index) => {
    if (acc.error) {
      grid.innerHTML += `
        <div class="interactive-card" style="border-color: rgba(244,63,94,0.3);">
          <div class="card-header-row">
            <div class="account-info">
              <div class="account-avatar" style="border-color: var(--color-red); color: var(--color-red);">!</div>
              <div class="title-wrap">
                <span class="acc-name">${acc.name}</span>
                <span class="acc-email">${acc.email}</span>
              </div>
            </div>
          </div>
          <div style="font-size:0.8rem; color:#ff7b72;">${acc.error}</div>
        </div>
      `;
      return;
    }

    const limitNum = acc.limitGB === "Unlimited" ? 0 : parseFloat(acc.limitGB);
    const usedNum = parseFloat(acc.usedGB);
    const freeNum = Math.max(0, limitNum - usedNum).toFixed(2);
    const percent = parseFloat(acc.percent);
    const tier = getTier(percent);
    const isPrimary = limitNum > 1000 || acc.name.toLowerCase().includes("transfer");
    const themeIdx = index % 8;
    const offset = CIRCUMFERENCE - (Math.min(percent, 100) / 100) * CIRCUMFERENCE;

    const card = document.createElement("div");
    card.className = `interactive-card theme-${themeIdx} ${isPrimary ? 'is-primary' : ''}`;
    card.innerHTML = `
      <div class="card-spotlight"></div>

      <div class="card-header-row">
        <div class="account-info">
          <div class="account-avatar">${getAvatarInitials(acc.name)}</div>
          <div class="title-wrap">
            <div class="acc-title-line">
              <span class="acc-name">${acc.name}</span>
              ${isPrimary ? '<span class="hub-tag">Primary</span>' : ''}
            </div>
            <span class="acc-email">${acc.email}</span>
          </div>
        </div>

        <div class="gauge-box">
          <svg class="gauge-svg" width="52" height="52">
            <circle class="gauge-bg" stroke-width="4.5" fill="transparent" r="22" cx="26" cy="26"/>
            <circle class="gauge-bar tier-${tier}" stroke-width="4.5" fill="transparent" r="22" cx="26" cy="26" style="stroke-dashoffset: ${offset};"/>
          </svg>
          <span class="gauge-text highlight-num">${Math.round(percent)}%</span>
        </div>
      </div>

      <div class="card-track">
        <div class="card-fill tier-${tier}" style="width: ${Math.min(percent, 100)}%;"></div>
      </div>

      <div class="card-footer">
        <div class="footer-stat">
          <span class="stat-label">Limit</span>
          <span class="val alloc-num">${acc.limitGB} GB</span>
        </div>
        <div class="footer-stat">
          <span class="stat-label">Used</span>
          <span class="val accent-num">${acc.usedGB} GB</span>
        </div>
        <div class="footer-stat">
          <span class="stat-label">Free</span>
          <span class="val free-num">${freeNum} GB</span>
        </div>
        <span class="tier-tag">${limitNum > 1000 ? (limitNum / 1024).toFixed(0) + ' TB Tier' : limitNum + ' GB Tier'}</span>
      </div>
    `;

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

  accounts.forEach((acc) => {
    if (!acc.error) {
      aggregatedLimit += acc.limitGB === "Unlimited" ? 0 : parseFloat(acc.limitGB);
      aggregatedUsed += parseFloat(acc.usedGB);
    }
  });

  if (aggregatedLimit > 0) {
    const aggregatedFree = Math.max(0, aggregatedLimit - aggregatedUsed);
    const finalPercent = ((aggregatedUsed / aggregatedLimit) * 100);

    animateValue(totalCapacityEl, 0, aggregatedLimit, 600, " GB");
    animateValue(totalUsedEl, 0, aggregatedUsed, 600, " GB");
    animateValue(totalFreeEl, 0, aggregatedFree, 600, " GB");
    animateValue(totalPercentEl, 0, finalPercent, 600, "%");
    masterProgressBar.style.width = `${Math.min(finalPercent, 100)}%`;
  }
}

function openModal(acc) {
  const limitNum = acc.limitGB === "Unlimited" ? 0 : parseFloat(acc.limitGB);
  const usedNum = parseFloat(acc.usedGB);
  const freeGB = (limitNum - usedNum).toFixed(2);

  modalName.textContent = acc.name;
  modalEmail.textContent = acc.email;
  modalLimit.textContent = `${acc.limitGB} GB`;
  modalUsed.textContent = `${acc.usedGB} GB`;
  modalFree.textContent = `${Math.max(0, freeGB)} GB`;
  modalPercent.textContent = `${acc.percent}%`;

  modalCopyEmail.onclick = () => {
    navigator.clipboard.writeText(acc.email);
    modalCopyEmail.textContent = "Copied!";
    setTimeout(() => { modalCopyEmail.textContent = "Copy Email"; }, 1500);
  };

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

filterPills.forEach(pill => {
  pill.addEventListener("click", () => {
    filterPills.forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    currentFilter = pill.getAttribute("data-filter");
    applyFilters();
  });
});

refreshBtn.addEventListener("click", fetchStorageData);
fetchStorageData();