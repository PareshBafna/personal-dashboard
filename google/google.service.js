import express from "express";
import https from "node:https";
import { GOOGLE_CREDS } from "./credentials/google.creds.js";

const router = express.Router();

function postHttps(hostname, path, data) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams(data).toString();
    const options = {
      hostname,
      port: 443,
      path,
      method: "POST",
      family: 4,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (err) {
          reject(new Error("JSON Parse Error: " + body));
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

function getHttps(url, token) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      family: 4,
      headers: {
        Authorization: `Bearer ${token}`
      }
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (err) {
          reject(new Error("JSON Parse Error: " + body));
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.end();
  });
}

// 1. Generate Auth URL
router.get("/auth-url", (req, res) => {
  const scopes = [
    "https://www.googleapis.com/auth/drive.metadata.readonly",
    "https://www.googleapis.com/auth/userinfo.email"
  ].join(" ");

  const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
      client_id: GOOGLE_CREDS.clientId,
      redirect_uri: GOOGLE_CREDS.redirectUri,
      response_type: "code",
      scope: scopes,
      access_type: "offline",
      prompt: "consent"
    }).toString();

  res.json({ url });
});

// 2. OAuth Callback
router.get("/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("No authorization code found.");

  try {
    const data = await postHttps("oauth2.googleapis.com", "/token", {
      code: String(code),
      client_id: GOOGLE_CREDS.clientId,
      client_secret: GOOGLE_CREDS.clientSecret,
      redirect_uri: GOOGLE_CREDS.redirectUri,
      grant_type: "authorization_code"
    });

    if (data.error) {
      return res.status(400).send(`Google Auth Error: ${data.error_description || data.error}`);
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Google Token Received</title>
        <style>
          body { font-family: sans-serif; background: #121212; color: #fff; padding: 40px; }
          textarea { width: 100%; height: 120px; font-size: 16px; background: #1e1e1e; color: #00ff66; border: 1px solid #444; padding: 10px; margin-top: 10px; }
          p { color: #aaa; }
        </style>
      </head>
      <body>
        <h2>Refresh Token:</h2>
        <textarea readonly>${data.refresh_token || "NO_REFRESH_TOKEN (Revoke dashboard access inside Google Account Security settings and re-auth)"}</textarea>
        <p>Copy token into matching slot inside google/credentials/google.creds.js</p>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Token exchange failed:", err);
    res.status(500).send(`Internal Error: ${err.message}`);
  }
});

// 3. Storage Quota Fetcher
router.get("/storage", async (req, res) => {
  const results = await Promise.allSettled(
    GOOGLE_CREDS.accounts.map(async (acc) => {
      if (!acc.refreshToken || acc.refreshToken.startsWith("REFRESH_TOKEN_")) {
        return { name: acc.name, email: acc.email, error: "No refresh token set" };
      }

      // Refresh token to get access token
      const tokenData = await postHttps("oauth2.googleapis.com", "/token", {
        client_id: GOOGLE_CREDS.clientId,
        client_secret: GOOGLE_CREDS.clientSecret,
        refresh_token: acc.refreshToken,
        grant_type: "refresh_token"
      });

      if (!tokenData.access_token) {
        throw new Error(tokenData.error_description || "Token refresh failed");
      }

      // Fetch drive quota
      const driveData = await getHttps(
        "https://www.googleapis.com/drive/v3/about?fields=storageQuota,user",
        tokenData.access_token
      );

      const quota = driveData.storageQuota || {};
      const limit = Number(quota.limit || 0);
      const usage = Number(quota.usage || 0);

      return {
        name: acc.name,
        email: driveData.user?.emailAddress || acc.email,
        limitGB: limit ? (limit / 1073741824).toFixed(2) : "Unlimited",
        usedGB: (usage / 1073741824).toFixed(2),
        percent: limit ? ((usage / limit) * 100).toFixed(1) : 0
      };
    })
  );

  const data = results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { name: GOOGLE_CREDS.accounts[i].name, email: GOOGLE_CREDS.accounts[i].email, error: r.reason.message }
  );

  res.json(data);
});

export default router;