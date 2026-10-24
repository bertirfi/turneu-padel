// Server local (fara dependente) pentru rulare in club, fara internet:
//   node server.js      -> TV: http://IP:3000/   Admin: http://IP:3000/admin
// Pe Vercel acelasi cod ruleaza ca fisiere statice (public/) + functia api/state.js.
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const apiState = require("./api/state");

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png" };

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    if (url.pathname === "/api/state") return apiState(req, res);
    // cleanUrls ca pe Vercel: "/" -> index.html, "/admin" -> admin.html
    let rel = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    if (!path.extname(rel)) rel += ".html";
    const file = path.normalize(path.join(PUBLIC_DIR, rel));
    if (!file.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, buf) => {
      if (err) { res.writeHead(404); return res.end("Nu exista"); }
      res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
      res.end(buf);
    });
  })
  .listen(PORT, () => {
    const ips = Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === "IPv4" && !i.internal).map((i) => i.address);
    console.log(`Turneu padel pornit.\n  TV:    http://localhost:${PORT}/\n  Admin: http://localhost:${PORT}/admin`);
    for (const ip of ips) console.log(`  In retea: http://${ip}:${PORT}/  (TV)   http://${ip}:${PORT}/admin  (laptop)`);
  });
