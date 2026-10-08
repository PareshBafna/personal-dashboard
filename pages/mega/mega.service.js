import express from "express";
import { Storage } from "megajs";
import { MEGA_CREDS } from "./credentials/mega.creds.js";

const router = express.Router();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function formatBytes(bytes) {
  const b = Number(bytes || 0);
  const gb = 1073741824;
  const mb = 1048576;
  if (b >= gb) {
    return `${(b / gb).toFixed(2)} GB`;
  }
  return `${(b / mb).toFixed(2)} MB`;
}

function getFolderSize(node) {
  let size = 0;
  if (!node.directory) {
    return Number(node.size || 0);
  }
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      size += getFolderSize(child);
    }
  }
  return size;
}

function buildFolderNode(folderNode) {
  const bytes = getFolderSize(folderNode);
  const subFolders = [];

  if (folderNode.children && Array.isArray(folderNode.children)) {
    for (const child of folderNode.children) {
      if (child.directory && child.name) {
        subFolders.push(buildFolderNode(child));
      }
    }
  }

  // Sort subfolders A to Z
  subFolders.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));

  return {
    name: folderNode.name,
    bytes,
    sizeGB: (bytes / 1073741824).toFixed(2),
    formattedSize: formatBytes(bytes),
    children: subFolders
  };
}

async function fetchMegaStorage(acc) {
  if (!acc.email || !acc.password || acc.password.startsWith("YOUR_REAL")) {
    throw new Error("Credentials not configured");
  }

  const storage = await new Storage({
    email: acc.email,
    password: acc.password,
    autologin: true
  }).ready;

  if (!storage.root || !storage.root.children || storage.root.children.length === 0) {
    try {
      await storage.reload();
    } catch (e) {}
  }

  const info = await storage.getAccountInfo();
  const limit = Number(info.spaceTotal || 0);
  const usage = Number(info.spaceUsed || 0);

  const folders = [];
  const rootNodes = storage.root?.children || storage.files || [];

  for (const item of Object.values(rootNodes)) {
    const isDir = Boolean(item.directory);
    const isRootChild = item.parent === storage.root || !item.parent || (storage.root?.children && storage.root.children.includes(item));

    if (isDir && isRootChild && item.name) {
      folders.push(buildFolderNode(item));
    }
  }

  folders.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));

  storage.close();

  return {
    id: acc.id,
    name: acc.name,
    email: acc.email,
    limitGB: limit ? (limit / 1073741824).toFixed(2) : "20.00",
    usedGB: (usage / 1073741824).toFixed(2),
    percent: limit ? ((usage / limit) * 100).toFixed(1) : "0.0",
    folders
  };
}

router.get("/accounts", (req, res) => {
  const list = MEGA_CREDS.accounts.map((acc) => ({
    id: acc.id,
    name: acc.name,
    email: acc.email,
    limitGB: null,
    usedGB: null,
    percent: null,
    folders: [],
    synced: false
  }));
  res.json(list);
});

router.post("/sync-one", async (req, res) => {
  const { id } = req.body;
  const acc = MEGA_CREDS.accounts.find((a) => a.id === id);

  if (!acc) return res.status(404).json({ error: "Account not found" });

  try {
    const data = await fetchMegaStorage(acc);
    res.json({ ...data, synced: true });
  } catch (err) {
    res.status(500).json({ id: acc.id, name: acc.name, email: acc.email, error: err.message, synced: false, folders: [] });
  }
});

router.post("/sync-all", async (req, res) => {
  const results = [];

  for (const acc of MEGA_CREDS.accounts) {
    try {
      const data = await fetchMegaStorage(acc);
      results.push({ ...data, synced: true });
    } catch (err) {
      results.push({
        id: acc.id,
        name: acc.name,
        email: acc.email,
        limitGB: null,
        usedGB: null,
        percent: null,
        folders: [],
        error: err.message,
        synced: false
      });
    }
    await sleep(1500);
  }

  res.json(results);
});

export default router;