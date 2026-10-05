import express from "express";
import { NOTION_CONFIG } from "../notion-credentials/notion.credentials.js";

const router = express.Router();

const getHeaders = (token) => ({
  "Authorization": `Bearer ${token || NOTION_CONFIG.apiKey}`,
  "Notion-Version": NOTION_CONFIG.version,
  "Content-Type": "application/json"
});

// In-memory cache (5 min TTL)
let memoryCache = null;
let lastCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

// High-speed single search endpoint (No slow pagination loop)
router.post("/search", async (req, res) => {
  const force = req.body?.forceRefresh;
  const now = Date.now();

  if (!force && memoryCache && (now - lastCacheTime < CACHE_TTL)) {
    return res.json({ results: memoryCache, cached: true });
  }

  try {
    const resp = await fetch("https://api.notion.com/v1/search", {
      method: "POST",
      headers: getHeaders(process.env.NOTION_API_KEY),
      body: JSON.stringify({
        filter: { value: "database", property: "object" },
        page_size: 100
      })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: errText });
    }

    const data = await resp.json();
    const databases = (data.results || []).filter(item => item.object === "database");

    memoryCache = databases;
    lastCacheTime = now;

    res.json({ results: databases, cached: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single database details & properties schema
router.get("/database/:id", async (req, res) => {
  try {
    const resp = await fetch(`https://api.notion.com/v1/databases/${req.params.id}`, {
      headers: getHeaders(process.env.NOTION_API_KEY)
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Query items inside database
router.post("/query-database", async (req, res) => {
  const { databaseId, filter, sorts } = req.body;
  if (!databaseId) return res.status(400).json({ error: "Missing databaseId" });

  try {
    const resp = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: getHeaders(process.env.NOTION_API_KEY),
      body: JSON.stringify({ filter, sorts })
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;