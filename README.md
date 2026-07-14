# Gotlandsguiden

En mobilforst webbapp for att hitta platser pa Gotland med karta, sok, filtrering och favoriter.

## Live

- Produktion: https://gotland.tobtech.se

## Vad vi bygger

Gotlandsguiden ar en platsguide som kombinerar:

- Interaktiv karta (Leaflet)
- Sokning och kategorifilter
- Favoriter i webblasaren
- Detaljvy for varje plats
- Backend-API for lasning/skapande av platser
- Driftbar setup i Proxmox med Docker Compose, backup och Cloudflare-routing

## Huvudfunktioner

- Karta centrerad pa Gotland
- Filter for tillgangliga kategorier, inklusive boende, aktiviteter, natur och service
- Sokruta over namn, beskrivning, adress och kategori
- Geolokalisering och avstandsvisning
- Favoriter via localStorage
- Light/dark mode
- Marker clustering for battre prestanda med manga platser

## Tech stack

### Frontend

- Vanilla JavaScript
- Leaflet + Leaflet MarkerCluster
- HTML/CSS (mobilforst, responsiv)

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
backend/
  db.js
  migrations.js
  place-repository.js
  server.js
  seed.js
  seed-data.json
  Dockerfile
  package.json

public/
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

Frontend laser `/api/categories` och `/api/places` som primar kalla. Den
inbyggda OpenStreetMap-snapshoten anvands bara som fallback i frontend-only-lage.

## Databas och import

- Migreringar kors automatiskt nar backend startar.
- `npm run seed` anvander `UPSERT` och kan koras flera ganger.
- Seed uppdaterar bara OpenStreetMaps karndata och raderar inte manuellt
  berikade oppettider, kontakter, bilder eller kallor.
- Varje import loggas i tabellen `import_runs`.
- Oppettider kan lagras bade som kallans originaltext och som strukturerade
  veckotider med datumundantag.

## Kora lokalt (snabbstart)

### Alternativ A: Docker Compose

```bash
git clone https://github.com/spiddeer/gotlandguiden.git
cd gotlandguiden
docker compose up -d --build
```

App: http://localhost:3003

### Alternativ B: Frontend-only

Oppna public/index.html i en lokal webserver.

## Produktion och drift

Nuvarande produktion kor i Proxmox med separat app-container och Cloudflare edge.

- App-runbook: [deploy/proxmox/README.md](deploy/proxmox/README.md)
- Agentkontext: [AGENTS.md](AGENTS.md)
- Hook-dokumentation: [.github/hooks/README.md](.github/hooks/README.md)

## Deployflode

I app-containern (CT 201):

```bash
cd /opt/gotlandsguiden
./deploy/proxmox/deploy.sh
```

Scriptet gor:

1. git pull --ff-only
2. docker-compose up -d --build
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
