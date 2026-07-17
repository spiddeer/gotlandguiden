# Project Hooks for Gutafinn

Detta dokument forklarar hur hooks i `.github/hooks` hjalper AI-tjanster och utvecklare att halla projektet stabilt.

## Syfte

Hooks ska minska regressionsrisk i tre bevarade legacy-ytor:

1. Fallback-datakvalitet i `public/js/places-data.js`
2. State/render-disciplin i `public/js/app.js`
3. Frontendkvalitet i `public/index.html` och `public/css/style.css`

Den aktiva Gutafinn-frontenden finns nu i `src/` och verifieras med Vitest samt
TypeScript/Vite-build. Den aktiva kartan finns i `src/components/gutafinn-map.tsx`,
har livscykeltester i `src/components/gutafinn-map.test.tsx` och Leaflet-CSS i
`src/styles.css`. Befintliga hooks bevakar fortfarande den bevarade
`public/`-frontenden, som uttryckligen exkluderas ur Vite-builden, och ska
behandlas som legacy-/importskydd tills hookscope har
migrerats till TypeScript/Tailwind. Hooks ar snabba
redigeringskontroller, inte en full CI-svit. De bevakar inte
`backend/seed-data.json`, `backend/import-osm.js`, databasmigreringar eller API:t.
Dessa ytor verifieras med backendtesterna och de manuella datakontrollerna nedan.

## Aktiva hookfiler

### `data-validation.json`

Kors fore och efter redigering av `**/places-data.js`. Efterkontrollen verifierar
grundschema och att `CATEGORIES` finns. Hookens namn beskriver ett bredare mal,
men nuvarande kommando gor ingen full koordinat- eller dubblettkontroll.

Skyddar mot:

- Fel kategorinamn
- Saknade obligatoriska falt (`id`, `name`, `category`, `lat`, `lng`, `description`)
- Orimliga koordinater

### `code-quality.json`

Fokuserar pa kodhygien och konsekvens.

Skyddar mot:

- Oavsiktliga `console.log`
- Missad `render()` efter state-andring
- Oonskad stil-drift i CSS

### `performance-checks.json`

Hittar vanliga prestandafallor i frontendlogiken.

Skyddar mot:

- `render()` i loopar
- Tung synkron logik i UI-flode
- HTML-andringar som riskerar laddningsprestanda

### `accessibility-seo.json`

Validerar tillganglighet och semantik.

Skyddar mot:

- Saknade `aria-*` attribut
- Svag semantisk struktur
- Vanliga SEO-basmissar i HTML

### `category-consistency.json`

Kors efter redigering av `**/places-data.js` och jamfor definierade kategorier
med kategorier som anvands i fallback-datasetet.

Skyddar mot:

- Stavfel i kategori-nycklar
- Oanvanda kategori-definitioner

## Hur AI-tjanster ska anvanda hooks

1. Kor `npm test` och `npm run build` for alla andringar i `src/`, root-konfig eller frontend-Dockerbygget.
   Vid kartandringar ska en riktig browser dessutom verifiera kartplattor,
   kluster, full platsmangd, tvavagsval, stabil kartinstans och permanent synlig
   OpenStreetMap-attribution.
2. Se hook-varningar for `public/` som krav for reproducerbar legacy/importdata,
   men skilj dem fran WCAG-resultat for den aktiva React-frontenden.
3. Om hook signalerar schemafel: justera dataforandringen direkt.
4. Om hook signalerar render/state-fel: los problemet innan fler features laggs till.
5. Om hook signalerar CSS/HTML-problem: bevara mobilforst och tillganglighet.

## Praktiska regler vid redigering

1. Vid andring i `public/js/places-data.js`: kontrollera kategorier och schema.
2. Vid andring i `public/js/app.js`: kontrollera att state-forandringar foljs av `render()`.
   Bevara aven de separata listorna `favorites`/`gg_favorites` (“Vill besoka”)
   och `visited`/`gg_visited` (“Besokta”).
3. Vid andring i `public/css/style.css`: behall variabelbaserad design och mobilforst-beteende.
4. Vid andring i `public/index.html`: behall semantik och ARIA-kvalitet.
5. Vid andring i `backend/seed-data.json` eller `backend/import-osm.js`: kor
   `npm test` i `backend/` och verifiera att frontend-fallbacken genererats av
   samma importkorning.
6. Vid andring i kategorier: verifiera SQLite-kategorier, seedens primara och
   sekundara kategorier samt `CATEGORIES` i fallbacken. Besokskatalogen far inte
   aterinfora service, boende, bensin, laddning eller generisk handel.
7. Vid andring i Gutafinn: hall farger tokenbaserade i `src/styles.css`, routefiler
   i `src/routes/` och verifiera datamappning samt TypeScript/Vite med `npm test` och `npm run build`.
8. Vid andring i `src/components/gutafinn-map.tsx`: behall Leaflet-markercluster,
   tangentbordsfokus, GPS-markor och OSM-attribution; initiera kartan en gang och
   hall kluster, GPS samt valt plats-id i separata uppdateringar. Utoka
   `gutafinn-map.test.tsx` vid livscykel- eller selectionandringar.
9. Vid andring i `Overraska mig`: kor testerna for `src/lib/surprise*.test.ts`,
   bygg frontenden och browser-verifiera GPS tillaten/nekad, tre tider, tre
   fardsatt, fem rerolls, live-region och respektive OSM-motor.
10. Vid responsiva andringar: browser-verifiera 320, 390, 768, 820, 1024
    landskap, 1280 och 1440px. Mobil/iPad ska vara enkelkolumn med bottom-nav;
    desktop ska ha toppnavigation, 460-540px feed, flexibel karta och
    aterstallbart kartfokus utan tappade filter.
11. Vid andring i platsinformation: verifiera informationspanelen med komplett
    data och med saknad adress/kontakt/oppettid; kalla och koordinater ska alltid synas.
12. Vid Nginx-/headerandringar: bygg web-imagen och kor `nginx -t`. Publik CSP
    maste tillata GPS, Open-Meteo, Google Fonts och HTTPS-kartplattor; CMS har
    en separat strikt policy.
13. Vid andring i delbart state: utoka `discovery-url.test.ts`, och verifiera
    omladdning samt bakat-/framatnavigation. GPS och sparade ID:n far inte
    hamna i URL:en.
14. Vid andring i dagsplanen: utoka `day-planner.test.ts` och verifiera noll,
    en och flera sparade platser, GPS tillaten/nekad, atta-stoppsgransen och
    OSM-motorerna for gang, cykel samt bil.
15. Vid kartomradessokning: utoka `map-area.test.ts` och kartkomponenttestet.
    Panorering far inte auto-filtrera, och reset ska aterstalla hela katalogen.

`Overraska mig` ska fortsatt ha ren, testbar domanlogik i `src/lib/surprise.ts`,
begransad localStorage-hantering i `src/lib/surprise-storage.ts` och UI i
`src/components/surprise-adventure.tsx`. Hooks bevakar inte dessa kontrakt fullt
ut; Vitest, TypeScript/Vite och browserkontrollen ar releasegrinden.

## Backend- och datasynkronisering

SQLite ar produktionskallan. Importflodet skriver bade
`backend/seed-data.json` och fallback-snapshoten i
`public/js/places-data.js`. Kategorikopplingar fran OpenStreetMap ar
kallmarkerade och far synkas; manuella kopplingar och berikningsfalt ska
bevaras.

Kor fran `backend/` efter data-, import-, schema- eller API-andringar:

```bash
npm test
```

Testsviten omfattar API, databas/migreringar och importlogik. Hookarna kompletterar
testerna med snabb feedback under frontendredigering men ersatter dem inte.

## Vanliga felbilder

### Kategori-stavfel

Exempel: `strnad` i stallet for `strand`.

Effekt: filter, markorer och listvy blir inkonsekventa.

### Render-regression

Exempel: state andras men `render()` gloms.

Effekt: UI verkar trasig trots korrekt state.

### Hardkodad design-drift

Exempel: ny hardkodad hexfarg i komponent.

Effekt: designen blir inkonsekvent mellan ljust/morkt lage.

### Kartan fungerar bara i legacy-vyn

Exempel: nya Leaflet-regler laggs enbart i `public/css/style.css`.

Effekt: produktionen far ingen andring eftersom Compose serverar Vite-`dist/`.
Aktiv kartkod och kartstil ska ligga i `src/components/gutafinn-map.tsx` respektive
`src/styles.css`; `public/` ar endast bevarat legacy/fallback.

### Kartan aterinitieras vid filter eller nav

Exempel: kartans initieringseffekt beror pa `places`, GPS eller selection.

Effekt: Leaflet tappar intern state, blinkar eller kan kasta race-undantag nar
split-layout/kartfokus vaxlar. Initiering ska ske en gang; markerkluster, GPS och
vald plats uppdateras via separata effekter och testas i jsdom.

## Nar du lagger till en ny hook

1. Hall kommandot snabbt (<2 sekunder normalt).
2. Skriv tydlig `description`.
3. Scopea `path` sa smalt som mojligt.
4. Testa med en medvetet felaktig andring for att verifiera signal.

## Relaterade dokument

- `AGENTS.md`
- `README.md`
- `DESIGN.md`
- `deploy/proxmox/README.md`
