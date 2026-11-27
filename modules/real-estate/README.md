# Ingatlanos bővítmény (`real-estate`)

Ingatlanirodáknak szóló bővítmény a Synel CRM-hez.

## Bekapcsolás

```ts
// crm.config.ts
addons: ["real-estate"],
```

Kész kiindulópont: `presets/real-estate.ts`. Ez bekapcsolja a bővítményt, és
beállítja a menüneveket és az ügyletek pipeline-ját.

## Mit ad hozzá

| Hol             | Mit                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------- |
| `/properties`   | Ingatlanok kártyás nézetben; szűrés státusz, hirdetéstípus, ingatlantípus és szöveg alapján |
| `/searches`     | Vevői/bérlői keresési igények, a párosítások számával                                       |
| Ingatlan-panel  | Adatok, fotók (max. 30, URL vagy feltöltés), érdeklődők, tevékenységnapló                   |
| Áttekintés      | Aktív hirdetések, eladó portfólió értéke, aktív keresések, párosítások                      |
| Kapcsolat-panel | A kapcsolat ingatlanai és keresései, új felvétele onnan                                     |
| Beállítások     | Ingatlanok és keresések száma                                                               |

### Párosítás

Egy keresés akkor illik egy ingatlanra, ha:

- mindkettő aktív;
- a hirdetés típusa (eladó/kiadó) egyezik;
- a megadott feltételek mind teljesülnek: ingatlantípus, település/kerület,
  ár-sáv, minimális alapterület és szobaszám.

Az üres feltétel nem szűr.

A település ékezet-, pont- és kisbetű-független. A `Budapest` minden
kerületre illik, a `Budapest XI.` csak a XI. kerületre.

### Ingatlan.com-kompatibilitás

A hirdetésazonosító (`ownId`) formátuma megegyezik az ingatlan.com
Automata betöltés API-jáéval: legfeljebb 15 karakter, `A-Z a-z 0-9 _ -`.
Az azonosító egyedi, és a rendszer automatikusan generálja. A fotók
számának korlátja is a portálé (30). Így később a portálszinkron az adatok
átalakítása nélkül ráépíthető.

## Felépítés

```
index.ts            ← bővítmény-definíció (menü, hookok, widgetek)
types.ts            ← Property, BuyerSearch, kódlisták
logic.ts            ← tiszta logika: mentés, törlés, párosítás, ownId
logic.test.ts       ← unit tesztek
fields.ts           ← űrlapmezők (a mag RecordForm-ja rendereli)
seed.ts             ← mintaadatok
i18n.ts             ← magyar és angol szövegek
format.ts           ← ár formázása
useRealEstate.ts    ← React hook a bővítmény adataihoz
components/         ← kártya, szerkesztőpanelek, fotókezelő, widgetek
pages/              ← /properties, /searches (+route.ts rögzíti az URL-t)
```

Az adatok a CRM közös tárolójában, a `data.addons["real-estate"]` kulcs
alatt vannak, így az export, az import és a mintaadat-visszaállítás is
kezeli őket.

Egyedi mezők a configban: `customFields.property` és
`customFields.buyerSearch`.

## Eltávolítás

1. Vedd ki az `addons` listából. Ekkor a menü eltűnik, az oldalak „ki van
   kapcsolva” üzenetet mutatnak, az adatok megmaradnak.
2. Ha végleg nem kell: töröld ezt a mappát és a sort a
   `src/crm/addon-registry.ts`-ből.
