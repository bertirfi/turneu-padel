// Verificare rapida a logicii turneului: node test.js
const assert = require("assert");
const T = require("./public/tournament");

const s = T.defaultState();
assert.strictEqual(T.validateState(s), null);

// Grupa A: A1 castiga tot, A2 locul 2, A3 si A4 la egalitate (0 victorii fiecare... facem 1-1)
const A = s.matches.A; // perechi: (0,1),(2,3),(0,2),(1,3),(0,3),(1,2)
A[0].s1 = 6; A[0].s2 = 3; // A1 > A2
A[1].s1 = 6; A[1].s2 = 4; // A3 > A4
A[2].s1 = 6; A[2].s2 = 2; // A1 > A3
A[3].s1 = 6; A[3].s2 = 1; // A2 > A4
A[4].s1 = 7; A[4].s2 = 5; // A1 > A4
A[5].s1 = 6; A[5].s2 = 4; // A2 > A3
let rows = T.standings(s, "A");
assert.deepStrictEqual(rows.map((r) => r.wins), [3, 2, 1, 0]);
assert.ok(T.groupFinal(s, "A"));
assert.strictEqual(rows[0].gamesWon, 19);

// Grupa B: B1, B2, B3 cu cate 2 victorii -> departajare pe game-averaj
const B = s.matches.B;
B[0].s1 = 6; B[0].s2 = 4; // B1 > B2
B[1].s1 = 6; B[1].s2 = 4; // B3 > B4
B[2].s1 = 4; B[2].s2 = 6; // B3 > B1
B[3].s1 = 6; B[3].s2 = 0; // B2 > B4
B[4].s1 = 6; B[4].s2 = 0; // B1 > B4
B[5].s1 = 6; B[5].s2 = 0; // B2 > B3
rows = T.standings(s, "B");
assert.deepStrictEqual(rows.map((r) => r.wins), [2, 2, 2, 0]);
// game-averaj: B1 = 16-10 = +6, B2 = 16-6 = +10, B3 = 12-14 = -2
assert.deepStrictEqual(rows.map((r) => [r.idx, r.diff]), [[1, 10], [0, 6], [2, -2], [3, -14]]);
assert.ok(rows.every((r) => !r.tied));
assert.ok(T.groupFinal(s, "B"));
let br = T.bracket(s);
assert.deepStrictEqual(br.semis[0].slots, [{ group: "A", idx: 0 }, { group: "B", idx: 0 }]);
assert.deepStrictEqual(br.semis[1].slots, [{ group: "B", idx: 1 }, { group: "A", idx: 1 }]);

// Egalitate si la victorii si la game-averaj: B1 si B2 -> ordine manuala obligatorie
B[0].s1 = 6; B[0].s2 = 2; // B1 > B2: B1 = 16-8 = +8, B2 = 14-6 = +8
rows = T.standings(s, "B");
assert.deepStrictEqual(rows.map((r) => r.diff), [8, 8, -2, -14]);
assert.ok(rows[0].tied && rows[1].tied && !rows[2].tied && !rows[3].tied);
assert.ok(!T.groupFinal(s, "B"));
assert.strictEqual(T.bracket(s).semis[0].slots[1], null);

// Ordine manuala: B2, B1, B3, B4
s.manualOrder.B = [1, 0, 2, 3];
assert.strictEqual(T.validateState(s), null);
rows = T.standings(s, "B");
assert.deepStrictEqual(rows.map((r) => r.idx), [1, 0, 2, 3]);
assert.ok(T.groupFinal(s, "B"));
br = T.bracket(s);
assert.deepStrictEqual(br.semis[0].slots, [{ group: "A", idx: 0 }, { group: "B", idx: 0 }]);
assert.deepStrictEqual(br.semis[1].slots, [{ group: "B", idx: 1 }, { group: "A", idx: 1 }]);

// Semifinale si finala
s.semis[0] = { s1: 6, s2: 3 }; // A1
s.semis[1] = { s1: 2, s2: 6 }; // A2
assert.deepStrictEqual(T.bracket(s).final.slots, [{ group: "A", idx: 0 }, { group: "A", idx: 1 }]);
s.final = { s1: 7, s2: 6 };
assert.deepStrictEqual(T.bracket(s).champion, { group: "A", idx: 0 });
// Ordinea manuala nu poate rasturna criteriile automate (victorii, apoi game-averaj)
s.manualOrder.B = [3, 2, 1, 0];
assert.deepStrictEqual(T.standings(s, "B").map((r) => r.idx), [1, 0, 2, 3]);
s.manualOrder.B = null;
assert.strictEqual(T.remainingMatches(s).length, 0);

// Validare: set la egalitate respins
const bad = T.defaultState();
bad.matches.A[0] = { home: 0, away: 1, s1: 6, s2: 6 };
assert.ok(/egalitate/.test(T.validateState(bad)));

console.log("OK: toate verificarile au trecut");
