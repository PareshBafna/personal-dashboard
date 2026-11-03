const raw = process.env.MEGA_CREDENTIALS || "";
console.log("length:", raw.length);
try {
  const p = JSON.parse(raw);
  console.log("accounts:", p.accounts?.length);
  console.log("fields:", Object.keys(p.accounts?.[0] || {}));
} catch (e) {
  console.log("parse error:", e.message);
}