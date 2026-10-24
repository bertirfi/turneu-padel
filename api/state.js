// GET  /api/state -> starea curenta a turneului
// POST /api/state -> inlocuieste starea (validata). Folosit atat de Vercel cat si de server.js.
const storage = require("../lib/storage");
const { isAuthorized } = require("../lib/auth");
const { defaultState, validateState } = require("../public/tournament");

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function readBody(req) {
  if (req.body !== undefined) return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 1e6) reject(new Error("Corp prea mare"));
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const state = (await storage.load()) || defaultState();
      return json(res, 200, state);
    }
    if (req.method === "POST") {
      if (!isAuthorized(req)) return json(res, 401, { error: "Parolă greșită" });
      let body = await readBody(req);
      if (typeof body === "string") body = JSON.parse(body);
      const error = validateState(body);
      if (error) return json(res, 400, { error });
      body.updatedAt = Date.now();
      await storage.save(body);
      return json(res, 200, { ok: true });
    }
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { error: "Metoda nepermisa" });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
};
