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

| Bővítmény    | Kulcs         | Menüpontok                   | Mit tud                                                                                                         |
| ------------ | ------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Ingatlan** | `real-estate` | Ingatlanok, Keresési igények | Ingatlanok kártyás nézetben, fotók (Cloudinary), tulajdonos, vevői keresések, automatikus párosítás, KPI-widget |

```ts
addons: ["real-estate"],
```

Részletek: [`modules/real-estate/README.md`](modules/real-estate/README.md).
Új bővítmény készítése: lásd [Bővítmények](#bővítmények-add-onok).

### Egyéb beállítások modulonként

| Beállítás                     | Mit szab testre                                                                                | Példa                                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `labels`                      | Bármelyik menüpont neve (mag és bővítmény is)                                                  | `{ deals: "Ügyletek", properties: "Kínálat" }`       |
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

1. **Új repó a kitből.** Másold le a repót, vagy hozz létre belőle újat
   (GitHub: _Use this template_), az ügyfél nevével.
2. **`crm.config.ts`:** ez az egyetlen fájl, amit ügyfelenként módosítani kell.

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

| Bővítmény     | Mappa                  | Leírás                                                    |
| ------------- | ---------------------- | --------------------------------------------------------- |
| `real-estate` | `modules/real-estate/` | Ingatlanok, fotók, vevői keresések, automatikus párosítás |

**Bekapcsolás:** `crm.config.ts` → `addons: ["real-estate"]`.

**Új bővítmény készítése:**

1. Hozz létre egy mappát: `modules/<név>/`.
2. Az `index.ts` exportáljon egy `defineAddon({...})` objektumot
   (interfész és leírás: `src/crm/addons.ts`). Lehetséges részei:
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
hosztolható (Vercel). Az oldal `noindex`, a `robots.txt` mindent tilt.

### Backend bekötése

Az adatok jelenleg a böngésző `localStorage`-ában vannak, ami demóhoz és
egyfelhasználós használatra jó. Többfelhasználós ügyfélhez írj egy adaptert
a `StorageAdapter` interfész szerint (`src/crm/storage.ts`: `load`, `save`,
`clear`), és cseréld le a `getCrmStore()`-ban (`src/crm/store.ts`). Az API
címe a `VITE_API_URL` környezeti változóba kerüljön (`src/env.ts`), a
`vercel.json` CSP `connect-src` részébe pedig vedd fel a domaint.

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

## Frissítés a starter kitből

A repó a [hydration-starter-kit](https://github.com/Synel96/hydration-starter-kit)
előzményeire épül. Az alap frissítései így olvaszthatók be:

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
