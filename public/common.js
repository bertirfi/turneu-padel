// Sincronizare cu serverul prin interogare periodica (functioneaza si pe hosting serverless).
// onState se apeleaza doar cand starea s-a schimbat; onStatus(true/false) la schimbarea conexiunii.
function connectLive(onState, onStatus, intervalMs = 2000) {
  let lastRaw = null;
  let online = null;
  async function tick() {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) throw new Error(res.status);
      const raw = await res.text();
      if (raw !== lastRaw) {
        lastRaw = raw;
        onState(JSON.parse(raw));
      }
      if (online !== true) { online = true; onStatus && onStatus(true); }
    } catch {
      if (online !== false) { online = false; onStatus && onStatus(false); }
    }
  }
  tick();
  const timer = setInterval(tick, intervalMs);
  return { refresh: tick, stop: () => clearInterval(timer) };
}

// Parola de administrare: ceruta o singura data, tinuta in browser.
const ADMIN_KEY = "adminPassword";
function adminHeaders() {
  let pw = null;
  try { pw = localStorage.getItem(ADMIN_KEY); } catch {}
  return pw ? { "x-admin-password": pw } : {};
}

async function ensureAdminPassword() {
  for (;;) {
    const res = await fetch("/api/auth", { headers: adminHeaders(), cache: "no-store" });
    if (res.ok) return;
    if (res.status !== 401) throw new Error(`Eroare ${res.status}`);
    const pw = prompt("Parola de administrare:");
    if (pw === null) throw new Error("Fără parolă nu se pot salva modificări.");
    try { localStorage.setItem(ADMIN_KEY, pw); } catch {}
  }
}

async function saveState(state) {
  const res = await fetch("/api/state", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify(state),
  });
  if (res.status === 401) {
    try { localStorage.removeItem(ADMIN_KEY); } catch {}
    await ensureAdminPassword();
    return saveState(state);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Eroare ${res.status}`);
  return body;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
