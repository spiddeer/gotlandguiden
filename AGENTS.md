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
- `backend/seed.js`: Idempotent OSM-import vid containerstart.
- `backend/seed-data.json`: Seed-dataset.

## State & Rendering-kontrakt

I `public/js/app.js` ar huvudprincipen: uppdatera state -> kalla `render()`.

Aktuell state-nycklar:

- `places`
- `userLatLng`
- `activeCategory`
- `query`
- `favorites`
- `selectedId`

Bryt inte detta monster utan bra skal.

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

## AI-agent policy (viktigt)

1. Andra aldrig API-schemat utan att uppdatera frontend + seed + docs.
2. Bevara mobilforst-design, responsivitet och svensk copy.
3. Undvik hardkodad runtime-data i git (`deploy/proxmox/data/`, `backups/`).
4. Anvand befintligt deployscript i stallet for ad-hoc deploykommando.
5. Om Cloudflare-routing andras: dokumentera ny ingress i denna fil och i `deploy/proxmox/README.md`.
6. Vid nya driftsattningssteg: uppdatera samtliga markdownfiler i repot.

## Snabb felsokning

- Inget svar publikt: verifiera cloudflared i CT 200 och ingress-regel.
- Frontend uppe men tom data: kontrollera `GET /api/places` i CT 201.
- DB-problem: kontrollera att `deploy/proxmox/data/places.db` finns och ar skrivbar.
- Styling bruten: kontrollera att endast `public/css/style.css` andrats for UI.

## Relaterad dokumentation

- `deploy/proxmox/README.md`: drift/runbook
- `.github/hooks/README.md`: hooksystem och kvalitetsregler
