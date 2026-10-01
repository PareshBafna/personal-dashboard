import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import googleRoutes from "./google/google.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Mount Google API
app.use("/api/google", googleRoutes);

// Static folders
app.use("/auth", express.static(path.join(__dirname, "auth")));
app.use("/google", express.static(path.join(__dirname, "google")));
app.use("/mega", express.static(path.join(__dirname, "mega")));
app.use("/notion", express.static(path.join(__dirname, "notion")));
app.use("/shared", express.static(path.join(__dirname, "shared")));

// Default redirect
app.get("/", (req, res) => {
  res.redirect("/google/html/google.html");
});

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running: http://localhost:${PORT}`);
  console.log(`Server running IPv4: http://127.0.0.1:${PORT}`);
});