import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import googleRoutes from "./pages/google/google-common/google.service.js";
import megaRoutes from "./pages/mega/mega.service.js";
import notionRoutes from "./pages/notion/notion-common/notion.service.js"; // <-- 1. IMPORT

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// APIs
app.use("/api/google", googleRoutes);
app.use("/api/mega", megaRoutes);
app.use("/api/notion", notionRoutes); // <-- 2. MOUNT ROUTE

// Static assets
app.use("/auth", express.static(path.join(__dirname, "auth")));
app.use("/shared", express.static(path.join(__dirname, "shared")));
app.use("/pages", express.static(path.join(__dirname, "pages")));
app.use("/google", express.static(path.join(__dirname, "pages", "google")));
app.use("/mega", express.static(path.join(__dirname, "pages", "mega")));
app.use("/notion", express.static(path.join(__dirname, "pages", "notion")));

// Default redirect
app.get("/", (req, res) => {
  res.redirect("/google/google-account-details/google-account-details.html");
});

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running: http://localhost:${PORT}`);
  console.log(`Server running IPv4: http://127.0.0.1:${PORT}`);
});