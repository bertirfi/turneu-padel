// Stocarea starii turneului: Upstash Redis (REST, fara dependente) pe Vercel,
// fisier JSON local in lipsa variabilelor de mediu.
const fs = require("fs");
const path = require("path");

const KEY = "padel:tournament";
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const FILE = path.join(process.env.DATA_DIR || path.join(__dirname, "..", "data"), "tournament.json");

async function redis(cmd) {
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  if (!res.ok) throw new Error(`Redis ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

async function load() {
  if (REDIS_URL) {
    const raw = await redis(["GET", KEY]);
    return raw ? JSON.parse(raw) : null;
  }
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return null;
  }
}

async function save(state) {
  const raw = JSON.stringify(state);
  if (REDIS_URL) {
    await redis(["SET", KEY, raw]);
    return;
  }
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE + ".tmp", raw);
  fs.renameSync(FILE + ".tmp", FILE);
}

module.exports = { load, save, usingRedis: Boolean(REDIS_URL) };
