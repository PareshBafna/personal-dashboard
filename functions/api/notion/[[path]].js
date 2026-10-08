import { NOTION_CONFIG } from "./credentials.js";

export async function onRequest(context) {
  const { request, env, params } = context;
  const path = Array.isArray(params.path) ? params.path.join("/") : params.path || "";
  const apiKey = env.NOTION_API_KEY || NOTION_CONFIG.apiKey;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing Notion API key" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const notionHeaders = {
    "Authorization": `Bearer ${apiKey}`,
    "Notion-Version": NOTION_CONFIG.version || "2022-06-28",
    "Content-Type": "application/json"
  };

  try {
    if (path === "users") {
      const resp = await fetch("https://api.notion.com/v1/users", { headers: notionHeaders });
      const data = await resp.text();
      return new Response(data, { status: resp.status, headers: { "Content-Type": "application/json" } });
    }

    if (path === "search" || path === "databases") {
      const resp = await fetch("https://api.notion.com/v1/search", {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify({
          filter: { value: "database", property: "object" },
          page_size: 100
        })
      });
      const data = await resp.text();
      return new Response(data, { status: resp.status, headers: { "Content-Type": "application/json" } });
    }

    if (path.startsWith("database/")) {
      const dbId = path.replace("database/", "");
      const resp = await fetch(`https://api.notion.com/v1/databases/${dbId}`, { headers: notionHeaders });
      const data = await resp.text();
      return new Response(data, { status: resp.status, headers: { "Content-Type": "application/json" } });
    }

    if (path === "query-database") {
      const body = await request.json();
      const payload = {};
      if (body.filter) payload.filter = body.filter;
      if (body.sorts) payload.sorts = body.sorts;
      if (body.start_cursor) payload.start_cursor = body.start_cursor;
      payload.page_size = body.page_size || 100;

      const resp = await fetch(`https://api.notion.com/v1/databases/${body.databaseId}/query`, {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify(payload)
      });
      const data = await resp.text();
      return new Response(data, { status: resp.status, headers: { "Content-Type": "application/json" } });
    }

    if (path === "create-page") {
      const body = await request.json();
      const payload = {
        parent: { database_id: body.databaseId },
        properties: body.properties
      };
      if (body.icon) payload.icon = body.icon;

      const resp = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify(payload)
      });
      const data = await resp.text();
      return new Response(data, { status: resp.status, headers: { "Content-Type": "application/json" } });
    }

    if (path === "update-page") {
      const body = await request.json();
      const resp = await fetch(`https://api.notion.com/v1/pages/${body.pageId}`, {
        method: "PATCH",
        headers: notionHeaders,
        body: JSON.stringify({ properties: body.properties })
      });
      const data = await resp.text();
      return new Response(data, { status: resp.status, headers: { "Content-Type": "application/json" } });
    }

    if (path === "delete-page") {
      const body = await request.json();
      const resp = await fetch(`https://api.notion.com/v1/pages/${body.pageId}`, {
        method: "PATCH",
        headers: notionHeaders,
        body: JSON.stringify({ archived: true })
      });
      const data = await resp.text();
      return new Response(data, { status: resp.status, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: `Not found: ${path}` }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}