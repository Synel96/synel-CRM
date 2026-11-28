# Synel CRM

Újrahasznosítható CRM starter kit: egy kódbázis, amit ügyfelenként egyetlen
konfigurációs fájllal szabsz személyre (márka, nyelv, pénznem, modulok,
pipeline, egyedi mezők).

[Vike](https://vike.dev) + React 19, **kliensoldali renderelés (CSR, SSR nélkül)**,
Tailwind v4, [shadcn](https://ui.shadcn.com) UI-elemek.

## Funkciók

- **Áttekintés:** KPI-k (pipeline érték, súlyozott érték, e havi nyerés,
  lejárt feladatok), pipeline fázisonként, közelgő feladatok, legutóbbi
  tevékenységek
- **Kapcsolatok:** lista, ékezetfüggetlen keresés, címkeszűrő, szerkesztés,
  tevékenységnapló (hívás, e-mail, találkozó, jegyzet)
- **Cégek:** kapcsolódó kapcsolatokkal és üzletekkel
- **Üzletek:** kanban tábla; a kártyák húzhatók, vagy listából léptethetők
  (érintőképernyőn és billentyűzettel is használható)
- **Feladatok:** csoportosítva (lejárt, ma, később, határidő nélkül, kész),
  gyors felvétellel
- **Beállítások:** az aktív konfiguráció áttekintése, JSON export/import,
  mintaadatok visszaállítása
- Sötét mód, mobilnézet, magyar és angol felület

## Állítható modulok

Minden ügyfélnél a `crm.config.ts`-ben dől el, mi látszik.

### Mindig bekapcsolva

| Menüpont        | Útvonal     | Mit tud                                                                                                           |
| --------------- | ----------- | ----------------------------------------------------------------------------------------------------------------- |
| **Áttekintés**  | `/`         | KPI-k, pipeline fázisonként, közelgő feladatok, legutóbbi tevékenységek, bővítmény-widgetek                       |
| **Kapcsolatok** | `/contacts` | Személyek, keresés, címkeszűrő, cégekhez kapcsolás, tevékenységnapló, bővítmény-panelek                           |
| **Beállítások** | `/settings` | Az aktív konfiguráció (modulok, pipeline, egyedi mezők, képtárhely, bővítmények), JSON export/import, mintaadatok |

### Kapcsolható modulok – `modules`

| Modul         | Kulcs       | Alapból | Mit tud                                                          |
| ------------- | ----------- | ------- | ---------------------------------------------------------------- |
| **Cégek**     | `companies` | be      | Cégek a kapcsolataikkal és üzleteikkel, tevékenységnapló         |
| **Üzletek**   | `deals`     | be      | Kanban pipeline; húzás vagy listás léptetés; értékek fázisonként |
| **Feladatok** | `tasks`     | be      | Határidő, prioritás, csoportosítás (lejárt / ma / később / kész) |

```ts
modules: { companies: false, deals: true, tasks: true },
```

Kikapcsolt modul eltűnik a menüből, az áttekintésről és az űrlapokról
(pl. kikapcsolt Cégeknél a kapcsolatoknál sincs „Cég” mező).

### Bővítmények – `addons`

| Bővítmény          | Kulcs          | Menüpontok                       | Mit tud                                                                                                         |
| ------------------ | -------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Ingatlan**       | `real-estate`  | Ingatlanok, Keresési igények     | Ingatlanok kártyás nézetben, fotók (Cloudinary), tulajdonos, vevői keresések, automatikus párosítás, KPI-widget |
| **Szolgáltatások** | `services`     | Szolgáltatások (Tartalomkezelés) | Név, rövid/részletes leírás, ár + megjegyzés („-tól”, „/hó”), kép, URL, SEO, publikálás, sorrend, kiemelés      |
| **Vélemények**     | `testimonials` | Vélemények (Tartalomkezelés)     | Név, cég, 1–5 csillag, szöveg, forrás, kép; kapcsolathoz és szolgáltatáshoz köthető; átlagértékelés             |

```ts
addons: ["real-estate", "services", "testimonials"],
```

Részletek: [`modules/real-estate/README.md`](modules/real-estate/README.md).
Új bővítmény készítése: lásd [Bővítmények](#bővítmények-add-onok).

### Egyéb beállítások modulonként

| Beállítás                     | Mit szab testre                                                                                | Példa                                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `labels`                      | Bármelyik menüpont és menücsoport neve (mag és bővítmény is)                                   | `{ deals: "Ügyletek", properties: "Kínálat" }`       |
| `pipeline`                    | Az Üzletek fázisai, esélyszázalékkal; `kind: "won"` / `"lost"` a lezárt fázisokhoz             | `{ id: "offer", label: "Ajánlat", probability: 60 }` |
| `contactTags`                 | A kapcsolatok választható címkéi                                                               | `["VIP", "Partner"]`                                 |
| `customFields`                | Egyedi mezők: `contact`, `company`, `deal`, `task`, bővítménynél pl. `property`, `buyerSearch` | lásd [Egyedi mezők](#egyedi-mezők)                   |
| `media`                       | A képek Cloudinary-mappája                                                                     | `{ folder: "ugyfel-neve" }`                          |
| `brand`, `locale`, `currency` | Márkanév és -szín, nyelv (`hu` / `en`), pénznem                                                | `{ name: "Ügyfél CRM" }`, `"hu"`, `"HUF"`            |

## Indítás

```sh
npm install
npm run dev
```

Első induláskor mintaadatokkal tölti fel magát (`seedDemoData: true`). Demó
módban egy utólag bekapcsolt bővítmény is mintaadatot kap; éles ügyfélnél
állítsd `false`-ra, ekkor a bővítmény üresen indul.

## Új ügyfél beállítása

Minden ügyfél **saját CRM-repót** kap, ami ebből a repóból indul, és a közös
git-előzményeket megtartja. A weboldal ettől külön repó és külön
Vercel-projekt marad:

```
synel-crm      ← a „gyári” CRM (mag + közös bővítmények)
   │  git merge (frissítések)
   ▼
ugyfel-crm     ← ügyfélrepó: csak config, preset, saját bővítmény → app.ugyfel.hu
ugyfel-web     ← a weboldal (külön repó)                          → ugyfel.hu
```

> Ne a GitHub _Use this template_ gombjával hozd létre: az előzmények nélkül
> másol, és utána nem tudod behúzni a `synel-crm` frissítéseit. A CRM-et a
> weboldal repójába se tedd: a két projekt összenőne (közös build, közös
> hibák), és a frissítés is bonyolult lenne.

1. **Ügyfélrepó létrehozása.** Hozz létre a GitHubon egy üres repót
   (pl. `ugyfel-crm`), majd:

   ```sh
   git clone https://github.com/Synel96/synel-crm ugyfel-crm
   cd ugyfel-crm
   git remote rename origin upstream   # a „gyári” CRM, innen jönnek a frissítések
   git remote add origin https://github.com/Synel96/ugyfel-crm
   git push -u origin main
   ```

   Vercelen új projekt ebből a repóból, domain: `app.ugyfel.hu`. A DNS-ben:
   `app` CNAME → `cname.vercel-dns.com`.

2. **`crm.config.ts`:** ügyfelenként szinte csak ezt a fájlt kell módosítani
   (lásd [Testreszabás](#testreszabás-mit-hol-változtass)).

   | Beállítás      | Mire jó                                                       |
   | -------------- | ------------------------------------------------------------- |
   | `brand`        | Név és kiemelőszín (`accentColor`, bármilyen CSS-szín)        |
   | `locale`       | `"hu"` vagy `"en"`                                            |
   | `currency`     | ISO pénznemkód, pl. `"HUF"`, `"EUR"`                          |
   | `storageKey`   | Egyedi kulcs a böngészős tároláshoz (ügyfelenként más legyen) |
   | `modules`      | Cégek / üzletek / feladatok ki-be kapcsolása                  |
   | `addons`       | Bővítmények bekapcsolása, pl. `["real-estate"]` (lásd lent)   |
   | `labels`       | Menüpontok átnevezése, pl. `{ deals: "Projektek" }`           |
   | `pipeline`     | Fázisok esélyszázalékkal, `kind: "won"` / `"lost"` zárással   |
   | `contactTags`  | Választható címkék a kapcsolatokhoz                           |
   | `customFields` | Egyedi mezők entitásonként (lásd lent)                        |

   A config induláskor validálódik (zod). Hibás beállításnál érthető
   hibaüzenetet kapsz (`src/crm/config.ts`).

3. **Logó:** cseréld le az `assets/logo.svg`-t.
4. **Preset:** iparági kiindulópontok a `presets/` mappában. Egy preset
   használata:

   ```ts
   // crm.config.ts
   export { default } from "./presets/real-estate";
   ```

### Testreszabás: mit hol változtass

Szinte minden ügyfélnél kell egy kis igazítás. Hogy a frissítések később is
ütközés nélkül behúzhatók legyenek, ebben a sorrendben próbálkozz:

| Szint                               | Hol                                             | Mire                                                                       | Példa                                                                 |
| ----------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **1. Config** (az esetek többsége)  | `crm.config.ts`                                 | nevek, pipeline, egyedi mezők, címkék, márka, modulok és bővítmények ki-be | „Üzletek” → „Ügyletek”, „Energetikai tanúsítvány” mező az ingatlanhoz |
| **2. Bővítmény-beállítás**          | `crm.config.ts` + a bővítmény a `synel-crm`-ben | ha egy közös bővítmény ügyfelenként másképp működjön                       | más státuszlista az ingatlanoknál                                     |
| **3. Ügyfélspecifikus kód** (ritka) | `modules/ugyfel-*/` az ügyfélrepóban            | ami tényleg csak ennek az ügyfélnek kell                                   | egy egyedi riport vagy integráció                                     |

**Aranyszabály:** az ügyfélrepóban **ne módosítsd a magot** (`src/crm/`,
`components/crm/`, `pages/`) és a közös bővítményeket (`modules/real-estate/`
stb.). Ha ott kell változtatni, javítsd a `synel-crm`-ben, és onnan húzd be
az ügyfélhez. Így a javítások és az új funkciók minden ügyfélhez eljutnak,
és nem lesz sok, egymástól elágazott CRM-ed.

### Egyedi mezők

```ts
customFields: {
  deal: [
    { key: "source", label: "Forrás", type: "select",
      options: ["Weboldal", "Ajánlás"], required: true, showInList: true },
    { key: "budget", label: "Keret", type: "money" },
  ],
}
```

- Típusok: `text`, `textarea`, `number`, `money`, `date`, `email`, `phone`,
  `url`, `select`, `boolean`
- `showInList: true` esetén oszlopként (listanézet) vagy címkeként (kanban)
  is megjelenik.
- Az űrlapok, a validáció és a megjelenítés automatikusan generálódik.
  A felülethez nem kell kódot írni.

## Bővítmények (add-onok)

Iparág-specifikus funkciók külön, hozzáadható bővítményként készülnek, nem
a CRM magjában. Egy bővítmény egy önálló mappa a `modules/` alatt: saját
adatokkal, oldalakkal, menüpontokkal, áttekintő widgettel és kapcsolatpanellel.

| Bővítmény      | Mappa                   | Leírás                                                    |
| -------------- | ----------------------- | --------------------------------------------------------- |
| `real-estate`  | `modules/real-estate/`  | Ingatlanok, fotók, vevői keresések, automatikus párosítás |
| `services`     | `modules/services/`     | Szolgáltatások (tartalommotor)                            |
| `testimonials` | `modules/testimonials/` | Vélemények (tartalommotor)                                |

**Bekapcsolás:** `crm.config.ts` → `addons: ["real-estate"]`.

**Üzlet és tartalomkezelés külön:** a menü csoportokra bomlik: _Áttekintés_,
**Üzlet** (kapcsolatok, cégek, üzletek, feladatok és az üzleti bővítmények,
pl. ingatlanok), **Tartalomkezelés** (a `group: "content"` bővítmények, pl.
blog, galéria) és **Rendszer** (beállítások). Egy csoport csak akkor jelenik
meg, ha van benne menüpont. Az Áttekintés ugyanígy bontja a widgeteket; a
csoportcímek ott csak akkor látszanak, ha van tartalomkezelő rész is. A
csoportnevek átírhatók, pl. `labels: { "group.content": "Weboldal" }`.

### Tartalmi bővítmények (közös tartalommotor)

A weboldal tartalmát kezelő bővítmények (szolgáltatások, vélemények, és a
tervezett projektek, blog, galéria) egy közös motorra épülnek
(`src/crm/content/`, `components/crm/content/`). Minden elem kapja:

- **státusz:** vázlat vagy publikált; a weboldal csak a publikáltat kapja meg.
  A `publishedAt` az első publikáláskor áll be. A listában egy kattintással
  publikálható.
- **sorrend** (nyilakkal) és **kiemelt** jelölés;
- **képek** (Cloudinary, típusonként beállítható darabszám);
- saját aloldallal rendelkező típusnál **URL (slug)**, ami a címből készül,
  magyar ékezetekkel is (`Logótervezés & arculat` → `logotervezes-arculat`),
  típuson belül egyedi, és a cím módosításakor **nem változik**, hogy a
  weboldalon ne törjenek el a linkek. Mellette **SEO-cím és -leírás**.

**Új tartalomtípus** egy leírófájl és egy oldal:

```tsx
// modules/projektek/index.tsx
export const projectsDef: ContentTypeDef = {
  addonId: "projects",
  entity: "project",
  icon: FolderIcon,
  labels: () => ({ plural: "Projektek", singular: "projekt", title: "Cím" }),
  hasPage: true,
  maxImages: 12,
  fields: (core) => [
    /* a típus saját mezői */
  ],
};
export default defineContentAddon(projectsDef);

// modules/projektek/pages/projects/+Page.tsx → <ContentListPage def={projectsDef} />
// modules/projektek/pages/projects/+route.ts → export default "/projects";
```

A lista, a szerkesztő, a publikálás, a képek, a tevékenységnapló és az
áttekintő kártya automatikusan elkészül. Mintának lásd a `modules/services/`
(egyszerű) és a `modules/testimonials/` (kapcsolatpanellel, csillagokkal)
mappát.

**Új bővítmény készítése:**

1. Hozz létre egy mappát: `modules/<név>/`.
2. Az `index.ts` exportáljon egy `defineAddon({...})` objektumot
   (interfész és leírás: `src/crm/addons.ts`). Lehetséges részei:
   - `group`: `"business"` (alapértelmezés) vagy `"content"` – az üzleti vagy
     a tartalomkezelő részbe kerül (lásd lent);
   - `nav`: menüpontok;
   - `emptyData`, `normalize`, `seed`: az adatok kezdőállapota, betöltése
     és mintaadatai;
   - `onCoreRemove`: takarítás, amikor egy kapcsolat vagy cég törlődik;
   - `relatedLabel`: a tevékenységek és feladatok hivatkozásainak neve;
   - `DashboardWidget`, `ContactPanel`: saját elemek az áttekintésen és a
     kapcsolat szerkesztőjében.
3. Az oldalak a saját mappában élnek: `modules/<név>/pages/<oldal>/+Page.tsx`,
   mellette egy `+route.ts`, ami rögzíti az URL-t (pl. `export default "/properties";`).
4. Vedd fel a bővítményt a `src/crm/addon-registry.ts`-be, és kapcsold be a
   configban.

A bővítmény adatai a közös tárolóban, a `data.addons["<id>"]` kulcs alatt
vannak (az export, az import és a mintaadatok is kezelik őket), és a
`store.updateAddon(id, fn)` függvénnyel módosíthatók. Saját entitásai is
kaphatnak egyedi mezőt a configban (`customFields.<entitás>`).

## Felépítés

```
crm.config.ts            ← ügyfél-konfiguráció
presets/                 ← iparági preset-ek
modules/                 ← bővítmények (pl. real-estate)
src/crm/
  config.ts              ← config-séma (zod) + defineCrmConfig()
  types.ts               ← adatmodell (Contact, Company, Deal, Task, Activity)
  operations.ts          ← tiszta üzleti logika (CRUD, törlési szabályok, statisztika)
  fields.ts              ← űrlapmezők generálása, konverzió, validáció
  storage.ts             ← tároló-adapterek (localStorage, memória)
  store.ts               ← állapot + useCrm() hook
  seed.ts                ← mintaadatok
  i18n.ts                ← fordítások, pénz- és dátumformázás
  media.ts               ← képfeltöltés (Cloudinary / böngésző), kép-URL-ek
  addons.ts              ← bővítmény-interfész (defineAddon)
  addon-registry.ts      ← elérhető bővítmények listája
  addon-data.ts          ← bővítményadatok előkészítése, törlési hookok
  related.ts             ← hivatkozások olvasható neve (mag + bővítmények)
  crm.test.ts            ← unit tesztek
components/crm/          ← AppShell, EntitySheet (generikus szerkesztő), DataTable, ActivityLog
pages/                   ← oldalak (/, /contacts, /companies, /deals, /tasks, /settings)
```

**CSR:** a `pages/+config.ts`-ben `ssr: false`. Buildkor minden oldalhoz
egy üres HTML-héj készül (`prerender`), így statikusan, szerver nélkül
hosztolható (Vercel).

**Keresők:** a CRM nem indexelhető. Minden válaszon ott az `X-Robots-Tag:
noindex, nofollow, noarchive` fejléc (`vercel.json`) és a `<meta robots>` tag.
A `robots.txt` szándékosan engedi a bejárást, hogy a keresők lássák a tiltást
(egy `Disallow: /` mellett nem látnák, és a cím tartalom nélkül megjelenhetne
a találatok között). Ez nem biztonsági védelem: az adatokat a bejelentkezés
védi, nem az, hogy a cím nem kereshető.

### Backend bekötése (Fly.io + Neon)

Az adatok jelenleg a böngésző `localStorage`-ában vannak, ami demóhoz és
kipróbáláshoz jó. Éles ügyfélprojektekhez a terv:

```
app.ugyfel.hu (CRM, Vercel)  ──HTTPS, bejelentkezve──▶  API (Fly.io)  ──▶  Neon Postgres
ugyfel.hu (weboldal)         ──csak olvas, publikus──▶  API (Fly.io)
```

- **API a Fly.io-n:** admin-bejelentkezés (session vagy token), CRUD a
  CRM-adatokra, és egy **publikus, csak olvasható** végpont a weboldalnak
  (pl. `GET /public/services`, `GET /public/testimonials`). Ez kizárólag
  `status = "published"` elemeket ad vissza.
- **Neon Postgres:** a CRM-adatok privátak, a tartalmi elemek publikus
  olvasása csak az API szűrt végpontján át megy. Az adatbázis-kapcsolat
  adatai csak a Fly.io-n vannak, a böngészőbe sosem kerülnek.
- **A CRM oldalán:** egy új adapter a `StorageAdapter` interfész szerint
  (`src/crm/storage.ts`: `load`, `save`, `clear`), ami az API-t hívja, és
  csere a `getCrmStore()`-ban (`src/crm/store.ts`). Az API címe a
  `VITE_API_URL` változóba kerül (`src/env.ts`), a domain pedig a
  `vercel.json` CSP `connect-src` részébe.
- **A weboldalon:** buildkor lekéri a publikált tartalmat (prerender, gyors
  és SEO-barát marad), publikáláskor pedig egy Vercel Deploy Hook újraépíti.

## Képfeltöltés (Cloudinary)

A képek (pl. ingatlanfotók) közvetlenül a böngészőből töltődnek fel a
Cloudinary-re egy **unsigned upload preset** segítségével, titkos kulcs
nélkül. Ha a Cloudinary nincs beállítva, a képek kicsinyítve a böngészőben
tárolódnak (demóhoz jó, de összesen kb. 5 MB fér el).

**Beállítás (ügyfelenként egyszer):**

1. Cloudinary Console → **Settings → Upload → Upload presets → Add upload preset**
   - _Signing mode:_ **Unsigned**
   - _Asset folder:_ pl. `synel-crm` (a CRM ezen belül almappákat használ:
     `<media.folder>/properties/<hirdetésazonosító>`)
   - Korlátozd a presetet: _Allowed formats_ `jpg, png, webp, heic`;
     _Max file size_ 10 MB; ajánlott _Incoming transformation_:
     `c_limit,w_2560,h_2560`, hogy a túl nagy képek is ésszerű méretűek
     legyenek.
2. Környezeti változók (Vercel: _Project → Settings → Environment Variables_,
   helyben `.env`):

   ```sh
   VITE_CLOUDINARY_CLOUD_NAME=<cloud name>
   VITE_CLOUDINARY_UPLOAD_PRESET=<preset neve>
   ```

3. `crm.config.ts` → `media: { folder: "<ügyfél>" }`
4. Új build / deploy (a `VITE_*` értékek buildkor kerülnek a kódba).

A `vercel.json` CSP-je már engedi az `https://api.cloudinary.com` felé
irányuló feltöltést, a megjelenítés pedig Cloudinary-transzformációkkal
történik (`f_auto,q_auto`, a kártyákon kicsinyítve; `src/crm/media.ts` →
`imageUrl()`).

**Biztonság – fontos:**

- Az **API secretet soha ne tedd** `VITE_*` változóba vagy a kódba: az a
  böngészőbe kerülne. Unsigned módban nincs is rá szükség.
- Az unsigned preset neve a böngészőben látható, így bárki, aki ismeri,
  tölthet fel vele. Ezért korlátozd a presetet (formátum, méret, mappa).
  Ha a CRM később bejelentkezést és backendet kap, érdemes **signed**
  feltöltésre váltani: a backend írja alá a kérést, a felület pedig
  ugyanaz marad (`ImageUploader` interfész a `src/crm/media.ts`-ben).
- Ha egy fotót a CRM-ből törölsz, az a Cloudinary-n megmarad, mert a
  törléshez API secret kell. A `publicId` minden fotónál el van mentve,
  így ezek később backendből takaríthatók.

## Frissítések behúzása

**Ügyfélrepóba, a `synel-crm`-ből** (a javítások és az új funkciók):

```sh
git fetch upstream
git merge upstream/main
npm install && npm run check   # ellenőrzés a push előtt
git push                       # a Vercel automatikusan élesíti
```

Ha csak a configot és a saját `modules/ugyfel-*` bővítményt módosítottad,
ez ütközés nélkül megy. A `crm.config.ts`-ben előfordulhat ütközés, ha új
beállítás jelent meg: ilyenkor tartsd meg az ügyfél értékeit, és vedd át az
új kulcsokat.

**A `synel-crm`-be, a [hydration-starter-kit](https://github.com/Synel96/hydration-starter-kit)-ből**
(az alap frissítései):

```sh
git remote add starter https://github.com/Synel96/hydration-starter-kit  # egyszer
git fetch starter && git merge starter/main
```

## Scriptek

| Script                 | Mit csinál                                         |
| ---------------------- | -------------------------------------------------- |
| `npm run dev`          | Fejlesztői szerver                                 |
| `npm run build`        | Production build                                   |
| `npm run preview`      | Build, majd a production build helyi kiszolgálása  |
| `npm run typecheck`    | `tsc --noEmit`                                     |
| `npm run lint`         | ESLint                                             |
| `npm run lint:css`     | Stylelint                                          |
| `npm run format`       | Prettier (írás)                                    |
| `npm run format:check` | Prettier (csak ellenőrzés, CI)                     |
| `npm run test`         | Vitest                                             |
| `npm run check`        | Mind a fentiek (typecheck → lint → test → build …) |

Commit előtt a Husky + lint-staged lefuttatja az ESLintet, a Prettiert és a
Stylelintet. A CI (`.github/workflows/ci.yml`) minden pushnál és PR-nél a
teljes `check`-et futtatja.

## Sötét mód

A `src/theme.ts` és a `components/ThemeToggle.tsx` kezeli. Egy kis inline
script (`THEME_BOOTSTRAP_SCRIPT`) még az első renderelés előtt beállítja a
`.dark` osztályt, így nincs villanás. A `vercel.json` CSP-je hash alapján
engedi ezt a scriptet. Ha módosítod, frissítsd a hash-t; a
`src/vercelHeaders.test.ts` addig hibát jelez.

## Telepítés (Vercel)

A `vercel.json` statikus oldalként telepíti a `dist/client`-et, hosszú
cache-sel a hashelt fájlokra, és biztonsági fejlécekkel (CSP, HSTS stb.).
Külső szolgáltatás (API, képek) bekötésekor bővítsd a CSP-t.
