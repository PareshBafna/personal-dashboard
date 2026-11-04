import { Storage } from "megajs";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });

function getAccounts(env) {
  try {
    const parsed = JSON.parse(env.MEGA_CREDENTIALS || "{}");
    return Array.isArray(parsed.accounts) ? parsed.accounts : [];
  } catch {
    return [];
  }
}

export async function onRequest({ request, env, params }) {
  const accounts = getAccounts(env);
  const route = Array.isArray(params.path) ? params.path.join("/") : params.path;

  if (request.method === "GET" && route === "accounts") {
    return json(
      accounts.map(({ id, name, email }) => ({
        id, name, email,
        limitGB: null, usedGB: null, percent: null,
        folders: [], synced: false
      }))
    );
  }

  return json({ error: "Not implemented" }, 501);
}