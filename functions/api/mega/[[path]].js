import { Storage } from "megajs";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });

const GB = 1073741824;
const MB = 1048576;

const formatBytes = (bytes) => {
  const b = Number(bytes || 0);
  return b >= GB ? `${(b / GB).toFixed(2)} GB` : `${(b / MB).toFixed(2)} MB`;
};

function getAccounts(env) {
  try {
    const parsed = JSON.parse(env.MEGA_CREDENTIALS || "{}");
    return Array.isArray(parsed.accounts) ? parsed.accounts : [];
  } catch {
    return [];
  }
}

function getFolderSize(node) {
  if (!node.directory) return Number(node.size || 0);
  let size = 0;
  for (const child of node.children || []) size += getFolderSize(child);
  return size;
}

function buildFolderNode(node) {
  const bytes = getFolderSize(node);
  const children = (node.children || [])
    .filter((c) => c.directory && c.name)
    .map(buildFolderNode)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));

  return {
    name: node.name,
    bytes,
    sizeGB: (bytes / GB).toFixed(2),
    formattedSize: formatBytes(bytes),
    children
  };
}

async function fetchMegaStorage(acc) {
  if (!acc.email || !acc.password) {
    const missing = [!acc.email && "email", !acc.password && "password"]
      .filter(Boolean)
      .join(", ");
    throw new Error(
      `Credentials not configured (missing: ${missing}; keys: ${Object.keys(acc).join(",")})`
    );
  }

  const storage = await new Storage({
    email: acc.email,
    password: acc.password,
    autologin: true
  }).ready;

  try {
    if (!storage.root?.children?.length) {
      try { await storage.reload(); } catch {}
    }

    const info = await storage.getAccountInfo();
    const limit = Number(info.spaceTotal || 0);
    const usage = Number(info.spaceUsed || 0);

    const folders = (storage.root?.children || [])
      .filter((c) => c.directory && c.name)
      .map(buildFolderNode)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));

    return {
      id: acc.id,
      name: acc.name,
      email: acc.email,
      limitGB: limit ? (limit / GB).toFixed(2) : "20.00",
      usedGB: (usage / GB).toFixed(2),
      percent: limit ? ((usage / limit) * 100).toFixed(1) : "0.0",
      folders
    };
  } finally {
    storage.close();
  }
}

const baseOf = (acc) => ({
  id: acc.id,
  name: acc.name,
  email: acc.email,
  limitGB: null,
  usedGB: null,
  percent: null,
  folders: []
});

export async function onRequest({ request, env, params }) {
  const accounts = getAccounts(env);
  const route = Array.isArray(params.path) ? params.path.join("/") : params.path;

  if (request.method === "GET" && route === "accounts") {
    return json(accounts.map((acc) => ({ ...baseOf(acc), synced: false })));
  }

  if (request.method === "POST" && route === "sync-one") {
    let id;
    try { ({ id } = await request.json()); } catch {}
    const acc = accounts.find((a) => a.id === id);
    if (!acc) return json({ error: "Account not found" }, 404);

    try {
      return json({ ...(await fetchMegaStorage(acc)), synced: true });
    } catch (err) {
      return json({ ...baseOf(acc), error: err.message, synced: false }, 500);
    }
  }

  return json({ error: "Not found" }, 404);
}