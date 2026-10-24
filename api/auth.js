// GET /api/auth -> 200 daca antetul x-admin-password e corect (sau nu e nevoie de parola), altfel 401.
const { isAuthorized, required } = require("../lib/auth");

module.exports = function handler(req, res) {
  const ok = isAuthorized(req);
  res.statusCode = ok ? 200 : 401;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(ok ? { ok: true, required } : { error: "Parolă greșită" }));
};
