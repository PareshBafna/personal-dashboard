// File: services/notion/task-tracker/views/inbox-view/api/api.backend.js
// Express backend router handling Notion API proxy requests for Inbox View operations.
// Relative path to Notion credentials points to root functions directory.

import express from "express";
import { NOTION_CONFIG } from "../../../../../../functions/api/notion/credentials.js";

const router = express.Router();

const getHeaders = (token) => ({
  "Authorization": `Bearer ${token || NOTION_CONFIG.apiKey || process.env.NOTION_API_KEY}`,
  "Notion-Version": NOTION_CONFIG.version || "2022-06-28",
  "Content-Type": "application/json"
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

export default router;