# Gotlandsguiden i Proxmox

Denna runbook beskriver den faktiska produktionssetupen och hur den driftas.

## Produktionsstatus

- Applikation: `gotlandsguiden`
- Repo: `https://github.com/spiddeer/gotlandguiden.git`
- Proxmox app-container: CT 201 (`gotlandsguiden`)
- Exponerad port i CT 201: `3003`
- Publik doman: `https://gotland.tobtech.se`
- Cloudflare Tunnel konfigurerad i separat CT 200
- Senaste kodbas fore denna dokumentuppdatering: `5869c3a`
- Datastatus: 1 345 aktiva och 17 inaktiva historiska platser i 10 kategorier

## Topologi

1. Cloudflare edge tar emot trafik pa `gotland.tobtech.se`.
2. Cloudflare Tunnel route i CT 200 skickar vidare till `http://192.168.1.224:3003`.
3. I CT 201 terminerar Nginx-container (`web`) pa port 3003.
4. `web` proxyar `/api/*` till `backend:8080`.
5. `backend` anvander SQLite i `deploy/proxmox/data/places.db`.

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
cd /opt/gotlandsguiden/backend
npm test
```

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
2. API svarar inte: kontrollera `backend`-container och DB-volym.
3. Domanen svarar inte: kontrollera cloudflared-process i CT 200 och ingress-regel.

## Viktiga regler

1. Committa aldrig runtime-data i `deploy/proxmox/data/` eller `deploy/proxmox/backups/`.
2. Hall deploy via `deploy.sh` for konsekvent drift.
3. Vid andrad infra/topologi: uppdatera denna fil, `AGENTS.md` och `.github/hooks/README.md`.
4. Kor aldrig seed/import utan att behalla backup och manuellt berikade falt.
5. Verifiera Git-SHA, containerstatus och publikt webb/API separat efter deploy.
