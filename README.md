# Gutafinn / Gotlandsguiden

Gutafinn ar den aktiva mobilforst-frontenden for att hitta saker att gora, se
och ata pa Gotland just nu. Repot innehaller ocksa Gotlandsguidens befintliga
Express/SQLite-API, OSM-import och Proxmox-drift.

Dokumentationen ar avstamd mot kodbasen och commit `5869c3a` den 14 juli 2026.

## Live

- Produktion: https://gotland.tobtech.se

## Vad vi bygger

Produkten kombinerar:

- GPS-inspirerad Gutafinn-startsida med sokning och kategorifilter
- Fotografiska kort for narhet, aktivitet, sevardhet och mat
- Lokal sparstatus och fast mobilnavigation
- Vader- och solnedgangsoversikt for Ljugarn
- Backend-API for lasning/skapande av platser
- Driftbar setup i Proxmox med Docker Compose, backup och Cloudflare-routing

## Huvudfunktioner

- 440px mobilcanvas med fotografisk kusthero och Live GPS-status
- Kombinerad sok- och kategorifiltrering for Allt, Gora, Se och Ata
- Featured-kort med verifieringsdatum, GPS-avstand, gangtid, oppetstatus och `Ta mig hit`
- Alla 1 345 aktiva platser laddas fran produktions-API:t
- Verkligt GPS-avstand, uppskattad gangtid och livevader/solnedgang
- Beständig sparlista i localStorage
- Fem genererade, optimerade WebP-bilder i `src/assets/`
- shadcn/ui-komponenter, Lucide-ikoner och semantiska OKLCH-tokens
- Tillgangliga fokus-, save- och navigationsstates samt safe-area-stod
- Befintligt API med 1 345 aktiva OSM-platser fortsatt tillgangligt under `/api/*`

## Tech stack

### Frontend

- React 19 + TypeScript + Vite
- Node.js 22 eller nyare for lokal build och test
- TanStack Router med file-based routes
- Tailwind CSS v4 via `@theme inline`
- shadcn/ui (`new-york`) + Lucide
- Fraunces + Inter

### Backend

- Node.js + Express
- SQLite (better-sqlite3)
- Versionsstyrda, additiva databasmigreringar

### Drift

- Docker + Docker Compose
- Proxmox LXC
- Cloudflare Tunnel for publik doman

## Projektstruktur

```text
src/
  assets/                 # fem optimerade Gotlandsbilder
  components/ui/          # shadcn/ui-grundkomponenter
  routes/                 # TanStack Router-routes
  styles.css              # Tailwind v4 + semantiska OKLCH-tokens
deploy/
  Dockerfile              # Vite-build till Nginx
backend/
  db.js
  import-osm.js
  migrations.js
  place-repository.js
  server.js
  seed.js
  seed-data.json
  Dockerfile
  package.json
  test/

public/                    # bevarad legacy-Leaflet-frontend
  index.html
  css/style.css
  js/app.js
  js/places-data.js

deploy/
  nginx.conf
  proxmox/
    docker-compose.yml
    deploy.sh
    backup.sh
    gotlandsguiden.service
    gotlandsguiden-backup.service
    gotlandsguiden-backup.timer
    README.md
```

## API

### Hamta alla platser

- Method: GET
- Path: /api/places
- Returnerar bakatkompatibla karnfalt plus kategorier, adress, kontaktuppgifter,
  oppettider, bilder, kallor och verifieringsdatum nar dessa finns.

### Hamta kategorier

- Method: GET
- Path: /api/categories

### Hamta en plats

- Method: GET
- Path: /api/places/:id

### Skapa plats

- Method: POST
- Path: /api/places
- Header: X-API-Key (kravs alltid; skrivning ar avstangd om API_KEY saknas)
- Body:

```json
{
  "name": "Min plats",
  "category": "mat",
  "categories": ["mat", "shopping"],
  "lat": 57.64,
  "lng": 18.29,
  "description": "Kort beskrivning",
  "address": {
    "street": "Strandgatan 1",
    "postalCode": "621 56",
    "locality": "Visby"
  },
  "contacts": {
    "website": "https://example.se",
    "phone": "+46 498 00 00 00"
  },
  "openingHours": {
    "raw": "Mo-Fr 10:00-18:00",
    "note": "Sasongsoppet"
  }
}
```

### Berika en plats

- Method: PATCH
- Path: /api/places/:id
- Header: X-API-Key
- Body: de falt som ska andras, exempelvis adress, kontaktuppgifter,
  oppettider, tillganglighet, prisniva, bilder eller kallor.

Tillatna kategorier:

- strand
- sevardhet
- mat
- smultronstallen
- boende
- aktivitet
- natur
- shopping
- familj
- service

API:t fortsatter exponera `/api/categories` och `/api/places`. Gutafinns aktiva
startsida laddar `/api/places`, grupperar API-kategorierna i Gora, Se och Ata,
och sorterar efter verkligt GPS-avstand nar anvandaren godkanner positionering.
Den inbyggda OpenStreetMap-snapshoten i `public/` bevaras for importens
reproducerbarhet men ar inte den frontend som Compose serverar.

## Databas och import

- Migreringar kors automatiskt nar backend startar.
- `npm run seed` anvander `UPSERT` och kan koras flera ganger.
- Seed uppdaterar OpenStreetMaps karndata och fyller adress, kontaktuppgifter och
  oppettider nar de finns i kallan. Manuellt berikade falt skrivs inte tomma.
- OSM-poster som inte langre finns i aktuell snapshot markeras inaktiva i stallet
  for att raderas, sa manuell historik och berikning bevaras.
- Importagda kategorikopplingar synkas mot aktuell snapshot. Manuellt tillagda
  kategorikopplingar lamnas ororda via `source_type` fran migrering 4.
- Varje import loggas i tabellen `import_runs`.
- Oppettider kan lagras bade som kallans originaltext och som strukturerade
  veckotider med datumundantag.

### Uppdatera OpenStreetMap-snapshoten

Kor importen fran `backend/` i repot:

```bash
npm run import:osm
npm test
```

Importen hamtar namngivna platser inom Gotland inklusive Gotska Sandon, delar
upp Overpass-fragan i mindre batchar, deduplicerar samma plats inom 250 meter
och skriver bade `backend/seed-data.json` och frontendens fallback-snapshot.
Varje plats kallsparas till sitt OpenStreetMap-objekt. Aktuell snapshot innehaller
1 345 platser fordelade over samtliga tio kategorier.

## Aktuell dataproduktion

Produktionsdatabasen innehaller vid senaste kontrollen:

- 1 345 aktiva platser och 17 inaktiva historiska platser
- 10 kategorier och 4 applicerade databasmigreringar
- 165 platser med oppettider
- 131 platser med adress
- 250 platser med minst en kontaktuppgift

SQLite ar kallan i drift. `backend/seed-data.json` och
`public/js/places-data.js` versionsstyrs for reproducerbar seed respektive
frontend-fallback, men ersatter inte produktionsdatabasen.

## Verifiering

Frontendens produktionstypning/build kors fran projektroten och backendens
migrations-, API- och importtester fran `backend/`:

```bash
npm test
npm run build
cd backend
npm test
```

Efter deploy ska bade webb och API verifieras:

```bash
curl -fsSI https://gotland.tobtech.se
curl -fsS https://gotland.tobtech.se/api/categories
curl -fsS https://gotland.tobtech.se/api/places
```

## Kora lokalt (snabbstart)

### Alternativ A: Docker Compose

```bash
git clone https://github.com/spiddeer/gotlandguiden.git
cd gotlandguiden
docker compose up -d --build
```

App: http://localhost:3003

### Alternativ B: lokal Vite-utveckling

```bash
npm install
npm run dev
```

Verifiera frontenden med `npm test` och `npm run build`.

## Produktion och drift

Nuvarande produktion kor i Proxmox med separat app-container och Cloudflare edge.

- App-runbook: [deploy/proxmox/README.md](deploy/proxmox/README.md)
- Agentkontext: [AGENTS.md](AGENTS.md)
- Designkontrakt: [DESIGN.md](DESIGN.md)
- Claude/IJFW-kontext: [CLAUDE.md](CLAUDE.md)
- Hook-dokumentation: [.github/hooks/README.md](.github/hooks/README.md)

## Deployflode

I app-containern (CT 201):

```bash
cd /opt/gotlandsguiden
./deploy/proxmox/deploy.sh
```

Scriptet gor:

1. git pull --ff-only
2. bygger och startar backend samt Gutafinns Vite/Nginx-image med Docker Compose
3. visar containerstatus

## Backup

Manuell backup:

```bash
cd /opt/gotlandsguiden/deploy/proxmox
./backup.sh
```

Nattlig backup hanteras via systemd timer:

- gotlandsguiden-backup.timer
- gotlandsguiden-backup.service

## Status

Projektet ar aktivt i produktion och dokumentation ar uppdaterad for att andra utvecklare och AI-tjanster snabbt ska kunna forsta helheten.
