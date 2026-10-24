// Parola de administrare vine din ADMIN_PASSWORD. Fara variabila (rulare locala), accesul e liber.
const crypto = require("crypto");

const PASSWORD = process.env.ADMIN_PASSWORD || "";

function isAuthorized(req) {
  if (!PASSWORD) return true;
  const given = String(req.headers["x-admin-password"] || "");
  const a = Buffer.from(given);
  const b = Buffer.from(PASSWORD);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { isAuthorized, required: Boolean(PASSWORD) };
