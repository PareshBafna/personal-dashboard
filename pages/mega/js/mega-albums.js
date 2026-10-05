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
  { id: "acc_unassigned", name: "Unassigned", email: "unassigned@local", color: "from-zinc-600 to-stone-700", icon: "box-open", tag: "Inbox" },
  { id: "acc_mega_transfer", name: "MEGA - Transfer Data", email: "pareshbafna26@gmail.com", color: "from-red-600 to-rose-800", icon: "arrow-right-arrow-left", tag: "Transfer" },
  { id: "acc_mega_01", name: "MEGA - Account #01", email: "pareshbafna3@gmail.com", color: "from-emerald-600 to-teal-700", icon: "cloud", tag: "#01" },
  { id: "acc_mega_02", name: "MEGA - Account #02", email: "pareshbafna4@gmail.com", color: "from-purple-600 to-pink-700", icon: "cloud", tag: "#02" },
  { id: "acc_mega_03", name: "MEGA - Account #03", email: "pareshbafna5@gmail.com", color: "from-amber-600 to-orange-700", icon: "cloud", tag: "#03" },
  { id: "acc_mega_04", name: "MEGA - Account #04", email: "pareshbafna6@gmail.com", color: "from-rose-600 to-red-700", icon: "cloud", tag: "#04" },
  { id: "acc_mega_05", name: "MEGA - Account #05", email: "pareshbafna11@gmail.com", color: "from-cyan-600 to-blue-700", icon: "cloud", tag: "#05" },
  { id: "acc_mega_06", name: "MEGA - Account #06", email: "pareshbafna12@gmail.com", color: "from-violet-600 to-indigo-800", icon: "cloud", tag: "#06" },
  { id: "acc_mega_07", name: "MEGA - Account #07", email: "pareshbafna14@gmail.com", color: "from-teal-600 to-green-700", icon: "cloud", tag: "#07" },
  { id: "acc_mega_08", name: "MEGA - Account #08", email: "pareshbafna15@gmail.com", color: "from-slate-600 to-gray-700", icon: "cloud", tag: "#08" },
  { id: "acc_mega_09", name: "MEGA - Account #09", email: "pareshbafna16@gmail.com", color: "from-fuchsia-600 to-pink-800", icon: "cloud", tag: "#09" },
  { id: "acc_mega_10", name: "MEGA - Account #10", email: "pareshbafna18@gmail.com", color: "from-sky-700 to-slate-800", icon: "cloud", tag: "#10" },
  { id: "acc_mega_11", name: "MEGA - Account #11", email: "pareshbafna3+1@gmail.com", color: "from-emerald-700 to-teal-800", icon: "cloud", tag: "#11" },
  { id: "acc_mega_12", name: "MEGA - Account #12", email: "pareshbafna4+1@gmail.com", color: "from-purple-700 to-pink-800", icon: "cloud", tag: "#12" },
  { id: "acc_mega_13", name: "MEGA - Account #13", email: "pareshbafna5+1@gmail.com", color: "from-amber-700 to-orange-800", icon: "cloud", tag: "#13" },
  { id: "acc_mega_14", name: "MEGA - Account #14", email: "pareshbafna6+1@gmail.com", color: "from-rose-700 to-red-800", icon: "cloud", tag: "#14" },
  { id: "acc_mega_15", name: "MEGA - Account #15", email: "pareshbafna11+1@gmail.com", color: "from-cyan-700 to-blue-800", icon: "cloud", tag: "#15" },
  { id: "acc_mega_16", name: "MEGA - Account #16", email: "pareshbafna12+1@gmail.com", color: "from-violet-700 to-indigo-900", icon: "cloud", tag: "#16" },
  { id: "acc_mega_17", name: "MEGA - Account #17", email: "pareshbafna14+1@gmail.com", color: "from-teal-700 to-green-800", icon: "cloud", tag: "#17" },
  { id: "acc_mega_18", name: "MEGA - Account #18", email: "pareshbafna15+1@gmail.com", color: "from-slate-700 to-gray-800", icon: "cloud", tag: "#18" },
  { id: "acc_mega_19", name: "MEGA - Account #19", email: "pareshbafna16+1@gmail.com", color: "from-fuchsia-700 to-pink-900", icon: "cloud", tag: "#19" },
  { id: "acc_mega_20", name: "MEGA - Account #20", email: "pareshbafna18+1@gmail.com", color: "from-sky-800 to-slate-900", icon: "cloud", tag: "#20" }
];

const STORAGE_KEY = "mega_assigned_folders_only";

let state = {
  accounts: {},
  collapsed: {},
  selected: new Set(),
  searchQuery: ""
};

let lastClickedFolder = null;
let lastClickedAccountId = null;
let dragSourceAccountId = null;

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

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const msgSpan = document.getElementById("toast-msg");
  const icon = document.getElementById("toast-icon");

  msgSpan.textContent = message;
  if (type === "success") {
    icon.className = "fa-solid fa-circle-check text-ggreen";
  } else {
    icon.className = "fa-solid fa-circle-info text-gblue";
  }

  toast.classList.remove("translate-y-20", "opacity-0");
  toast.classList.add("translate-y-0", "opacity-100");

  clearTimeout(window.__toastTimeout);
  window.__toastTimeout = setTimeout(() => {
    toast.classList.add("translate-y-20", "opacity-0");
    toast.classList.remove("translate-y-0", "opacity-100");
  }, 2400);
}

function getFolderIconHtml() {
  return `
    <div class="relative flex-shrink-0 w-6 h-5 mr-2">
      <svg class="w-6 h-5 drop-shadow" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 3C1 1.89543 1.89543 1 3 1H8.17157C8.70201 1 9.21071 1.21071 9.58579 1.58579L11.4142 3.41421C11.7893 3.78929 12.298 4 12.8284 4H21C22.1046 4 23 4.89543 23 6V17C23 18.1046 22.1046 19 21 19H3C1.89543 19 1 18.1046 1 17V3Z" fill="#dc2626"/>
        <path d="M0 6C0 5.44772 0.447715 5 1 5H23C23.5523 5 24 5.44772 24 6V17C24 18.1046 23.1046 19 22 19H2C0.89543 19 0 18.1046 0 17V6Z" fill="#ef4444"/>
        <path d="M0 8.5C0 7.94772 0.447715 7.5 1 7.5H23C23.5523 7.5 24 7.94772 24 8.5V17C24 18.1046 23.1046 19 22 19H2C0.895431 19 0 18.1046 0 17V8.5Z" fill="#f87171"/>
      </svg>
      <div class="absolute -bottom-1 left-2.5 w-3.5 h-3.5 rounded-full bg-red-700 border border-surface-900 flex items-center justify-center text-[8px] font-bold text-white shadow-sm leading-none">
        M
      </div>
    </div>
  `;
}

function updateVisualSelectionsOnly() {
  document.querySelectorAll(".folder-item").forEach(item => {
    const fName = item.dataset.folderName;
    const isSelected = state.selected.has(fName);
    const checkbox = item.querySelector(".folder-select-box");

    if (isSelected) {
      item.classList.add("selected");
      item.classList.remove("border-transparent", "bg-surface-850/60");
      if (checkbox) checkbox.checked = true;
    } else {
      item.classList.remove("selected");
      item.classList.add("border-transparent", "bg-surface-850/60");
      if (checkbox) checkbox.checked = false;
    }
  });

  updateSelectionBar();
}

function render() {
  const scrollY = window.scrollY;
  const container = document.getElementById("accounts-container");

  const scrollPositions = {};
  container.querySelectorAll(".account-dropzone").forEach(dz => {
    const accId = dz.dataset.dropZone;
    if (accId) scrollPositions[accId] = dz.scrollTop;
  });

  container.innerHTML = "";

  const query = state.searchQuery.trim().toLowerCase();

  ACCOUNT_PROFILES.forEach((acc) => {
    const rawFolders = state.accounts[acc.id] || [];

    const sortedFolders = rawFolders.slice().sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );

    const isCollapsed = Boolean(state.collapsed[acc.id]);

    const filteredFolders = query
      ? sortedFolders.filter(f => f.toLowerCase().includes(query))
      : sortedFolders;

    const card = document.createElement("div");
    card.className = `account-card flex flex-col bg-surface-800 border border-surface-700 rounded-2xl overflow-hidden shadow-sm transition-all duration-200 hover:border-surface-600 ${isCollapsed ? 'opacity-90' : ''}`;
    card.dataset.accountId = acc.id;

    card.innerHTML = `
      <div class="account-header p-3.5 flex items-center justify-between cursor-pointer hover:bg-surface-750/70 border-b border-surface-700/80 transition" data-toggle-id="${acc.id}">
        <div class="flex items-center gap-3 overflow-hidden">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-tr ${acc.color} flex items-center justify-center text-white text-xs shadow-sm flex-shrink-0">
            <i class="fa-solid fa-${acc.icon}"></i>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="text-xs sm:text-sm font-semibold text-white truncate">${acc.name}</h3>
              <span class="text-[10px] px-1.5 py-0.2 rounded-md bg-surface-700 text-gray-300 font-mono">${acc.tag}</span>
            </div>
            <p class="text-[11px] text-gray-400 truncate">${acc.email}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <span class="text-xs px-2 py-0.5 rounded-full font-medium ${rawFolders.length > 0 ? 'bg-surface-700 text-red-400' : 'bg-surface-850 text-gray-500'} border border-surface-600">
            ${rawFolders.length}
          </span>
          <button class="toggle-chevron-btn w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-600 text-gray-400 hover:text-white transition">
            <i class="fa-solid fa-chevron-${isCollapsed ? 'right' : 'down'} text-xs"></i>
          </button>
        </div>
      </div>

      <div class="account-dropzone flex-1 p-2 min-h-[90px] max-h-[380px] overflow-y-auto space-y-1 transition-all ${isCollapsed ? 'hidden' : 'block'}" data-drop-zone="${acc.id}">
      </div>
    `;

    const dropzone = card.querySelector(".account-dropzone");

    if (filteredFolders.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "h-24 flex flex-col items-center justify-center text-center text-gray-500 text-xs border border-dashed border-surface-700 rounded-xl my-1 p-3 pointer-events-none";
      emptyState.innerHTML = query
        ? `<i class="fa-solid fa-folder-magnifying-glass mb-1 text-surface-500"></i><span>No match</span>`
        : `<i class="fa-regular fa-folder-open mb-1 text-surface-500"></i><span>Drop folders here</span>`;
      dropzone.appendChild(emptyState);
    } else {
      filteredFolders.forEach((folderName) => {
        const folderItem = document.createElement("div");
        const isSelected = state.selected.has(folderName);

        folderItem.className = `folder-item group flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
          isSelected
            ? 'selected'
            : 'border-transparent bg-surface-850/60 hover:bg-surface-750 hover:border-surface-650 text-gray-200'
        }`;
        folderItem.setAttribute("draggable", "true");
        folderItem.dataset.folderName = folderName;
        folderItem.dataset.accountId = acc.id;

        folderItem.innerHTML = `
          <div class="flex items-start min-w-0 flex-1 pointer-events-none py-0.5">
            ${getFolderIconHtml()}
            <span class="font-normal tracking-wide text-gray-200 leading-snug break-words flex-1">${escapeHtml(folderName)}</span>
          </div>
          <div class="flex items-center gap-1 pl-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 self-center">
            <input
              type="checkbox"
              class="folder-select-box rounded bg-surface-700 border-surface-500 text-red-500 focus:ring-0 cursor-pointer pointer-events-auto"
              ${isSelected ? 'checked' : ''}
            />
          </div>
        `;

        attachFolderEvents(folderItem, folderName, acc.id);
        dropzone.appendChild(folderItem);
      });
    }

    // In-place accordion toggle without rebuilding DOM or jumping viewport
    const header = card.querySelector(".account-header");
    header.addEventListener("click", (e) => {
      if (e.target.closest(".folder-item")) return;
      e.preventDefault();

      const currentlyCollapsed = Boolean(state.collapsed[acc.id]);
      const nextCollapsed = !currentlyCollapsed;
      state.collapsed[acc.id] = nextCollapsed;
      saveState();

      dropzone.classList.toggle("hidden", nextCollapsed);
      dropzone.classList.toggle("block", !nextCollapsed);
      card.classList.toggle("opacity-90", nextCollapsed);

      const icon = card.querySelector(".toggle-chevron-btn i");
      if (icon) {
        icon.className = `fa-solid fa-chevron-${nextCollapsed ? "right" : "down"} text-xs`;
      }
    });

    attachDropzoneEvents(card, acc.id);
    container.appendChild(card);

    if (scrollPositions[acc.id] && dropzone) {
      dropzone.scrollTop = scrollPositions[acc.id];
    }
  });

  document.getElementById("stats-counter").textContent = `${INITIAL_FOLDERS.length} folders total`;
  updateSelectionBar();
  populateMoveOptions();

  // Keep window viewport stable
  window.scrollTo({ top: scrollY, behavior: "instant" });
}

function attachFolderEvents(item, folderName, accountId) {
  item.addEventListener("click", (e) => {
    e.stopPropagation();

    const isShift = e.shiftKey;

    if (isShift && lastClickedFolder && lastClickedAccountId === accountId) {
      const allInAcc = state.accounts[accountId] || [];
      const idxA = allInAcc.indexOf(lastClickedFolder);
      const idxB = allInAcc.indexOf(folderName);

      if (idxA !== -1 && idxB !== -1) {
        const start = Math.min(idxA, idxB);
        const end = Math.max(idxA, idxB);
        for (let i = start; i <= end; i++) {
          state.selected.add(allInAcc[i]);
        }
      } else {
        state.selected.add(folderName);
      }
    } else {
      if (state.selected.has(folderName)) {
        state.selected.delete(folderName);
      } else {
        state.selected.add(folderName);
      }
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

    const payload = Array.from(state.selected);
    e.dataTransfer.setData("application/json", JSON.stringify({
      sourceAccountId: accountId,
      folders: payload
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
      console.error("Drop error:", err);
    }
  });
}

function moveFoldersToAccount(foldersToMove, targetAccountId, sourceAccountId = null) {
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

  const targetProfile = ACCOUNT_PROFILES.find(a => a.id === targetAccountId);
  const name = targetProfile ? targetProfile.name : "Target";
  showToast(`Moved ${foldersToMove.length} folder${foldersToMove.length > 1 ? 's' : ''} to ${name}`);
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

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
  reconcileStateFromStorage();
  render();

  const searchInput = document.getElementById("search-input");
  const clearSearchBtn = document.getElementById("clear-search-btn");

  searchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    if (state.searchQuery.trim().length > 0) {
      clearSearchBtn.classList.remove("hidden");
    } else {
      clearSearchBtn.classList.add("hidden");
    }
    render();
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    state.searchQuery = "";
    clearSearchBtn.classList.add("hidden");
    render();
  });

  document.getElementById("expand-all-btn").addEventListener("click", (e) => {
    e.preventDefault();
    ACCOUNT_PROFILES.forEach(acc => {
      state.collapsed[acc.id] = false;
    });
    saveState();
    render();
  });

  document.getElementById("collapse-all-btn").addEventListener("click", (e) => {
    e.preventDefault();
    ACCOUNT_PROFILES.forEach(acc => {
      state.collapsed[acc.id] = true;
    });
    saveState();
    render();
  });

  document.getElementById("reset-btn").addEventListener("click", (e) => {
    e.preventDefault();
    resetToDefaultState(true);
  });

  document.getElementById("move-selected-btn").addEventListener("click", (e) => {
    e.preventDefault();
    const targetId = document.getElementById("move-target-select").value;
    const folders = Array.from(state.selected);
    moveFoldersToAccount(folders, targetId);
  });

  document.getElementById("deselect-all-btn").addEventListener("click", (e) => {
    e.preventDefault();
    state.selected.clear();
    lastClickedFolder = null;
    updateVisualSelectionsOnly();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      state.selected.clear();
      lastClickedFolder = null;
      updateVisualSelectionsOnly();
    }
  });
});