# Turneu Padel – tablou live

Aplicatie pentru un turneu de padel cu 8 echipe (2 grupe x 4), semifinale si finala.
Ecranul TV se actualizeaza singur la fiecare 2 secunde; administrarea se face de pe laptop.

## Adrese

| Rol | Adresa |
|-----|--------|
| Ecran TV (afisare) | `https://turneu-padel.vercel.app/` |
| Administrare (laptop) | `https://turneu-padel.vercel.app/admin` |

**Pe televizor:** deschide adresa TV in browserul televizorului (sau pe un laptop / Chromecast / Fire Stick legat prin HDMI)
si pune pagina pe ecran complet (`F11`). Nu e nevoie de screen share.

## Cum se foloseste

1. In `/admin`, completeaza numele echipelor si ale jucatorilor (se salveaza automat).
2. Introdu scorul fiecarui meci din grupe (un singur set, ex. `6 – 4`). Clasamentele se recalculeaza instant.
3. Daca doua echipe au acelasi numar de victorii, aplicatia afiseaza **EGAL** si nu decide singura:
   foloseste sagetile din sectiunea „Clasamente si ordine manuala” pentru a stabili ordinea.
4. Cand ambele grupe au clasament final, semifinalele se completeaza automat (1A–2B, 1B–2A), apoi finala.
5. Dupa scorul finalei, campionii apar evidentiati pe TV.
6. Pentru o editie noua: „Sterge toate scorurile” (pastreaza echipele) sau „Reseteaza complet turneul”.

## Rulare locala (fara internet, in club)

```bash
node server.js
```

Afiseaza adresele din reteaua locala pentru TV si admin. Datele se salveaza in `data/tournament.json`.

## Structura

- `public/index.html` – ecranul TV (1920x1080, 16:9)
- `public/admin.html` – panoul de administrare
- `public/tournament.js` – logica turneului (clasamente, tablou, validare), folosita si de server
- `api/state.js` – API-ul (`GET`/`POST /api/state`), ruleaza ca functie Vercel
- `lib/storage.js` – stocare: Upstash Redis pe Vercel, fisier JSON local
- `test.js` – verificare rapida a logicii (`npm test`)
