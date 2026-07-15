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
# Gotlandsguiden - Agent Instructions

Detta dokument ar den primara kontexten for AI-agenter som jobbar i repot.

## System Snapshot

- Frontend: React 19 + TypeScript + Vite + TanStack Router + Tailwind CSS v4,
  Leaflet och Leaflet.markercluster i `src/`
- Backend: Node.js + Express + SQLite i `backend/`
- Deploy: Docker Compose i `deploy/proxmox/`
- Driftmiljo: Proxmox LXC CT 201 (`gotlandsguiden`)
- Publik doman: `https://gotland.tobtech.se`
- Edge-routing: Cloudflare Tunnel (konfig i separat CT 200)
- Git remote: `https://github.com/spiddeer/gotlandguiden.git`
- Senast live-verifierade frontendrelease: `1982690` (2026-07-15)
- Produktionssnapshot: 1 345 aktiva platser, 17 inaktiva historiska platser,
  10 kategorier och 4 databasmigreringar (verifierat 2026-07-14)

## Arkitektur

### Applikationsflode

1. Docker bygger Vite-frontenden i `deploy/Dockerfile` och kopierar `dist/` till Nginx.
2. Browser laddar Gutafinn via Nginx-container (`web`).
3. Gutafinn laddar alla aktiva platser fran `/api/places`, filtrerar och sorterar lokalt.
4. Mobil/iPad visar en enkelkolumn och oppnar kartan via `Karta`; fran 1024px
   landskap eller 1280px visas feed och karta samtidigt.
5. Leaflet-instansen skapas en gang. Kluster, GPS och vald plats uppdateras via
   separata effekter och kartan behaller permanent synlig OSM-attribution.
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
- `src/lib/places.ts`: API-typer, kategorimappning, avstand, oppettider och filtrering.
- `src/lib/surprise.ts`: ren radie-/urvalslogik, faktamotiveringar, restidsestimat och OSM-URL:er.
- `src/lib/surprise-storage.ts`: validerad localStorage-state med max 20 historikposter.
- `src/lib/weather.ts`: livevader och solnedgang fran Open-Meteo.
- `src/lib/places.test.ts`: frontendtester for datamappning och sanningsenliga states.
- `src/styles.css`: Tailwind v4, Leaflet/markercluster-CSS, `@theme inline` och semantiska OKLCH-tokens.
- `src/components/ui/`: shadcn/ui-komponenter i `new-york`-stil.
- `src/assets/`: fem genererade och optimerade Gotlandsbilder.
- `public/`: bevarad legacy-Leaflet-frontend; monteras inte langre av Compose.

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

## Frontend-state och designkontrakt

Gutafinn anvander lokal React-state i `src/routes/index.tsx`. Kategorin maste
fortsatt vara `useState<Category>` med `Allt`, `Göra`, `Se` och `Äta`; sokning
och kategori kombineras i en memoiserad filtrering. Sparstatus och aktiv
bottom-nav ar lokal UI-state. Sparade plats-id:n lagras beständigt i localStorage
under `gutafinn_saved_places` och ingar inte i SQLite eller API-kontraktet.
`Karta` ar en intern React-vy; den far inte bytas tillbaka till en extern lank.

`Overraska mig` ar ocksa en intern React-vy och ska ateranvanda redan laddade
platser samt befintlig GPS-state. Kandidater filtrerar bort primarkategorierna
`boende` och `service`. V1 far endast ranka pa avstand, kategorivariation,
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
`selectedPlaceId` at bada hall. Bygg aldrig om Leaflet-instansen for filter,
GPS eller val; initiering, kluster, GPS och selection ska forbli separata.
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

- CT 201: Korer applikationen (`/opt/gotlandsguiden`)
- CT 200: Korer cloudflared tunnel-process

### Cloudflare

- Hostname: `gotland.tobtech.se`
- Tunnel ingress target: `http://192.168.1.224:3003` (CT 201)

### Compose services

- `backend` (Node/Express, intern 8080)
- `web` (multi-stage Vite-build + Nginx, publiceras pa port 3003 i CT 201)

## Standardoperativa kommandon

I CT 201:

```bash
cd /opt/gotlandsguiden
./deploy/proxmox/deploy.sh
```

Backup manuellt:

```bash
cd /opt/gotlandsguiden/deploy/proxmox
./backup.sh
```

Timerstatus:

```bash
systemctl status gotlandsguiden-backup.timer
systemctl list-timers --all | grep gotlandsguiden-backup
```

Lokal verifiering fran projektroten och `backend/`:

```bash
npm run build
npm test
cd backend
npm test
```

Efter deploy:

```bash
curl -fsSI https://gotland.tobtech.se
curl -fsS https://gotland.tobtech.se/api/categories
curl -fsS https://gotland.tobtech.se/api/places
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
