function load() {
  try {
    const parsed = JSON.parse(process.env.MEGA_CREDENTIALS || "{}");
    return Array.isArray(parsed.accounts) ? parsed : { accounts: [] };
  } catch (err) {
    console.error("MEGA_CREDENTIALS is not valid JSON:", err.message);
    return { accounts: [] };
  }
}

export const MEGA_CREDENTIALS = load();