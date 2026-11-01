# Telauto.md

Site de anunțuri pentru Republica Moldova: telefoane mobile, accesorii, autovehicule și piese auto.
Versiune de test, publicată pe GitHub Pages, cu Supabase pentru bază de date, conturi și poze.

Planul complet se află în `TELAUTO_PLAN_TEHNIC_v1.md` (în folderul părinte).

---

## Ce trebuie instalat (o singură dată)

- **Node.js LTS**: verificare cu `node -v`
- **Git**: verificare cu `git --version`
- **GitHub CLI** (opțional): verificare cu `gh --version`

## Pornirea site-ului pe calculator

Deschide un terminal (PowerShell) în folderul proiectului:

```powershell
cd D:\Flip_Md\telauto
npm install        # doar prima dată sau după ce se schimbă package.json
npm run dev        # pornește site-ul local
```

Deschide în browser adresa afișată, de obicei **http://localhost:5173**. Oprești serverul cu `Ctrl + C`.

### Fișierul `.env`

Site-ul are nevoie de două valori de la Supabase. Copiază `.env.example` în `.env` și completează:

```
VITE_SUPABASE_URL=https://<id-proiect>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

Le găsești în Supabase la **Project Settings → API Keys**.

> ⚠️ **Folosește doar cheia publică** (`publishable` / `anon`). Cheia `secret` / `service_role`
> nu are voie să apară nicăieri în acest proiect. `.env` nu se urcă pe GitHub (este în `.gitignore`).

## Comenzi utile

| Comandă | Ce face |
| --- | --- |
| `npm run dev` | pornește site-ul local, cu reîncărcare automată |
| `npm run build` | verifică codul (TypeScript) și construiește site-ul în folderul `dist/` |
| `npm run preview` | deschide local varianta construită (după `npm run build`) |
| `npm run lint` | caută greșeli frecvente în cod |

## Publicarea pe GitHub Pages

Publicarea se face **automat**: la fiecare `git push` pe ramura `main`, GitHub Actions
(`.github/workflows/deploy.yml`) construiește site-ul și îl publică.

- Adresa site-ului: **https://lupudan.github.io/telauto/**
- Progresul publicării: pe GitHub, tab-ul **Actions** al depozitului.
- Cheile Supabase pentru publicare stau în **Settings → Secrets and variables → Actions**:
  `VITE_SUPABASE_URL` și `VITE_SUPABASE_ANON_KEY`.

Paginile au adrese cu `#/` (de exemplu `.../telauto/#/search`), ca să nu dea eroare la reîncărcare pe GitHub Pages.

## Structura proiectului

```
.github/workflows/deploy.yml   publicarea automată
supabase/migrations/           fișiere SQL pentru baza de date (din faza 2)
src/
  app/          rute, layout, setări generale
  pages/        câte un fișier pentru fiecare pagină
  components/   bucăți reutilizabile (antet, subsol, căutare...)
  features/     funcționalități (cont, anunțuri, mesaje...) – din fazele următoare
  lib/          clientul Supabase, configurația categoriilor, formatări
  i18n/         traduceri: ro.json (română) și ru.json (rusă)
```

**Regulă:** orice text afișat pe site se scrie în `src/i18n/ro.json` și `src/i18n/ru.json`, nu direct în cod.
