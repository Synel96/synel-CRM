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

## Indítás

```sh
npm install
npm run dev
```

Első induláskor mintaadatokkal tölti fel magát (`seedDemoData: true`).

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
   | `labels`       | Modulok átnevezése, pl. `{ deals: "Projektek" }`              |
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
    { key: "listingType", label: "Típus", type: "select",
      options: ["Eladó", "Kiadó"], required: true, showInList: true },
    { key: "areaSize", label: "Alapterület (m²)", type: "number" },
  ],
}
```

- Típusok: `text`, `textarea`, `number`, `money`, `date`, `email`, `phone`,
  `url`, `select`, `boolean`
- `showInList: true` esetén oszlopként (listanézet) vagy címkeként (kanban)
  is megjelenik.
- Az űrlapok, a validáció és a megjelenítés automatikusan generálódik.
  A felülethez nem kell kódot írni.

## Felépítés

```
crm.config.ts            ← ügyfél-konfiguráció
presets/                 ← iparági preset-ek
src/crm/
  config.ts              ← config-séma (zod) + defineCrmConfig()
  types.ts               ← adatmodell (Contact, Company, Deal, Task, Activity)
  operations.ts          ← tiszta üzleti logika (CRUD, törlési szabályok, statisztika)
  fields.ts              ← űrlapmezők generálása, konverzió, validáció
  storage.ts             ← tároló-adapterek (localStorage, memória)
  store.ts               ← állapot + useCrm() hook
  seed.ts                ← mintaadatok
  i18n.ts                ← fordítások, pénz- és dátumformázás
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
