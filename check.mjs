import "dotenv/config";

const k = process.env.NOTION_API_KEY || "";
console.log("length:", k.length);
console.log("starts:", k.slice(0, 4));
console.log("has quote/space:", /[\s'"]/.test(k));

const r = await fetch("https://api.notion.com/v1/users/me", {
  headers: { Authorization: "Bearer " + k, "Notion-Version": "2022-06-28" }
});
console.log("status:", r.status);