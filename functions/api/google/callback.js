import { GOOGLE_CREDS } from "../../../google/credentials/google.credentials.js";

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) return new Response("Missing code", { status: 400 });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CREDS.clientId,
      client_secret: GOOGLE_CREDS.clientSecret,
      redirect_uri: GOOGLE_CREDS.redirectUri,
      grant_type: "authorization_code"
    })
  });

  const data = await tokenRes.json();
  return new Response(
    `<h1>Refresh Token:</h1><textarea style="width:100%;height:100px;">${data.refresh_token || "No refresh token returned. Revoke app access first."}</textarea>`,
    { headers: { "Content-Type": "text/html" } }
  );
}