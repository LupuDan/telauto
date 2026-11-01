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

## Baza de date (Supabase)

Toată structura bazei de date se află în fișiere SQL numerotate din `supabase/migrations/`
(`0001_...`, `0002_...`). **Nu modifica niciodată un fișier de migrare deja rulat.** Pentru orice schimbare
se creează un fișier nou, cu următorul număr.

| Fișier | Conținut |
| --- | --- |
| `0001_extensions_and_helpers.sql` | extensia `unaccent`, funcții ajutătoare (admin, blocat, IMEI, VIN) |
| `0002_reference_tables.sql` | localități, categorii, mărci de telefoane, mărci și modele auto |
| `0003_profiles.sql` | profiluri (create automat la înregistrare) + telefonul, separat (`profile_private`) |
| `0004_listings.sql` | anunțuri, IMEI/VIN separat (`listing_private`), poze, compatibilități, limita anti-spam |
| `0005_favorites_garage.sql` | favorite și „Garajul meu” |
| `0006_messaging.sql` | conversații, mesaje, limita de 30 mesaje/oră, mesaje suspecte |
| `0007_reports.sql` | raportări, ascunderea automată după 3 raportări |
| `0008_contact_function.sql` | `get_listing_contact()` – telefon, IMEI, VIN doar pentru utilizatori conectați |
| `0009_storage.sql` | bucket-ul de poze `listing-images` și regulile lui |
| `seed.sql` | categoriile, municipiile și raioanele, mărcile de telefoane, mărcile și modelele auto |

### Prima conectare (o singură dată)

Într-o fereastră **PowerShell** obișnuită (din meniul Start):

```powershell
cd D:\Flip_Md\telauto
npx supabase login                                   # se deschide browserul, apeși "Authorize"
npx supabase link --project-ref oswiiqerjujocvdajoss # leagă folderul de proiectul Supabase
```

Dacă `link` cere parola bazei de date, o introduci tu (parola aleasă la crearea proiectului).
Parola nu se scrie în niciun fișier.

### Rularea migrărilor

```powershell
npx supabase db push --dry-run        # arată ce migrări noi s-ar rula, fără să schimbe nimic
npx supabase db push --include-seed   # rulează migrările noi + seed.sql
```

`db push` rulează doar migrările care nu au fost încă rulate, deci comanda se poate repeta fără grijă.

### Testul de securitate

```powershell
npx supabase db query -f supabase/tests/rls_check.sql --linked
```

Sau: Supabase → **SQL Editor** → **New query**, lipești conținutul din `supabase/tests/rls_check.sql`, apeși **Run**.
Rezultatul este un tabel; coloana `ok` trebuie să fie `true` pe fiecare rând. Testul își creează singur
două conturi de test și le șterge la final.

### De ce telefonul și IMEI-ul stau în tabele separate

Regulile RLS din Postgres decid ce **rânduri** poate citi cineva, nu ce **coloane**. De aceea telefonul
(`profile_private`) și IMEI/VIN (`listing_private`) stau în tabele separate, pe care vizitatorii nu le pot citi deloc.
Utilizatorii conectați le primesc doar prin funcția `get_listing_contact()` („Arată telefonul”).

### Erori pe care le trimite baza de date

Site-ul le traduce în mesaje clare pentru utilizator:

| Cod | Când apare |
| --- | --- |
| `LISTING_LIMIT_REACHED` | prea multe anunțuri în 24h (cont nou: 3, cont mai vechi de 7 zile: 20) |
| `LISTING_IMAGE_LIMIT_REACHED` | mai mult de 10 poze la un anunț |
| `MESSAGE_LIMIT_REACHED` | mai mult de 30 de mesaje într-o oră |
| `GARAGE_LIMIT_REACHED` | mai mult de 10 mașini în garaj |
| `OWN_LISTING` | încercare de a scrie la propriul anunț |
| `LOGIN_REQUIRED`, `NOT_ALLOWED` | acțiune care cere cont conectat / cont neblocat |

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
