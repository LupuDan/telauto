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
| `npm test` | rulează testele automate (Vitest): IMEI, VIN, prețuri, ani, câmpurile pe categorii, filtrele, traducerile |
| `npm run db:test` | testul de securitate al bazei de date (vezi mai jos) |

Testele Vitest stau lângă codul testat, în fișiere `*.test.ts` (de ex. `src/lib/validators.test.ts`).
Rulează `npm test` după orice modificare a validărilor sau a câmpurilor din `src/lib/categories.ts`.

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
| `0010_tighten_function_grants.sql` | funcțiile interne (triggere) nu pot fi apelate din site |
| `0011_delete_account.sql` | `delete_my_account()` – ștergerea propriului cont |
| `0012_listing_drafts_phone_models.sql` | ciorne, `publish_listing()`, lista de modele de telefoane |
| `0013_search.sql` | `search_listings()` – căutarea cu filtre, sortare și pagini; `get_listing_badges()` |
| `0014_messaging_views.sql` | `get_my_conversations()` și `count_unread_messages()` pentru paginile de mesaje |
| `0015_admin.sql` | funcțiile panoului de administrare (`admin_*`); adminii nu pot fi blocați |
| `0016_fix_reports_policy_recursion.sql` | repară raportarea (bucla dintre regulile `reports` și `messages`) |
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

> ⚠️ Dacă `seed.sql` a fost modificat, `db push --include-seed` doar îi actualizează amprenta și **nu** îl rulează din nou.
> Rulează-l direct cu `npm run db:seed`. Fișierul se poate rula de câte ori vrei: rândurile existente rămân neschimbate.

### Anunțuri: cum se publică (faza 4)

1. Anunțul se creează ca **ciornă** (`status = draft`), vizibilă doar autorului. Aici se verifică limita anti-spam.
2. Se salvează IMEI/VIN (opțional), compatibilitățile (la piese) și pozele.
3. Funcția `publish_listing()` verifică **pe server** numărul minim de poze (telefoane 3, accesorii 1,
   autovehicule 5, piese 1) și, la piese, cel puțin o compatibilitate. Apoi anunțul devine `active` pentru 30 de zile.

Dacă publicarea se întrerupe (de ex. cade internetul), ciorna rămâne în **Contul meu → Anunțurile mele → Ciorne**
și poate fi finalizată de acolo. Câmpurile fiecărei categorii sunt definite în `src/lib/categories.ts`.

### Căutarea (faza 5)

Toate listele de anunțuri (prima pagină, categorie, căutare, profil public, „anunțuri asemănătoare”)
folosesc funcția `search_listings()` din `0013_search.sql`:

- arată doar anunțurile **active, neexpirate**, ale utilizatorilor neblocați (regula e scrisă în funcție);
- textul se caută în titlu și descriere, fără diacritice și după începutul cuvântului („masina” găsește „Mașină”, „iphon” găsește „iPhone”);
- filtrele specifice categoriei se generează din `src/lib/categories.ts` (proprietatea `filter` a fiecărui câmp);
- prețurile în EUR și MDL se compară cu un curs aproximativ **1 € = 20 MDL** (funcția `price_in_mdl()`;
  pentru alt curs se face o migrare nouă care o redefinește);
- filtrele stau în adresă (de ex. `#/c/autovehicule?f.fuel=diesel&f.year.min=2010`), deci o căutare se poate trimite ca link.

Pe pagina anunțului, telefonul, IMEI-ul și VIN-ul vin doar din `get_listing_contact()`, care refuză vizitatorii neconectați.
Etichetele „IMEI indicat” / „VIN indicat” arată doar *că* există valoarea, nu valoarea.

### Favorite și Garajul meu (faza 6)

- **Favorite** (`favorites`): butonul ♡ pe carduri și „Salvează” pe pagina anunțului. Fiecare utilizator vede doar
  favoritele lui. Anunțurile vândute, expirate sau ascunse rămân în listă ca „indisponibile”, ca să poată fi eliminate.
  La ștergerea unui anunț dispare automat și din favorite.
- **Garajul meu** (`user_vehicles`): maximum 10 mașini (marcă, model opțional, an, nume opțional), vizibile doar proprietarului.
- **„Doar piese pentru mașina mea”** apare pe pagina Piese auto pentru utilizatorii cu mașini în garaj și folosește
  filtrul de compatibilitate din `search_listings()` (`cmake`, `cmodel`, `cyear` în adresă).
  O piesă marcată „toate modelele” apare pentru orice model al mărcii; o mașină din garaj fără model vede piesele tuturor modelelor.

### Mesagerie (faza 7)

- „Scrie mesaj” apelează `start_conversation()`: o singură conversație pe cumpărător și anunț; nu poți scrie la propriul anunț.
- Mesajele noi și bifele „citit” (✓✓) ajung **în timp real** prin Supabase Realtime, care aplică aceleași reguli RLS:
  doar cei doi participanți primesc mesajele. Ca rezervă, site-ul recitește mesajele la 30 de secunde.
- Lista conversațiilor și numărul de necitite din antet vin din `get_my_conversations()` / `count_unread_messages()`
  (doar conversațiile proprii). Conversația rămâne și după ce anunțul e vândut sau șters.
- Mesajele cu link-uri sau cuvinte ca „avans”, „card”, „curier”, „предоплата” primesc `is_flagged = true` (în baza de date);
  destinatarul vede deasupra lor un avertisment. Limita: 30 de mesaje pe oră (`MESSAGE_LIMIT_REACHED`).

### Raportări și administrare (faza 8)

- „Raportează” (pe pagina anunțului și sub mesajele primite) creează un rând în `reports`.
  Un utilizator raportează același lucru o singură dată. **3 raportări deschise de la persoane diferite**
  ascund automat anunțul (`hidden`) până îl verifică adminul.
- Panoul **`#/admin`** are taburile Raportări, Mesaje marcate, Anunțuri ascunse, Utilizatori, Mărci și modele.
  Pagina se vede doar pentru `role = admin`, dar adevărata protecție e în baza de date: fiecare funcție `admin_*`
  verifică `is_admin()`, iar regulile RLS refuză restul.
- Un utilizator **blocat** nu poate publica, scrie sau raporta, iar anunțurile lui dispar din căutare.
  Adminii nu pot fi blocați și nu se pot bloca singuri.
- Mărcile și modelele se pot adăuga și redenumi. Ștergerea merge doar dacă nu sunt folosite în anunțuri,
  compatibilități sau garaje (`admin_delete_reference()`).

#### Cum îți dai (sau iei) rolul de admin

Rolul **nu** se poate schimba din site, nici de un admin. Se schimbă doar din Supabase:

1. Deschide [supabase.com/dashboard](https://supabase.com/dashboard) → proiectul **telauto** → **SQL Editor** → **New query**.
2. Lipește comanda de mai jos, cu emailul contului tău de pe site, și apasă **Run**:

   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where lower(email) = lower('emailul-tau@exemplu.md'));
   ```

3. Reîncarcă site-ul (Ctrl + F5). În antet apare butonul **Admin**.

Pentru a lua rolul înapoi, aceeași comandă cu `role = 'user'`.

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

## Conturi și emailuri (Supabase Auth)

Setările de autentificare stau în `supabase/config.toml` (secțiunea `[auth]`) și se trimit în Supabase cu:

```powershell
npx supabase config diff    # arată ce s-ar schimba (verifică întotdeauna înainte!)
npx supabase config push    # trimite doar setările scrise în fișier
```

Setări importante:
- **Site URL**: `https://lupudan.github.io/telauto/`. **Redirect URLs**: adresa GitHub Pages și `http://localhost:5173`.
- Confirmarea emailului este **obligatorie**. Parola are minimum 8 caractere.
- Link-urile din emailuri se întorc pe site ca `?code=...` (fluxul PKCE) și sunt preluate de `src/features/auth/authRedirect.ts`.

### Serviciul de email (SMTP prin Brevo)

Serverul de email gratuit al Supabase trimite doar câteva emailuri pe oră și **doar către membrii echipei proiectului**.
Ca prietenii să-și poată face cont, emailurile se trimit prin **Brevo** (gratuit, 300 emailuri/zi):

1. Cont pe [brevo.com](https://www.brevo.com) → **Senders** → adaugă și confirmă adresa expeditorului.
2. **SMTP & API → SMTP**: notează **Login** și generează o **SMTP key** (este o parolă: nu o pune în cod, în chat sau pe GitHub).
3. Supabase → **Authentication → Emails → SMTP Settings** → *Enable custom SMTP*:
   host `smtp-relay.brevo.com`, port `587`, username = Login, password = SMTP key,
   sender email = adresa confirmată în Brevo, sender name `Telauto.md`.

Cheia SMTP stă **doar** în Supabase. Cu SMTP propriu, Supabase permite și emailurile în română/rusă din
`supabase/templates/` (secțiunile `[auth.email.template.*]` din `config.toml`).

> ℹ️ Link-ul de **resetare a parolei** funcționează doar în browserul în care a fost cerut (limitare PKCE).
> Link-ul de **confirmare a contului** funcționează de oriunde: dacă e deschis pe alt dispozitiv,
> contul este confirmat și utilizatorul doar trebuie să intre în cont.

### Tipurile TypeScript ale bazei de date

După orice migrare nouă:

```powershell
npm run gen:types    # regenerează src/lib/database.types.ts
```

## Structura proiectului

```
.github/workflows/deploy.yml   publicarea automată
supabase/migrations/           fișiere SQL pentru baza de date (din faza 2)
src/
  app/          rute, layout, setări generale
  pages/        câte un fișier pentru fiecare pagină
  components/   bucăți reutilizabile (antet, subsol, căutare...)
  features/     funcționalități: auth, profile, listings, listingPage, search, favorites,
                garage, messages, reports, admin, reference
  lib/          clientul Supabase, configurația categoriilor, validări, formatări, paginile statice
  i18n/         traduceri: ro.json (română) și ru.json (rusă), inclusiv textele paginilor statice
public/         favicon.svg, og-image.png (imaginea din previzualizarea linkului)
supabase/tests/ testul de securitate rls_check.sql
```

**Regulă:** orice text afișat pe site se scrie în `src/i18n/ro.json` și `src/i18n/ru.json`, nu direct în cod.

## Pagini statice, cookie-uri, viteză (faza 9)

- `#/p/terms`, `#/p/privacy`, `#/p/safety`, `#/p/help`, `#/p/contact` – textele stau în `src/i18n/*.json` la `pages.*`.
  **Termenii și Confidențialitatea sunt provizorii** și trebuie verificate de un jurist înainte de lansarea publică.
- Bannerul de cookie-uri (`src/components/CookieBanner.tsx`) doar informează: site-ul nu folosește cookie-uri de reclamă
  sau urmărire, ci doar memoria browserului (sesiunea, limba, ciorna, închiderea bannerului).
- Paginile rar folosite (formularul, contul, mesajele, adminul, paginile statice) se descarcă doar când sunt deschise
  (`src/app/App.tsx`), ca prima pagină să se încarce repede pe telefon.
- `index.html` conține descrierea implicită și etichetele Open Graph pentru previzualizarea linkului.

## ✅ Lista de verificare înainte de a trimite linkul prietenilor

Bifează fiecare punct pe **telefon** (Chrome/Safari) și pe **calculator**. Deschide https://lupudan.github.io/telauto/ și apasă Ctrl + F5.

**Tehnic (le rulează oricine are proiectul):**
- [ ] `npm test` – toate testele trec
- [ ] `npm run lint` și `npm run build` – fără erori
- [ ] `npm run db:test` – coloana `ok` este `true` pe toate rândurile
- [ ] GitHub → Actions: ultima publicare are bifa verde

**Conturi și emailuri:**
- [ ] Un prieten (email care NU e în echipa Supabase) își face cont și **primește emailul de confirmare**, în limba aleasă
- [ ] Linkul din email confirmă contul; intrarea în cont merge
- [ ] „Ai uitat parola?” trimite email, iar parola nouă funcționează (în același browser)
- [ ] Setări: schimb numele, localitatea, telefonul, limba; schimb parola

**Anunțuri:**
- [ ] Public câte un anunț în fiecare categorie (telefon 3 poze, mașină 5 poze, piesă cu compatibilitate)
- [ ] Pozele se micșorează și se pot reordona; IMEI/VIN greșit este refuzat
- [ ] Al 4-lea anunț din aceeași zi pe un cont nou este refuzat cu mesaj clar
- [ ] Editez, marchez „Vândut”, reactivez, șterg un anunț

**Căutare și pagina anunțului:**
- [ ] Prima pagină arată anunțurile noi; căutarea fără diacritice merge
- [ ] Filtrele (marcă, preț, an, kilometraj...) și sortarea dau rezultate corecte; pe telefon se deschide panoul „Filtre”
- [ ] Fără cont **nu** se vede telefonul; cu alt cont, „Arată telefonul” îl arată
- [ ] Galeria merge (glisare pe telefon, ecran mare)

**Favorite, garaj, mesaje:**
- [ ] ♡ salvează; anunțul apare în Contul meu → Favorite
- [ ] O mașină din garaj filtrează corect piesele compatibile
- [ ] Două conturi în două browsere își scriu și văd mesajele imediat; ✉ arată necititele
- [ ] Mesajul cu „avans pe card” arată avertismentul

**Raportări și admin:**
- [ ] „Raportează” trimite raportarea; apare în `#/admin`
- [ ] Adminul ascunde un anunț și blochează / deblochează un utilizator
- [ ] Un cont obișnuit primește „Nu ai acces” la `#/admin`

**Restul:**
- [ ] Bannerul de cookie-uri apare o singură dată; paginile din subsol se deschid
- [ ] Totul este tradus când comut RO / RU
- [ ] Previzualizarea linkului în Viber/Telegram arată imaginea Telauto.md

Când toate sunt bifate, trimite linkul prietenilor și roagă-i să-ți scrie ce nu merge (pagina Contact sau „Raportează”).
