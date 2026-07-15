# Gotlandsguiden i Proxmox

Denna runbook beskriver den faktiska produktionssetupen och hur den driftas.

## Produktionsstatus

- Applikation: `gotlandsguiden`
- Repo: `https://github.com/spiddeer/gotlandguiden.git`
- Proxmox app-container: CT 201 (`gotlandsguiden`)
- Exponerad port i CT 201: `3003`
- Publik doman: `https://gotland.tobtech.se`
- Cloudflare Tunnel konfigurerad i separat CT 200
- Senast live-verifierade release: `1982690` (2026-07-15)
- Datastatus: 1 345 aktiva och 17 inaktiva historiska platser i 10 kategorier

## Topologi

1. Cloudflare edge tar emot trafik pa `gotland.tobtech.se`.
2. Cloudflare Tunnel route i CT 200 skickar vidare till `http://192.168.1.224:3003`.
3. I CT 201 terminerar Nginx-container (`web`) pa port 3003.
4. `web` byggs i tva steg: Node 22 skapar Gutafinns Vite-`dist/`, som kopieras
   till en ren Nginx-image via `deploy/Dockerfile`.
5. Gutafinn laddar OpenStreetMap-plattor direkt i browsern och klustrar
   `/api/places` med Leaflet.markercluster. Mobil/iPad oppnar kartan via `Karta`;
   desktop visar en permanent feed/karta-split med aterstallbart kartfokus.
6. `Overraska mig` kor helt i browsern mot samma API-svar, anvander browser-GPS
   och lagrar endast begransad preferens-/visningshistorik i localStorage.
7. `web` proxyar `/api/*` till `backend:8080`.
8. `backend` anvander SQLite i `deploy/proxmox/data/places.db`.

Backend kor additiva databasmigreringar automatiskt vid start. Seed-steget
anvander `UPSERT`, sa befintlig berikning bevaras nar OSM-snapshoten importeras igen.
Tidigare OSM-poster som saknas i den nya snapshoten markeras inaktiva men ligger
kvar i SQLite for historik och eventuell manuell berikning.

Fyra migreringar ar aktiva. Migrering 4 kallmarker importerade
kategorikopplingar, sa nya OSM-snapshots kan synka just de kopplingarna utan att
ta bort manuellt tillagda kategorier. Publika API-anrop visar bara
`is_active = 1` medan inaktiva poster behalls i databasen.

## Kataloger i CT 201

- Projektroot: `/opt/gotlandsguiden`
- Composefil: `/opt/gotlandsguiden/deploy/proxmox/docker-compose.yml`
- Miljofil: `/opt/gotlandsguiden/deploy/proxmox/.env`
- DB-data: `/opt/gotlandsguiden/deploy/proxmox/data/`
- Backuper: `/opt/gotlandsguiden/deploy/proxmox/backups/`

## Snabb drift (rekommenderat)

```bash
cd /opt/gotlandsguiden
./deploy/proxmox/deploy.sh
```

`deploy.sh` gor:

1. `git pull --ff-only`
2. `docker-compose -f deploy/proxmox/docker-compose.yml up -d --build`
3. visar `docker-compose ps`

Kontrollera fore deploy att `main` ar pushad och att backendtesterna passerar:

```bash
cd /opt/gotlandsguiden
npm test
npm run build
cd /opt/gotlandsguiden/backend
npm test
```

Root-builden verifierar TanStack-routegenerering, TypeScript och Vite. Docker
installerar frontendberoenden med `npm ci`, sa Node behover inte finnas pa CT:n
for normal deploy om Dockerbygget ar den enda verifieringen dar.
Webbimagen kor dessutom rootens Vitest-svit fore varje produktionsbuild.

Efter en release som andrar `Overraska mig`, browser-verifiera dessutom:

1. GPS tillaten och nekad.
2. `30 min`, `1-2 timmar` och `Halvdag`.
3. `Till fots`, `Cykel` och `Bil` med respektive OpenStreetMap-motor.
4. Fem `Visa ett annat tips` utan upprepning nar kandidatpoolen racker.
5. Att stamningsbildsetiketten ar synlig och att back aterstaller startsidan.

Efter en release som andrar layout eller karta, browser-verifiera 320, 390, 768,
820, 1024 landskap, 1280 och 1440px. Kontrollera att mobil/iPad inte far
horisontell sidscroll, att desktop visar feed/karta sida vid sida, att
`Kartfokus -> Hem` bevarar filter och att listval/markorklick synkas utan att
Leaflet-instansen byggs om.

## Grundinstallation (om ny CT byggs)

### 1) Installera beroenden i CT

```bash
apt-get update
apt-get install -y docker.io docker-compose git
```

### 2) Klona repo

```bash
mkdir -p /opt
cd /opt
git clone https://github.com/spiddeer/gotlandguiden.git gotlandsguiden
```

### 3) Initiera miljofil

```bash
cd /opt/gotlandsguiden/deploy/proxmox
cp .env.example .env
```

Satt i `.env`:

- `WEB_PORT` (normalt `3003`)
- `API_KEY` (rekommenderas i produktion)

### 4) Starta stacken

```bash
cd /opt/gotlandsguiden
docker-compose -f deploy/proxmox/docker-compose.yml up -d --build
docker-compose -f deploy/proxmox/docker-compose.yml ps
```

## Systemd for app-autostart

```bash
cp /opt/gotlandsguiden/deploy/proxmox/gotlandsguiden.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now gotlandsguiden.service
systemctl status gotlandsguiden.service
```

## Backup

Kor en manuell backup innan en release som innehaller nya migreringar. Runtime-
databasen ligger utanfor Git och ska inte ersattas med `seed-data.json`.

### Manuell backup

```bash
cd /opt/gotlandsguiden/deploy/proxmox
./backup.sh
```

### Nattlig backup (03:30 UTC)

```bash
cp /opt/gotlandsguiden/deploy/proxmox/gotlandsguiden-backup.service /etc/systemd/system/
cp /opt/gotlandsguiden/deploy/proxmox/gotlandsguiden-backup.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now gotlandsguiden-backup.timer
systemctl list-timers --all | grep gotlandsguiden-backup
```

Verifikation:

```bash
systemctl start gotlandsguiden-backup.service
systemctl status gotlandsguiden-backup.service --no-pager
ls -lh /opt/gotlandsguiden/deploy/proxmox/backups/
```

## Daglig felsokning

### Kontrollera app lokalt i CT 201

```bash
curl -fsS http://127.0.0.1:3003/api/places | head
docker-compose -f /opt/gotlandsguiden/deploy/proxmox/docker-compose.yml ps
```

### Kontrollera publik doman

```bash
curl -fsSI https://gotland.tobtech.se
curl -fsS https://gotland.tobtech.se/api/categories
curl -fsS https://gotland.tobtech.se/api/places | head
```

### Kontrollera den aktiva kartan

Oppna `https://gotland.tobtech.se` i mobil och desktop och verifiera:

1. Aktiv navetikett ar `Karta`.
2. Platschipet visar 1 345 platser.
3. OpenStreetMap-plattor och markerkluster laddas.
4. `OpenStreetMap-bidragsgivare` ar synligt utan hover eller tryck.
5. Browserkonsolen saknar runtime-undantag.
6. Desktop visar toppnavigation, 460-540px feed och flexibel karta; mobil/iPad
   visar bottom-nav och enkelkolumn.
7. `Kartfokus` kan aterstallas och behaller kategori/feed-state.
8. Listval oppnar ratt popup och markorklick lyfter ratt kort utan kart-reinitiering.

### Verifiera release och databas i CT 201

```bash
cd /opt/gotlandsguiden
git rev-parse HEAD
docker-compose -f deploy/proxmox/docker-compose.yml ps
docker-compose -f deploy/proxmox/docker-compose.yml exec backend node -e \
  "const { db } = require('./db'); console.log({ migrations: db.prepare('SELECT COUNT(*) count FROM schema_migrations').get().count, active: db.prepare('SELECT COUNT(*) count FROM places WHERE is_active = 1').get().count, inactive: db.prepare('SELECT COUNT(*) count FROM places WHERE is_active = 0').get().count });"
```

### Vanliga problem

1. `git pull` failar: kontrollera remote och branch i `/opt/gotlandsguiden`.
2. Frontend-imagen byggs inte: kontrollera `docker compose ... build web` och
   att `package-lock.json`, `src/` och `deploy/Dockerfile` finns i aktuell SHA.
3. API svarar inte: kontrollera `backend`-container och DB-volym.
4. Domanen svarar inte: kontrollera cloudflared-process i CT 200 och ingress-regel.

## Viktiga regler

1. Committa aldrig runtime-data i `deploy/proxmox/data/` eller `deploy/proxmox/backups/`.
2. Hall deploy via `deploy.sh` for konsekvent drift.
3. Vid andrad infra/topologi: uppdatera denna fil, `AGENTS.md` och `.github/hooks/README.md`.
4. Kor aldrig seed/import utan att behalla backup och manuellt berikade falt.
5. Verifiera Git-SHA, containerstatus och publikt webb/API separat efter deploy.
6. Verifiera `npm test` och `npm run build` vid frontendandringar; `public/` ar legacy och
   monteras inte langre av Compose.
7. Kartan ar en browserkonsument av OpenStreetMap: ta aldrig bort eller gom attributionen.
8. Driftsatt layout/karta ska verifieras mot hela viewportmatrisen och den
   deployade Git-SHA:n, inte enbart mot lokalt bygge.
