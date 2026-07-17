---
ijfw_version: 1.3.2
ijfw_schema: 1
type: software
primary_type: software
secondary_types: []
confidence: 0.907
detected_at: 2026-07-14T14:18:18.951Z
signals:
  - kind: manifest
    weight: 0.9
    manifests: [package.json]
  - kind: file_extension_ratio
    weight: 0.7
    domain: software
    ratio: 1
    count: 5
---
# Gutafinn - Agent Instructions

Detta dokument ar den primara kontexten for AI-agenter som jobbar i repot.

## System Snapshot

- Frontend: React 19 + TypeScript + Vite + TanStack Router + Tailwind CSS v4,
  Leaflet och Leaflet.markercluster i `src/`
- Backend: Node.js + Express + SQLite i `backend/`
- Deploy: Docker Compose i `deploy/proxmox/`
- Driftmiljo: Proxmox LXC CT 201 (`gutafinn`)
- Publik doman: `https://gutafinn.tobtech.se`
- Kompatibilitetsdoman: `https://gotland.tobtech.se` redirectar permanent till
  motsvarande path/query pa primardomanen
- Edge-routing: Cloudflare Tunnel (konfig i separat CT 200)
- Git remote: `https://github.com/spiddeer/gutafinn.git`
- Driftsatt frontend-SHA: verifieras i CT 201 med `git rev-parse HEAD`
- Kuraterad release-snapshot: 977 besoksmal i 8 interna kategorier och 7
  anvandarfilter; inga service-, boende-, bensin- eller laddposter

## Arkitektur

### Applikationsflode

1. Docker bygger Vite-frontenden i `deploy/Dockerfile` och kopierar `dist/` till Nginx.
2. Browser laddar Gutafinn via Nginx-container (`web`).
3. Gutafinn laddar alla aktiva platser fran `/api/places`, filtrerar och sorterar lokalt.
4. Mobil/iPad visar en enkelkolumn och oppnar kartan via `Karta`; fran 1024px
   landskap eller 1280px visas feed och karta samtidigt.
5. Leaflet-instansen skapas en gang. Filter diffar markerregistret i stallet for
   att bygga om klustret; GPS och vald plats uppdateras via separata effekter.
   Kartan behaller permanent synlig OSM-attribution.
6. Browsern ber om geolokalisering for verkligt avstand/GPS-markor och hamtar vader fran Open-Meteo.
7. `Overraska mig` gor ett lokalt urval fran samma platslista och oppnar
   fardsattsanpassad navigation hos OpenStreetMap.
8. Nginx proxyar `/api/*` till Express-container (`backend:8080`).
9. Backend laser/skriver SQLite i monterad volym `deploy/proxmox/data/places.db`.

### Frontendfiler

- `index.html`: Vite-shell, fontlankar och statisk SEO-metadata.
- `src/routes/__root.tsx`: TanStack Router-root och dynamisk head-metadata.
- `src/routes/index.tsx`: responsivt shell, API/GPS, sokning/filter, nav-state,
  kartfokus, valt plats-id och lista/karta-synk.
- `src/components/gutafinn-map.tsx`: stabil Leaflet-livscykel, kluster, popups,
  GPS-markor, markerregister, valt state och OSM-attribution.
- `src/components/gutafinn-map.test.tsx`: jsdom-regressionstester for engangsinitiering,
  separata GPS-/klusteruppdateringar, val och markorklick.
- `src/components/surprise-adventure.tsx`: tillgangligt helskarmsflode for tid, fardsatt, GPS-states och aventyrskort.
- `src/components/day-planner.tsx`: intern dagsplan fran sparade platser med
  fardsatt, etapper och sanningsenliga uppskattningar.
- `src/lib/places.ts`: API-typer, kategorimappning, avstand, oppettider och filtrering.
- `src/lib/surprise.ts`: ren radie-/urvalslogik, faktamotiveringar, restidsestimat och OSM-URL:er.
- `src/lib/surprise-storage.ts`: validerad localStorage-state med max 20 historikposter.
- `src/lib/weather.ts`: livevader och solnedgang fran Open-Meteo.
- `src/lib/discovery-url.ts`: validerad parse/serialisering av delbar sokning,
  kategori, kartvy och vald plats.
- `src/lib/day-planner.ts`: deterministisk narsta-stopp-ordning, max atta stopp
  och beraknad stracka/restid.
- `src/lib/map-area.ts`: validerad viewportfiltrering inklusive datumlinje-fall.
- `src/lib/practical-filters.ts`: kombinerbara filter for GPS-radie och
  forekomst av oppettider, kontakt samt tillganglighetsuppgift.
- `src/lib/places.test.ts`: frontendtester for datamappning och sanningsenliga states.
- `src/styles.css`: Tailwind v4, Leaflet/markercluster-CSS, `@theme inline` och semantiska OKLCH-tokens.
- `src/components/ui/`: shadcn/ui-komponenter i `new-york`-stil.
- `src/assets/`: fem genererade och optimerade Gotlandsbilder.
- `public/`: bevarad legacy-Leaflet-frontend; exkluderas ur Vite-build och
  monteras inte langre av Compose.

### Backendfiler

- `backend/server.js`: Las- och skriv-API for kategorier och platser.
- `backend/db.js`: SQLite-anslutning och migreringsstart.
- `backend/migrations.js`: Versionsstyrda, additiva SQLite-migreringar.
- `backend/place-repository.js`: Datakontrakt, relationslasning och skrivning.
- `backend/import-osm.js`: Overpass-import, kategorisering, deduplicering och
  generering av seed- samt fallback-snapshot.
- `backend/seed.js`: Idempotent OSM-import vid containerstart.
- `backend/seed-data.json`: Seed-dataset.
- `backend/test/`: Tester for API, migreringar/databas och OSM-import.

### CMS-filer

- `cms/src/`: Passkey-/reservkontoskyddad platsadministration mot samma SQLite.
- `cms/test/`: Auth-, WebAuthn-, validerings- och CRUD-regressionstester.
- Backend ager domanschemat och migreringarna. CMS far aldrig initiera eller
  andra domanschemat och ska vagra start mot en oinitierad databas.

## Frontend-state och designkontrakt

Gutafinn anvander lokal React-state i `src/routes/index.tsx`. Kategorin maste
fortsatt vara `useState<Category>` med `Allt`, `Mat & dryck`, `Sevärdheter`,
`Bad`, `Natur`, `Aktiviteter`, `Familj` och `Lokalt`; sokning
och kategori kombineras i en memoiserad filtrering. Sparstatus och aktiv
bottom-nav ar lokal UI-state. Sparade plats-id:n lagras beständigt i localStorage
under `gutafinn_saved_places` och ingar inte i SQLite eller API-kontraktet.
`Karta` ar en intern React-vy; den far inte bytas tillbaka till en extern lank.

`Overraska mig` ar ocksa en intern React-vy och ska ateranvanda redan laddade
platser samt befintlig GPS-state. Katalogen ska bara innehalla besokskategorier;
boende, service, bensin, laddning och generisk handel filtreras i importen.
V1 far endast ranka pa avstand, kategorivariation,
`lastVerifiedAt` och lokal visningshistorik. Radien far vaxa
i 1 km-steg men aldrig over 10 km. De fyra `gutafinn_surprise_*`-nycklarna
lagrar tid, fardsatt och hogst 20 senaste plats-id:n/kategorier; GPS-koordinater
far inte lagras. Bevara faktamallar, tydlig stamningsbildsetikett och
fardsattsanpassade OSM-motorer for gang, cykel och bil.

All fargsattning i komponenter ska ga via semantiska tokens fran
`src/styles.css`. Bevara enkelkolumn pa mobil, rymligare enkelkolumn pa
iPad-portratt samt split-layout fran 1024px landskap/1280px. Desktop-feeden ska
vara 460-540px, kartan flexibel och toppnavigationen ersatta bottom-nav. Bevara
svenska texter, 44px touch targets, fokusmarkeringar, safe areas och
reduced-motion-stod enligt `DESIGN.md`.

`activeNav` och `feedMode` ar avsiktligt separata: `Kartfokus` far inte tappa
sokning, kategori eller sparvy. Listval och markorklick ska synka
`selectedPlaceId` at bada hall. Bygg aldrig om Leaflet-instansen eller alla
oforandrade markorer for filter, GPS eller val; initiering, markordiff,
GPS och selection ska forbli separata.

URL-state far endast innehalla sokfras, publik kategori, `vy=karta`, ett
validerat plats-id och praktiska filter via `radie`/`fakta`. GPS-koordinater och innehållet i sparlistan far aldrig
serialiseras. Okanda URL-varden ska falla tillbaka till `Allt`/hemmavy, och
browserhistorik ska kunna aterstalla state utan full sidladdning.

Dagsplaneraren ska alltid utga fran den beständiga sparordningen, men aldrig
lagra en plan eller GPS. Med GPS valjs narmaste forsta stopp; utan GPS blir den
forst sparade platsen start. Visa hogst atta stopp, kalla avstand/restid for
uppskattningar och behall gang/cykel/bil kopplade till ratt OSM-motor.

Kartomradesfiltret ar ett explicit, tillfalligt filter ovanpa sokning, kategori
och sparvy. `GutafinnMap` rapporterar endast aktuella Leaflet-granser nar
anvandaren trycker pa knappen. Feeden ska alltid visa aktiv status och kunna
aterstalla hela Gotland; GPS och URL-state far inte blandas ihop med viewporten.

Praktiska filter far bara pasta att underlag finns. `Oppettider finns` betyder
inte `Oppet nu`, och `Tillganglighetsinfo` betyder inte automatiskt full
tillganglighet. Avstandsfilter ar 1/5/10 km och ska inte exkludera data innan en
GPS-position finns. Alla praktiska filter kombineras med sokning, kategori,
sparvy och eventuellt kartomrade.
Leaflet-kontroller, markorer och attribution maste vara tangentbords-/touchbara,
och OpenStreetMap-krediteringen ska vara permanent lasbar pa alla viewportstorlekar.

## Data-kontrakt

Platsobjektets bakatkompatibla karna ska alltid vara:

`{ id, name, category, lat, lng, description }`

Valfria berikningsfalt ar `categories`, `address`, `contacts`, `openingHours`,
`accessibility`, `priceLevel`, `images`, `sources` och `lastVerifiedAt`.

En plats kan tillhora flera kategorier, men `category` ar alltid primar kategori.
Kategori-nycklar maste finnas i bade SQLite-tabellen `categories` och fallbacken
`CATEGORIES` i `public/js/places-data.js`.

Publika kategorier ar `mat`, `sevardhet`, `strand`, `smultronstallen`, `natur`,
`aktivitet`, `familj` och `shopping`. Nya importsokningar far inte aterinfora
`service`, `boende`, bensin, laddning eller generisk handel. Varje aktiv plats
ska ha namn, beskrivning, koordinater och kalla; informationspanelen visar
dessutom all tillganglig adress, kontakt, oppettid och tillganglighet.

API:t ska fortsatt exponera `/api/categories` och `/api/places`. Den aktiva
Gutafinn-frontenden anvander `/api/places` som enda platskalla. `public/`-
fallbacken bevaras for importens reproducerbarhet men ar inte aktiv runtime-frontend.

Seed/import far uppdatera karndata med `UPSERT`, men aldrig radera manuellt
berikade oppettider, kontaktuppgifter, bilder eller kallor.

Importagda kategorikopplingar har `source_type = 'OpenStreetMap'` och far
synkas bort nar kallan andras. Manuella kategorikopplingar saknar den
kallmarkningen och ska bevaras. Poster som forsvinner ur OSM markeras med
`is_active = 0`; publika lasningar returnerar endast aktiva poster.

Aktuell seed och frontend-fallback ska alltid genereras av samma importkorning.
Andra inte den ena snapshoten utan att synka och testa den andra.

## Drift och infrastruktur

### Proxmox

- CT 201: Korer applikationen (`/opt/gutafinn`)
- CT 200: Korer cloudflared tunnel-process

### Cloudflare

- Hostname: `gutafinn.tobtech.se`
- Redirect-hostname: `gotland.tobtech.se`
- Tunnel ingress target: `http://192.168.1.224:3003` (CT 201)

### Compose services

- `backend` (Node/Express, intern 8080)
- `cms` (Node, intern 3000; startar efter gron backend-health)
- `web` (multi-stage Vite-build + Nginx, publiceras pa port 3003 i CT 201)

Nginx anvander separata CSP-/browserpolicyer for publik app och CMS. Andra inte
publik `connect-src`, `font-src` eller `Permissions-Policy` sa att Open-Meteo,
Google Fonts eller GPS slutar fungera. Hashade assets ar immutable-cachelagrade,
medan `index.html` atervalideras och API-cachen satts av backend.

## Standardoperativa kommandon

I CT 201:

```bash
cd /opt/gutafinn
./deploy/proxmox/deploy.sh
```

Backup manuellt:

```bash
cd /opt/gutafinn/deploy/proxmox
./backup.sh
```

Timerstatus:

```bash
systemctl status gutafinn-backup.timer
systemctl list-timers --all | grep gutafinn-backup
```

Lokal verifiering fran projektroten och `backend/`:

```bash
npm run build
npm test
cd backend
npm test
cd ../cms
npm test
```

Efter deploy:

```bash
curl -fsSI https://gutafinn.tobtech.se
curl -fsS https://gutafinn.tobtech.se/api/categories
curl -fsS https://gutafinn.tobtech.se/api/places
```

Browser-verifiera darefter 320, 390, 768, 820, 1024 landskap, 1280 och 1440px.
Kontrollera Leaflet-container, kartplattor, kluster, lista/karta-synk,
aterstallbart kartfokus, bevarade filter och synlig OpenStreetMap-attribution.

## AI-agent policy (viktigt)

1. Andra aldrig API-schemat utan att uppdatera backend + seed + docs och eventuell ny API-konsument.
2. Bevara Gutafinns mobilforst-design, semantiska tokens, tillganglighet och svensk copy.
3. Undvik hardkodad runtime-data i git (`deploy/proxmox/data/`, `backups/`).
4. Anvand befintligt deployscript i stallet for ad-hoc deploykommando.
5. Om Cloudflare-routing andras: dokumentera ny ingress i denna fil och i `deploy/proxmox/README.md`.
6. Vid nya driftsattningssteg: uppdatera samtliga markdownfiler i repot.
7. Kor backendtester efter andringar i schema, repository, seed eller import.
8. Hall `backend/seed-data.json` och `public/js/places-data.js` synkroniserade.
9. Kor `npm test` och `npm run build` efter andringar i `src/`, Vite, Tailwind eller frontend-Dockerbygget.
10. Vid kartandringar: behall Leaflet-attribution synlig och verifiera med den fulla `/api/places`-mangden.
11. Leaflet-instansen far inte aterinitieras av filter, GPS eller valt plats-id;
    behall och utoka `gutafinn-map.test.tsx` vid livscykelandringar.
12. Responsiva andringar ska browserkontrolleras over hela 320-1440px-matrisen
    och far inte skapa mobil sidscroll eller dolja bottom-nav/topnavigation.
13. Vid Nginx-/headerandringar: bygg web-imagen, kor `nginx -t` och kontrollera
    GPS, Open-Meteo, Google Fonts, kartplattor och bada hostnamnens CSP.
14. Vid kartomradesandringar: testa bounds-filtret och callbacken utan att flytta
    Leaflet-instansens agarskap eller koppla filtrering till `moveend` automatiskt.
15. Lagga aldrig till `Oppet nu`, pris- eller tillganglighetsloften utan
    tillrackligt strukturerat underlag och sanningsenliga tomma states.

## Snabb felsokning

- Inget svar publikt: verifiera cloudflared i CT 200 och ingress-regel.
- Frontendbygge misslyckas: kor `npm run build` och kontrollera TanStack-routegenerering.
- API-data saknas: kontrollera `GET /api/places` i CT 201 och Gutafinns retry-state.
- DB-problem: kontrollera att `deploy/proxmox/data/places.db` finns och ar skrivbar.
- Styling behover skarpas: kontrollera `src/styles.css`, semantiska tokens och Tailwind-klasser.
- Kartan ar tom: kontrollera `/api/places`, Leaflet-importerna, markercluster och browserkonsolen.
- Kartan blinkar eller tappar state: kontrollera effektberoenden och att initiering
  fortfarande sker en gang medan kluster, GPS och selection uppdateras separat.

## Relaterad dokumentation

- `deploy/proxmox/README.md`: drift/runbook
- `README.md`: produktoversikt, API och datastatus
- `DESIGN.md`: visuellt och interaktivt designkontrakt
- `CLAUDE.md`: kort projektkontext och IJFW-hanvisningar
- `.github/hooks/README.md`: hooksystem och kvalitetsregler

<!-- IJFW-MEMORY-START -->
Project memory at .ijfw/memory/. Call `ijfw_memory_prelude` for full context.
<!-- IJFW-MEMORY-END -->

<!-- IJFW-AGENTS-START -->
No project agents yet. Run `ijfw team` to set them up.
<!-- IJFW-AGENTS-END -->
