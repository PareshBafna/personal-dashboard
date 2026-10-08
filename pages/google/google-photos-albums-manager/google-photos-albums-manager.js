const INITIAL_FOLDERS = [
  "Anniversary",
  "Baby Shower",
  "Birthday",
  "Collage",
  "College",
  "Cousins - Dad",
  "Cousins - Mom",
  "Dad",
  "Dad - Mom",
  "Darshana",
  "Diti",
  "Diwali",
  "Diya Niku Pari",
  "Family",
  "Family - Extended",
  "Family - Sasural",
  "Friends",
  "Functions",
  "Important",
  "Lachi",
  "Lachi - Karan",
  "Marriage - Kethan",
  "Marriage - Lachi",
  "Marriage - Lachi - Clickbox Photography - DSLR - Videos - Short Film",
  "Marriage - Lachi - Clickbox Photography - Kwikpic - Photos - February 19, 2026 - Paath Bithai",
  "Marriage - Lachi - Clickbox Photography - Kwikpic - Photos - February 19, 2026 - Reception",
  "Marriage - Lachi - Clickbox Photography - Kwikpic - Photos - February 20, 2026 - Carnival & Haldi",
  "Marriage - Lachi - Clickbox Photography - Kwikpic - Photos - February 20, 2026 - DJ Night",
  "Marriage - Lachi - Clickbox Photography - Kwikpic - Photos - February 20, 2026 - Ghar Vidaai",
  "Marriage - Lachi - Clickbox Photography - Kwikpic - Photos - February 21, 2026 - Baraat",
  "Marriage - Lachi - Clickbox Photography - Kwikpic - Photos - February 21, 2026 - Milni",
  "Marriage - Lachi - Clickbox Photography - Kwikpic - Photos - February 21, 2026 - Phera",
  "Marriage - Lachi - Clickbox Photography - Kwikpic - Photos - February 21, 2026 - Reception",
  "Marriage - Lachi - Clickbox Photography - Kwikpic - Photos - February 21, 2026 - Varmala",
  "Marriage - Lachi - Clickbox Photography - Kwikpic - Photos - February 21, 2026 - Vidaai",
  "Marriage - Lachi - Clickbox Photography - Kwikpic - Photos - January 26, 2026 - Moong",
  "Marriage - Lachi - Clickbox Photography - Kwikpic - Photos - Pre-Wedding Photoshoot",
  "Marriage - Lachi - Sneha Digital Media - DSLR - Videos - November 2, 2025 - Kwara Neta, Gud Gola & Gehna",
  "Marriage - Lachi - Sneha Digital Media - Kwikpic - Photos - November 2, 2025 - Kwara Neta, Gud Gola & Gehna",
  "Marriage - Lachi - Yaadon Ka Backup - Videos - Reels & Stories",
  "Marriage - Manisha",
  "Marriage - Nisha",
  "Marriage - Others",
  "Marriage - Paresh",
  "Marriage - Paresh - Clickbox Photography - DSLR - Videos - Trailer",
  "Marriage - Paresh - Clickbox Photography - Kwikpic - Photos - April 9, 2025 - Moong",
  "Marriage - Paresh - Clickbox Photography - Kwikpic - Photos - May 1, 2025 - Bhakti",
  "Marriage - Paresh - Clickbox Photography - Kwikpic - Photos - May 1, 2025 - Paath Bithai",
  "Marriage - Paresh - Clickbox Photography - Kwikpic - Photos - May 2, 2025 - Mehendi",
  "Marriage - Paresh - Clickbox Photography - Kwikpic - Photos - May 2, 2025 - Tamil Night",
  "Marriage - Paresh - Clickbox Photography - Kwikpic - Photos - May 3, 2025 - Reception",
  "Marriage - Paresh - Clickbox Photography - Kwikpic - Photos - May 3, 2025 - Sangeeth",
  "Marriage - Paresh - Clickbox Photography - Kwikpic - Photos - May 4, 2025 - Carnival & Haldi",
  "Marriage - Paresh - Clickbox Photography - Kwikpic - Photos - May 5, 2025 - Baraat",
  "Marriage - Paresh - Clickbox Photography - Kwikpic - Photos - May 5, 2025 - Maya Thapan",
  "Marriage - Paresh - Clickbox Photography - Kwikpic - Photos - May 5, 2025 - Milni",
  "Marriage - Paresh - Clickbox Photography - Kwikpic - Photos - May 5, 2025 - Phera",
  "Marriage - Paresh - Clickbox Photography - Kwikpic - Photos - May 5, 2025 - Reception",
  "Marriage - Paresh - Clickbox Photography - Kwikpic - Photos - May 5, 2025 - Varmala",
  "Marriage - Paresh - Clickbox Photography - Kwikpic - Photos - May 6, 2025 - Vidaai",
  "Marriage - Paresh - Nazariya - Videos - Reels & Stories",
  "Marriage - Paresh - Rathi Studio - DSLR - Videos - Reels",
  "Marriage - Paresh - Rathi Studio - DSLR - Videos - Short Film",
  "Marriage - Paresh - Rathi Studio - Kwikpic - Photos - Edited Photos",
  "Marriage - Paresh - Rathi Studio - Kwikpic - Photos - May 1, 2025 - Paath Bithai",
  "Marriage - Paresh - Rathi Studio - Kwikpic - Photos - May 1, 2025 - Tamil Night",
  "Marriage - Paresh - Rathi Studio - Kwikpic - Photos - May 2, 2025 - Pooja",
  "Marriage - Paresh - Rathi Studio - Kwikpic - Photos - May 3, 2025 - Reception",
  "Marriage - Paresh - Rathi Studio - Kwikpic - Photos - May 3, 2025 - Sangeeth",
  "Marriage - Paresh - Rathi Studio - Kwikpic - Photos - May 4, 2025 - Maya Thapan",
  "Marriage - Paresh - Rathi Studio - Kwikpic - Photos - May 4, 2025 - Nekasi",
  "Marriage - Paresh - Rathi Studio - Kwikpic - Photos - May 5, 2025 - Baraat",
  "Marriage - Paresh - Rathi Studio - Kwikpic - Photos - May 5, 2025 - Milni",
  "Marriage - Paresh - Rathi Studio - Kwikpic - Photos - May 5, 2025 - Phera",
  "Marriage - Paresh - Rathi Studio - Kwikpic - Photos - May 5, 2025 - Reception",
  "Marriage - Paresh - Rathi Studio - Kwikpic - Photos - May 5, 2025 - Varmala",
  "Marriage - Paresh - Rathi Studio - Kwikpic - Photos - May 6, 2025 - Graha Pravesh",
  "Marriage - Sonal",
  "Marriage - Sonal - Jisha Colour Lab - DSLR - Videos - Short Film",
  "Marriage - Sonal - Jisha Colour Lab - Kwikpic - Photos - April 27, 2022 - Engagement",
  "Marriage - Sonal - Jisha Colour Lab - Kwikpic - Photos - June 4, 2022 - Paath Bithai",
  "Marriage - Sonal - Jisha Colour Lab - Kwikpic - Photos - June 5, 2022 - Mayra",
  "Marriage - Sonal - Jisha Colour Lab - Kwikpic - Photos - June 5, 2022 - Mehendi",
  "Marriage - Sonal - Jisha Colour Lab - Kwikpic - Photos - June 7, 2022 - Paath Bithai",
  "Marriage - Sonal - Jisha Colour Lab - Kwikpic - Photos - June 7, 2022 - Reception",
  "Marriage - Sonal - Jisha Colour Lab - Kwikpic - Photos - June 7, 2022 - Sangeeth",
  "Marriage - Sonal - Jisha Colour Lab - Kwikpic - Photos - June 8, 2022 - Baraat",
  "Marriage - Sonal - Jisha Colour Lab - Kwikpic - Photos - June 8, 2022 - Maya Thapan",
  "Marriage - Sonal - Jisha Colour Lab - Kwikpic - Photos - June 8, 2022 - Milni",
  "Marriage - Sonal - Jisha Colour Lab - Kwikpic - Photos - June 8, 2022 - Phera",
  "Marriage - Sonal - Jisha Colour Lab - Kwikpic - Photos - June 8, 2022 - Varmala",
  "Marriage - Sonal - Jisha Colour Lab - Kwikpic - Photos - June 8, 2022 - Vidaai",
  "Marriage - Sonal - Jisha Colour Lab - Kwikpic - Photos - Pre-Wedding Photoshoot",
  "Miraya",
  "Mom",
  "Others",
  "Outing",
  "Paresh",
  "Paresh - Darshana",
  "Rakhi",
  "School - St.Mary's",
  "School - St.Thomas",
  "Sonal",
  "Sonal - Khuswanth",
  "Srishti",
  "Tanishq",
  "Trip - USA",
  "Work - NJS"
];

const ACCOUNT_PROFILES = [
  { id: "acc_unassigned", name: "Unassigned", email: "unassigned@local", tag: "Inbox", theme: "theme-default" },
  { id: "acc_transfer", name: "Google - Transfer Data", email: "pareshbafna26@gmail.com", tag: "Transfer", theme: "theme-0" },
  { id: "acc_01", name: "Google - Account #01", email: "pareshbafna3@gmail.com", tag: "#01", theme: "theme-1" },
  { id: "acc_02", name: "Google - Account #02", email: "pareshbafna4@gmail.com", tag: "#02", theme: "theme-2" },
  { id: "acc_03", name: "Google - Account #03", email: "pareshbafna5@gmail.com", tag: "#03", theme: "theme-3" },
  { id: "acc_04", name: "Google - Account #04", email: "pareshbafna6@gmail.com", tag: "#04", theme: "theme-4" },
  { id: "acc_05", name: "Google - Account #05", email: "pareshbafna11@gmail.com", tag: "#05", theme: "theme-5" },
  { id: "acc_06", name: "Google - Account #06", email: "pareshbafna12@gmail.com", tag: "#06", theme: "theme-6" },
  { id: "acc_07", name: "Google - Account #07", email: "pareshbafna14@gmail.com", tag: "#07", theme: "theme-7" },
  { id: "acc_08", name: "Google - Account #08", email: "pareshbafna15@gmail.com", tag: "#08", theme: "theme-0" },
  { id: "acc_09", name: "Google - Account #09", email: "pareshbafna16@gmail.com", tag: "#09", theme: "theme-1" },
  { id: "acc_10", name: "Google - Account #10", email: "pareshbafna18@gmail.com", tag: "#10", theme: "theme-2" }
];

const STORAGE_KEY = "gdrive_assigned_folders_only";

let state = {
  accounts: {},
  collapsed: {},
  selected: new Set(),
  searchQuery: ""
};

let lastClickedFolder = null;
let lastClickedAccountId = null;
let dragSourceAccountId = null;

function getAvatarInitials(name) {
  if (name.includes("Transfer")) return "TD";
  if (name.toLowerCase().includes("unassigned")) return "UN";
  const numMatch = name.match(/#?(\d+)/);
  if (numMatch) return `#${numMatch[1]}`;
  return name.slice(0, 2).toUpperCase();
}

function reconcileStateFromStorage() {
  const masterSet = new Set(INITIAL_FOLDERS);
  let savedAssigned = {};
  
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      savedAssigned = parsed.accounts || {};
      state.collapsed = parsed.collapsed || {};
    } catch (e) {
      console.error("Storage parse error:", e);
    }
  }

  const assignedAll = new Set();
  const cleanAccounts = {};

  ACCOUNT_PROFILES.forEach(acc => {
    if (acc.id === "acc_unassigned") return;
    const list = savedAssigned[acc.id] || [];
    const valid = list.filter(name => masterSet.has(name));
    cleanAccounts[acc.id] = valid;
    valid.forEach(name => assignedAll.add(name));
  });

  cleanAccounts["acc_unassigned"] = INITIAL_FOLDERS.filter(name => !assignedAll.has(name));
  state.accounts = cleanAccounts;
}

function saveState() {
  try {
    const assignedOnly = {};
    ACCOUNT_PROFILES.forEach(acc => {
      if (acc.id !== "acc_unassigned") {
        assignedOnly[acc.id] = state.accounts[acc.id] || [];
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      accounts: assignedOnly,
      collapsed: state.collapsed
    }));
  } catch (e) {
    console.error("Save error:", e);
  }
}

function resetToDefaultState(shouldRender = true) {
  localStorage.removeItem(STORAGE_KEY);
  ACCOUNT_PROFILES.forEach(acc => {
    state.accounts[acc.id] = [];
    state.collapsed[acc.id] = false;
  });
  state.accounts["acc_unassigned"] = [...INITIAL_FOLDERS];
  state.selected.clear();
  lastClickedFolder = null;
  saveState();

  if (shouldRender) {
    render();
    showToast("Reset all folders back to Unassigned");
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  const msgSpan = document.getElementById("toast-msg");
  msgSpan.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.__toastTimeout);
  window.__toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

function getFolderIconHtml() {
  return `
    <div style="width: 22px; height: 18px; margin-right: 8px; flex-shrink: 0; position: relative;">
      <svg width="22" height="18" viewBox="0 0 24 20" fill="none">
        <path d="M1 3C1 1.89543 1.89543 1 3 1H8.17157C8.70201 1 9.21071 1.21071 9.58579 1.58579L11.4142 3.41421C11.7893 3.78929 12.298 4 12.8284 4H21C22.1046 4 23 4.89543 23 6V17C23 18.1046 22.1046 19 21 19H3C1.89543 19 1 18.1046 1 17V3Z" fill="#F4D06F"/>
        <path d="M0 6C0 5.44772 0.447715 5 1 5H23C23.5523 5 24 5.44772 24 6V17C24 18.1046 23.1046 19 22 19H2C0.89543 19 0 18.1046 0 17V6Z" fill="#FFE68D"/>
        <path d="M0 8.5C0 7.94772 0.447715 7.5 1 7.5H23C23.5523 7.5 24 7.94772 24 8.5V17C24 18.1046 23.1046 19 22 19H2C0.895431 19 0 18.1046 0 17V8.5Z" fill="#FCD355"/>
      </svg>
    </div>
  `;
}

function updateVisualSelectionsOnly() {
  document.querySelectorAll(".folder-item").forEach(item => {
    const fName = item.dataset.folderName;
    const isSelected = state.selected.has(fName);
    const checkbox = item.querySelector(".folder-checkbox");
    if (isSelected) {
      item.classList.add("selected");
      if (checkbox) checkbox.checked = true;
    } else {
      item.classList.remove("selected");
      if (checkbox) checkbox.checked = false;
    }
  });
  updateSelectionBar();
}

function render() {
  const container = document.getElementById("accounts-container");
  container.innerHTML = "";
  const query = state.searchQuery.trim().toLowerCase();
  const isSearching = query.length > 0;

  let totalVisibleFolders = 0;
  let matchedAccountsCount = 0;

  ACCOUNT_PROFILES.forEach((acc) => {
    const rawFolders = state.accounts[acc.id] || [];
    const sortedFolders = rawFolders.slice().sort((a, b) => 
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );

    const filteredFolders = isSearching 
      ? sortedFolders.filter(f => f.toLowerCase().includes(query)) 
      : sortedFolders;

    if (isSearching && filteredFolders.length === 0) {
      return;
    }

    matchedAccountsCount++;
    totalVisibleFolders += filteredFolders.length;

    const isCollapsed = isSearching ? false : !!state.collapsed[acc.id];

    const card = document.createElement("div");
    card.className = `account-card ${acc.theme}`;
    card.dataset.accountId = acc.id;

    card.innerHTML = `
      <div class="account-header" data-toggle-id="${acc.id}">
        <div class="account-info">
          <div class="account-avatar">
            ${getAvatarInitials(acc.name)}
          </div>
          <div class="title-wrap">
            <div class="acc-title-line">
              <span class="acc-name">${acc.name}</span>
              <span class="hub-tag">${acc.tag}</span>
            </div>
            <span class="acc-email">${acc.email}</span>
          </div>
        </div>

        <div class="header-right">
          <span class="count-pill">${filteredFolders.length}</span>
          <i class="fa-solid fa-chevron-${isCollapsed ? 'right' : 'down'} chevron-icon"></i>
        </div>
      </div>

      <div class="account-dropzone ${isCollapsed ? 'hidden' : ''}" data-drop-zone="${acc.id}"></div>
    `;

    const dropzone = card.querySelector(".account-dropzone");

    if (filteredFolders.length === 0) {
      const emptyBox = document.createElement("div");
      emptyBox.className = "empty-box";
      emptyBox.innerHTML = `<i class="fa-regular fa-folder-open"></i><span>Drop folders here</span>`;
      dropzone.appendChild(emptyBox);
    } else {
      filteredFolders.forEach((folderName) => {
        const folderItem = document.createElement("div");
        const isSelected = state.selected.has(folderName);
        folderItem.className = `folder-item ${isSelected ? 'selected' : ''}`;
        folderItem.setAttribute("draggable", "true");
        folderItem.dataset.folderName = folderName;
        folderItem.dataset.accountId = acc.id;

        folderItem.innerHTML = `
          <div class="folder-name-wrap">
            ${getFolderIconHtml()}
            <span class="folder-text">${folderName}</span>
          </div>
          <input type="checkbox" class="folder-checkbox" ${isSelected ? 'checked' : ''} />
        `;

        attachFolderEvents(folderItem, folderName, acc.id);
        dropzone.appendChild(folderItem);
      });
    }

    const header = card.querySelector(".account-header");
    header.addEventListener("click", (e) => {
      if (!e.target.closest(".folder-item")) {
        const isNowCollapsed = !state.collapsed[acc.id];
        state.collapsed[acc.id] = isNowCollapsed;
        saveState();

        const dropzoneEl = card.querySelector(".account-dropzone");
        const chevron = card.querySelector(".chevron-icon");

        dropzoneEl.classList.toggle("hidden", isNowCollapsed);
        if (chevron) {
          chevron.className = `fa-solid fa-chevron-${isNowCollapsed ? 'right' : 'down'} chevron-icon`;
        }
      }
    });

    attachDropzoneEvents(card, acc.id);
    container.appendChild(card);
  });

  if (isSearching && matchedAccountsCount === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 48px 16px; color: var(--text-dim); border: 1px dashed var(--panel-border); border-radius: 20px;">
        <i class="fa-solid fa-folder-magnifying-glass" style="font-size: 2rem; color: #60a5fa;"></i>
        <span style="font-size: 0.95rem; font-weight: 600; color: #fff;">No folders found matching "${state.searchQuery}"</span>
        <span style="font-size: 0.8rem;">Try different folder name keyword</span>
      </div>
    `;
  }

  const counterEl = document.getElementById("stats-counter");
  if (isSearching) {
    counterEl.textContent = `${totalVisibleFolders} matching folders`;
  } else {
    counterEl.textContent = `${INITIAL_FOLDERS.length} folders total`;
  }

  updateSelectionBar();
  populateMoveOptions();
}

function attachFolderEvents(item, folderName, accountId) {
  item.addEventListener("click", (e) => {
    e.stopPropagation();
    if (state.selected.has(folderName)) {
      state.selected.delete(folderName);
    } else {
      state.selected.add(folderName);
    }
    lastClickedFolder = folderName;
    lastClickedAccountId = accountId;
    updateVisualSelectionsOnly();
  });

  item.addEventListener("dragstart", (e) => {
    dragSourceAccountId = accountId;
    if (!state.selected.has(folderName)) {
      state.selected.add(folderName);
      updateVisualSelectionsOnly();
    }
    e.dataTransfer.setData("application/json", JSON.stringify({
      sourceAccountId: accountId,
      folders: Array.from(state.selected)
    }));
    e.dataTransfer.effectAllowed = "move";
    item.classList.add("dragging");
  });

  item.addEventListener("dragend", () => {
    item.classList.remove("dragging");
    document.querySelectorAll(".account-card").forEach(c => c.classList.remove("drag-over"));
  });
}

function attachDropzoneEvents(card, targetAccountId) {
  card.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    card.classList.add("drag-over");
  });

  card.addEventListener("dragleave", (e) => {
    if (!card.contains(e.relatedTarget)) {
      card.classList.remove("drag-over");
    }
  });

  card.addEventListener("drop", (e) => {
    e.preventDefault();
    card.classList.remove("drag-over");
    try {
      const rawData = e.dataTransfer.getData("application/json");
      if (!rawData) return;
      const data = JSON.parse(rawData);
      const movingFolders = data.folders || [];
      const sourceId = data.sourceAccountId || dragSourceAccountId;
      if (sourceId === targetAccountId) return;
      moveFoldersToAccount(movingFolders, targetAccountId, sourceId);
    } catch (err) {
      console.error(err);
    }
  });
}

function moveFoldersToAccount(foldersToMove, targetAccountId) {
  if (!foldersToMove || foldersToMove.length === 0) return;
  const set = new Set(foldersToMove);

  ACCOUNT_PROFILES.forEach(acc => {
    if (acc.id !== targetAccountId) {
      state.accounts[acc.id] = (state.accounts[acc.id] || []).filter(f => !set.has(f));
    }
  });

  const currentInTarget = state.accounts[targetAccountId] || [];
  const newFolders = foldersToMove.filter(f => !currentInTarget.includes(f));
  state.accounts[targetAccountId] = [...currentInTarget, ...newFolders];

  state.collapsed[targetAccountId] = false;
  state.selected.clear();
  lastClickedFolder = null;
  saveState();
  render();

  const profile = ACCOUNT_PROFILES.find(a => a.id === targetAccountId);
  showToast(`Moved ${foldersToMove.length} folder${foldersToMove.length > 1 ? 's' : ''} to ${profile ? profile.name : 'Account'}`);
}

function updateSelectionBar() {
  const bar = document.getElementById("selection-bar");
  const badge = document.getElementById("selected-count-badge");
  const count = state.selected.size;
  if (count > 0) {
    badge.textContent = count;
    bar.classList.remove("hidden");
  } else {
    bar.classList.add("hidden");
  }
}

function populateMoveOptions() {
  const select = document.getElementById("move-target-select");
  if (!select) return;
  select.innerHTML = "";
  ACCOUNT_PROFILES.forEach((acc) => {
    const opt = document.createElement("option");
    opt.value = acc.id;
    opt.textContent = `${acc.tag}: ${acc.name}`;
    select.appendChild(opt);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  reconcileStateFromStorage();
  render();

  const searchInput = document.getElementById("search-input");
  const clearSearchBtn = document.getElementById("clear-search-btn");

  searchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    clearSearchBtn.classList.toggle("hidden", state.searchQuery.trim().length === 0);
    render();
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    state.searchQuery = "";
    clearSearchBtn.classList.add("hidden");
    render();
  });

  document.getElementById("expand-all-btn").addEventListener("click", () => {
    ACCOUNT_PROFILES.forEach(acc => { state.collapsed[acc.id] = false; });
    saveState();
    document.querySelectorAll(".account-card").forEach(card => {
      const dropzone = card.querySelector(".account-dropzone");
      const chevron = card.querySelector(".chevron-icon");
      if (dropzone) dropzone.classList.remove("hidden");
      if (chevron) chevron.className = "fa-solid fa-chevron-down chevron-icon";
    });
  });

  document.getElementById("collapse-all-btn").addEventListener("click", () => {
    ACCOUNT_PROFILES.forEach(acc => { state.collapsed[acc.id] = true; });
    saveState();
    document.querySelectorAll(".account-card").forEach(card => {
      const dropzone = card.querySelector(".account-dropzone");
      const chevron = card.querySelector(".chevron-icon");
      if (dropzone) dropzone.classList.add("hidden");
      if (chevron) chevron.className = "fa-solid fa-chevron-right chevron-icon";
    });
  });

  document.getElementById("reset-btn").addEventListener("click", () => resetToDefaultState(true));
  document.getElementById("move-selected-btn").addEventListener("click", () => {
    const targetId = document.getElementById("move-target-select").value;
    moveFoldersToAccount(Array.from(state.selected), targetId);
  });

  document.getElementById("deselect-all-btn").addEventListener("click", () => {
    state.selected.clear();
    updateVisualSelectionsOnly();
  });
});