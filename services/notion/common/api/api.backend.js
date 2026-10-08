import express from "express";
import { NOTION_CONFIG } from "../../../../functions/api/notion/credentials.js";

const router = express.Router();

const getHeaders = (token) => ({
  "Authorization": `Bearer ${token || NOTION_CONFIG.apiKey || process.env.NOTION_API_KEY}`,
  "Notion-Version": NOTION_CONFIG.version || "2022-06-28",
  "Content-Type": "application/json"
});

router.post("/search", async (req, res) => {
  try {
    const resp = await fetch("https://api.notion.com/v1/search", {
      method: "POST",
      headers: getHeaders(process.env.NOTION_API_KEY),
      body: JSON.stringify({
        filter: { value: "database", property: "object" },
        page_size: 100
      })
    });
    if (!resp.ok) return res.status(resp.status).json({ error: await resp.text() });
    const data = await resp.json();
    res.json({ results: data.results || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/users", async (req, res) => {
  try {
    const resp = await fetch("https://api.notion.com/v1/users", {
      headers: getHeaders(process.env.NOTION_API_KEY)
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/query-database", async (req, res) => {
  const { databaseId, filter, sorts, page_size, start_cursor } = req.body;
  if (!databaseId) return res.status(400).json({ error: "Missing databaseId" });

  try {
    const payload = {};
    if (filter) payload.filter = filter;
    if (sorts) payload.sorts = sorts;
    if (start_cursor) payload.start_cursor = start_cursor;
    payload.page_size = page_size || 100;

    const resp = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: getHeaders(process.env.NOTION_API_KEY),
      body: JSON.stringify(payload)
    });

    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/create-page", async (req, res) => {
  const { databaseId, properties, icon } = req.body;
  if (!databaseId || !properties) return res.status(400).json({ error: "Missing databaseId or properties" });

  try {
    const payload = { parent: { database_id: databaseId }, properties };
    if (icon) payload.icon = icon;

    const resp = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: getHeaders(process.env.NOTION_API_KEY),
      body: JSON.stringify(payload)
    });

    const data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json(data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/update-page", async (req, res) => {
  const { pageId, properties } = req.body;
  if (!pageId || !properties) return res.status(400).json({ error: "Missing pageId or properties" });

  try {
    const resp = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: getHeaders(process.env.NOTION_API_KEY),
      body: JSON.stringify({ properties })
    });

    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/delete-page", async (req, res) => {
  const { pageId } = req.body;
  if (!pageId) return res.status(400).json({ error: "Missing pageId" });

  try {
    const resp = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: getHeaders(process.env.NOTION_API_KEY),
      body: JSON.stringify({ archived: true })
    });

    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;