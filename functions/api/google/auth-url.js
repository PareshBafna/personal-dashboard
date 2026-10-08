import { GOOGLE_CREDS } from "./google.credentials.js";

export async function onRequestGet() {
  const scopes = [
    "https://www.googleapis.com/auth/drive.metadata.readonly",
    "https://www.googleapis.com/auth/userinfo.email"
  ].join(" ");

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
      client_id: GOOGLE_CREDS.clientId,
      redirect_uri: GOOGLE_CREDS.redirectUri,
      response_type: "code",
      scope: scopes,
      access_type: "offline",
      prompt: "consent"
    }).toString();

  return new Response(JSON.stringify({ url: authUrl }), {
    headers: { "Content-Type": "application/json" }
  });
}