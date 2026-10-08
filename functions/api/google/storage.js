import { GOOGLE_CREDS } from "./google.credentials.js";

export async function onRequestGet() {
  const results = await Promise.allSettled(
    GOOGLE_CREDS.accounts.map(async (acc) => {
      if (!acc.refreshToken || acc.refreshToken.startsWith("REFRESH_TOKEN_")) {
        return { name: acc.name, email: acc.email, error: "No refresh token set" };
      }

      // 1. Refresh access token via fetch
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: GOOGLE_CREDS.clientId,
          client_secret: GOOGLE_CREDS.clientSecret,
          refresh_token: acc.refreshToken,
          grant_type: "refresh_token"
        })
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        throw new Error(tokenData.error_description || "Token refresh failed");
      }

      // 2. Fetch Drive Quota
      const driveRes = await fetch(
        "https://www.googleapis.com/drive/v3/about?fields=storageQuota,user",
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        }
      );
      const driveData = await driveRes.json();
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

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
}