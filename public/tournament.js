// Logica turneului, folosita atat de server (validare) cat si de browser (clasamente, tablou).
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Tournament = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const GROUPS = ["A", "B"];
  const TEAMS_PER_GROUP = 4;
  // Ordinea meciurilor: fiecare echipa joaca o data cu fiecare, fara doua meciuri consecutive.
  const PAIRINGS = [
    [0, 1],
    [2, 3],
    [0, 2],
    [1, 3],
    [0, 3],
    [1, 2],
  ];

  function defaultState() {
    const teams = {};
    const matches = {};
    for (const g of GROUPS) {
      teams[g] = Array.from({ length: TEAMS_PER_GROUP }, (_, i) => ({
        name: `Echipa ${g}${i + 1}`,
        p1: `Jucator ${i * 2 + 1}`,
        p2: `Jucator ${i * 2 + 2}`,
      }));
      matches[g] = PAIRINGS.map(([home, away]) => ({ home, away, s1: null, s2: null }));
    }
    return {
      version: 1,
      clubName: "NORTH PADEL",
      title: "Turneu Padel",
      teams,
      matches,
      manualOrder: { A: null, B: null },
      semis: [
        { s1: null, s2: null },
        { s1: null, s2: null },
      ],
      final: { s1: null, s2: null },
    };
  }

  function isScore(v) {
    return v === null || (Number.isInteger(v) && v >= 0 && v <= 99);
  }

  function validMatchScores(m) {
    if (!isScore(m.s1) || !isScore(m.s2)) return "Scor invalid";
    if ((m.s1 === null) !== (m.s2 === null)) return "Scorul trebuie completat pentru ambele echipe";
    if (m.s1 !== null && m.s1 === m.s2) return "Un set nu se poate termina la egalitate";
    return null;
  }

  function validateState(s) {
    if (!s || typeof s !== "object") return "Stare invalida";
    if (typeof s.clubName !== "string" || typeof s.title !== "string") return "Titlu invalid";
    for (const g of GROUPS) {
      const teams = s.teams && s.teams[g];
      if (!Array.isArray(teams) || teams.length !== TEAMS_PER_GROUP) return `Grupa ${g}: numar gresit de echipe`;
      for (const t of teams) {
        if (!t || typeof t.name !== "string" || typeof t.p1 !== "string" || typeof t.p2 !== "string")
          return `Grupa ${g}: echipa invalida`;
      }
      const matches = s.matches && s.matches[g];
      if (!Array.isArray(matches) || matches.length !== PAIRINGS.length) return `Grupa ${g}: numar gresit de meciuri`;
      for (let i = 0; i < matches.length; i++) {
        const m = matches[i];
        if (!m || m.home !== PAIRINGS[i][0] || m.away !== PAIRINGS[i][1]) return `Grupa ${g}: meci invalid`;
        const err = validMatchScores(m);
        if (err) return `Grupa ${g}, meciul ${i + 1}: ${err}`;
      }
      const order = s.manualOrder && s.manualOrder[g];
      if (order !== null && order !== undefined) {
        const ok =
          Array.isArray(order) &&
          order.length === TEAMS_PER_GROUP &&
          [...order].sort().join() === [0, 1, 2, 3].join();
        if (!ok) return `Grupa ${g}: ordine manuala invalida`;
      }
    }
    if (!Array.isArray(s.semis) || s.semis.length !== 2) return "Semifinale invalide";
    for (let i = 0; i < 2; i++) {
      const err = validMatchScores(s.semis[i] || {});
      if (err) return `Semifinala ${i + 1}: ${err}`;
    }
    const err = validMatchScores(s.final || {});
    if (err) return `Finala: ${err}`;
    return null;
  }

  function played(m) {
    return m.s1 !== null && m.s2 !== null;
  }

  function winnerIndex(m) {
    if (!played(m)) return null;
    return m.s1 > m.s2 ? 0 : 1;
  }

  // Clasamentul unei grupe. Criteriul unic: numarul de victorii.
  // Egalitatile NU se departajeaza automat; se marcheaza `tied` si se pot ordona manual.
  function standings(state, g) {
    const rows = state.teams[g].map((team, idx) => ({
      idx,
      team,
      played: 0,
      wins: 0,
      losses: 0,
      gamesWon: 0,
      gamesLost: 0,
      tied: false,
    }));
    for (const m of state.matches[g]) {
      if (!played(m)) continue;
      const h = rows[m.home];
      const a = rows[m.away];
      h.played++;
      a.played++;
      h.gamesWon += m.s1;
      h.gamesLost += m.s2;
      a.gamesWon += m.s2;
      a.gamesLost += m.s1;
      if (m.s1 > m.s2) {
        h.wins++;
        a.losses++;
      } else {
        a.wins++;
        h.losses++;
      }
    }
    const manual = state.manualOrder[g];
    const rank = (r) => (manual ? manual.indexOf(r.idx) : r.idx);
    rows.sort((x, y) => y.wins - x.wins || rank(x) - rank(y));
    // Marcheaza egalitatile ramase (fara ordine manuala).
    if (!manual) {
      for (let i = 0; i < rows.length; i++) {
        const same = rows.filter((r) => r.wins === rows[i].wins);
        if (same.length > 1) rows[i].tied = true;
      }
    }
    return rows;
  }

  function groupComplete(state, g) {
    return state.matches[g].every(played);
  }

  // Grupa e "finala" daca toate meciurile sunt jucate si nu exista egalitate neresolvata
  // care sa afecteze locurile 1-2.
  function groupFinal(state, g) {
    if (!groupComplete(state, g)) return false;
    const rows = standings(state, g);
    return !(rows[0].tied || rows[1].tied);
  }

  // Tabloul eliminatoriu. Fiecare slot e {group, idx} sau null daca nu e inca stabilit.
  function bracket(state) {
    const qual = {};
    for (const g of GROUPS) {
      const rows = standings(state, g);
      qual[g] = groupFinal(state, g) ? [{ group: g, idx: rows[0].idx }, { group: g, idx: rows[1].idx }] : [null, null];
    }
    const semis = [
      { label: "1A vs 2B", slots: [qual.A[0], qual.B[1]], score: state.semis[0] },
      { label: "1B vs 2A", slots: [qual.B[0], qual.A[1]], score: state.semis[1] },
    ];
    const finalists = semis.map((sf) => {
      if (!sf.slots[0] || !sf.slots[1]) return null;
      const w = winnerIndex(sf.score);
      return w === null ? null : sf.slots[w];
    });
    const final = { slots: finalists, score: state.final };
    let champion = null;
    if (finalists[0] && finalists[1]) {
      const w = winnerIndex(final.score);
      if (w !== null) champion = finalists[w];
    }
    return { semis, final, champion };
  }

  function teamOf(state, slot) {
    return slot ? state.teams[slot.group][slot.idx] : null;
  }

  function remainingMatches(state) {
    const out = [];
    for (const g of GROUPS) {
      state.matches[g].forEach((m, i) => {
        if (!played(m)) out.push({ stage: `Grupa ${g}`, n: i + 1, a: state.teams[g][m.home], b: state.teams[g][m.away] });
      });
    }
    const br = bracket(state);
    br.semis.forEach((sf, i) => {
      if (!played(sf.score)) out.push({ stage: `Semifinala ${i + 1}`, n: null, a: teamOf(state, sf.slots[0]), b: teamOf(state, sf.slots[1]) });
    });
    if (!played(br.final.score)) out.push({ stage: "Finala", n: null, a: teamOf(state, br.final.slots[0]), b: teamOf(state, br.final.slots[1]) });
    return out;
  }

  return {
    GROUPS,
    TEAMS_PER_GROUP,
    PAIRINGS,
    defaultState,
    validateState,
    standings,
    groupComplete,
    groupFinal,
    bracket,
    teamOf,
    played,
    winnerIndex,
    remainingMatches,
  };
});
