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

- Frontend: Vanilla JavaScript + Leaflet i `public/`
- Backend: Node.js + Express + SQLite i `backend/`
- Deploy: Docker Compose i `deploy/proxmox/`
- Driftmiljo: Proxmox LXC CT 201 (`gotlandsguiden`)
- Publik doman: `https://gotland.tobtech.se`
- Edge-routing: Cloudflare Tunnel (konfig i separat CT 200)
- Git remote: `https://github.com/spiddeer/gotlandguiden.git`
- Produktionssnapshot: 1 345 aktiva platser, 17 inaktiva historiska platser,
  10 kategorier och 4 databasmigreringar (verifierat 2026-07-14)

## Arkitektur

### Applikationsflode

1. Browser laddar frontend via Nginx-container (`web`).
2. Frontend kallar `/api/places`.
3. Nginx proxyar `/api/*` till Express-container (`backend:8080`).
4. Backend laser/skriver SQLite i monterad volym `deploy/proxmox/data/places.db`.

### Frontendfiler

- `public/index.html`: Struktur, Leaflet/cluster script includes.
- `public/css/style.css`: Mobil-forst, modern UI, dark mode, detaljpanel.
- `public/js/app.js`: State, rendering, filter, favorites, geolocation, detail sheet.
- `public/js/places-data.js`: API-first laddning, kategorier + fallback-dataset.

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

## State & Rendering-kontrakt

I `public/js/app.js` ar huvudprincipen: uppdatera state -> kalla `render()`.

Aktuell state-nycklar:

- `places`
- `userLatLng`
- `activeCategory`
- `query`
- `favorites` (platser markerade “Vill besoka”)
- `visited`
- `selectedId`
- `activeTab`

Bryt inte detta monster utan bra skal.

De personliga listorna lagras lokalt i webblasaren: `gg_favorites` for
“Vill besoka” och `gg_visited` for “Besokta”. De ar frontend-state och ingar
inte i SQLite eller API-kontraktet.

## Data-kontrakt

Platsobjektets bakatkompatibla karna ska alltid vara:

`{ id, name, category, lat, lng, description }`

Valfria berikningsfalt ar `categories`, `address`, `contacts`, `openingHours`,
`accessibility`, `priceLevel`, `images`, `sources` och `lastVerifiedAt`.

En plats kan tillhora flera kategorier, men `category` ar alltid primar kategori.
Kategori-nycklar maste finnas i bade SQLite-tabellen `categories` och fallbacken
`CATEGORIES` i `public/js/places-data.js`.

Frontend ska lasa `/api/categories` och `/api/places`. Fallback-datasetet far
bara anvandas nar API:t inte ar tillgangligt, exempelvis frontend-only-lage.

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
- `web` (Nginx, publiceras pa port 3003 i CT 201)

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

Lokal verifiering fran `backend/`:

```bash
npm test
```

Efter deploy:

```bash
curl -fsSI https://gotland.tobtech.se
curl -fsS https://gotland.tobtech.se/api/categories
curl -fsS https://gotland.tobtech.se/api/places
```

## AI-agent policy (viktigt)

1. Andra aldrig API-schemat utan att uppdatera frontend + seed + docs.
2. Bevara mobilforst-design, responsivitet och svensk copy.
3. Undvik hardkodad runtime-data i git (`deploy/proxmox/data/`, `backups/`).
4. Anvand befintligt deployscript i stallet for ad-hoc deploykommando.
5. Om Cloudflare-routing andras: dokumentera ny ingress i denna fil och i `deploy/proxmox/README.md`.
6. Vid nya driftsattningssteg: uppdatera samtliga markdownfiler i repot.
7. Kor backendtester efter andringar i schema, repository, seed eller import.
8. Hall `backend/seed-data.json` och `public/js/places-data.js` synkroniserade.

## Snabb felsokning

- Inget svar publikt: verifiera cloudflared i CT 200 och ingress-regel.
- Frontend uppe men tom data: kontrollera `GET /api/places` i CT 201.
- DB-problem: kontrollera att `deploy/proxmox/data/places.db` finns och ar skrivbar.
- Styling bruten: kontrollera att endast `public/css/style.css` andrats for UI.

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
