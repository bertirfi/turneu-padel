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

async function saveState(state) {
  const res = await fetch("/api/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Eroare ${res.status}`);
  return body;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
