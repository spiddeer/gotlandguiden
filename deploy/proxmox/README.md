# Gutafinn i Proxmox

Denna runbook beskriver den faktiska produktionssetupen och hur den driftas.

## Produktionsstatus

- Applikation: `gutafinn`
- Repo: `https://github.com/spiddeer/gutafinn.git`
- Proxmox app-container: CT 201 (`gutafinn`)
- Exponerad port i CT 201: `3003`
- Publik doman: `https://gutafinn.tobtech.se`
- Tidigare doman: `https://gotland.tobtech.se` (permanent path/query-redirect)
- Cloudflare Tunnel konfigurerad i separat CT 200
- Driftsatt release-SHA: verifieras med `git rev-parse HEAD` enligt avsnittet nedan
- Release-snapshot: 977 besoksmal i 8 interna kategorier och 7 anvandarfilter

## Topologi

1. Cloudflare edge tar emot trafik pa `gutafinn.tobtech.se`.
   `gotland.tobtech.se` gar genom samma tunnel och redirectas av Nginx.
2. Cloudflare Tunnel route i CT 200 skickar vidare till `http://192.168.1.224:3003`.
3. I CT 201 terminerar Nginx-container (`web`) pa port 3003.
4. Backend initierar/migrerar domanschemat och exponerar healthcheck. CMS vantar
   pa gron backend-health och vagrar en oinitierad databas.
5. `web` byggs i tva steg: Node 22 skapar Gutafinns Vite-`dist/` utan legacy-
   `public/`, som kopieras till en ren Nginx-image via `deploy/Dockerfile`.
6. Nginx skickar separata CSP-/browserpolicyer for publik app och CMS, gzippar
   textresurser och ger hashade assets immutable cache.
   `/sw.js` ar alltid `no-store`; manifestet har korrekt MIME-typ och kort cache.
7. Gutafinn laddar OpenStreetMap-plattor direkt i browsern och klustrar
   `/api/places` med Leaflet.markercluster. Mobil/iPad oppnar kartan via `Karta`;
   desktop visar en permanent feed/karta-split med aterstallbart kartfokus.
8. `Overraska mig` kor helt i browsern mot samma API-svar, anvander browser-GPS
   och lagrar endast begransad preferens-/visningshistorik i localStorage.
9. `web` proxyar `/api/*` till `backend:8080`.
10. `backend` anvander SQLite i `deploy/proxmox/data/places.db`.

Backend kor additiva databasmigreringar automatiskt vid start. Seed-steget
anvander `UPSERT`, sa befintlig berikning bevaras nar OSM-snapshoten importeras igen.
Tidigare OSM-poster som saknas i den nya snapshoten markeras inaktiva men ligger
kvar i SQLite for historik och eventuell manuell berikning.

Backend ar ensam agare av domanschemat. Fyra migreringar ar aktiva. Migrering 4
kallmarker importerade
kategorikopplingar, sa nya OSM-snapshots kan synka just de kopplingarna utan att
ta bort manuellt tillagda kategorier. Publika API-anrop visar bara
`is_active = 1` medan inaktiva poster behalls i databasen.

## Kataloger i CT 201

- Projektroot: `/opt/gutafinn`
- Composefil: `/opt/gutafinn/deploy/proxmox/docker-compose.yml`
- Miljofil: `/opt/gutafinn/deploy/proxmox/.env`
- DB-data: `/opt/gutafinn/deploy/proxmox/data/`
- Backuper: `/opt/gutafinn/deploy/proxmox/backups/`

## Snabb drift (rekommenderat)

```bash
cd /opt/gutafinn
./deploy/proxmox/deploy.sh
```

`deploy.sh` gor:

1. `git pull --ff-only`
2. `docker-compose -f deploy/proxmox/docker-compose.yml up -d --build`
3. visar `docker-compose ps`

Kontrollera fore deploy att `main` ar pushad och att backendtesterna passerar:

```bash
cd /opt/gutafinn
npm test
npm run build
cd /opt/gutafinn/backend
npm test
cd /opt/gutafinn/cms
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
git clone https://github.com/spiddeer/gutafinn.git gutafinn
```

### 3) Initiera miljofil

```bash
cd /opt/gutafinn/deploy/proxmox
cp .env.example .env
```

Satt i `.env`:

- `WEB_PORT` (normalt `3003`)
- `API_KEY` (rekommenderas i produktion)
- `ADMIN_PASSWORD` och minst 32 tecken lang `SESSION_SECRET`
- `PASSKEY_RP_ID=gutafinn-admin.tobtech.se` och
  `PASSKEY_ORIGIN=https://gutafinn-admin.tobtech.se` for passkeys
- `SIGNUP_CODE` endast medan nya CMS-konton ska kunna registreras

### 4) Starta stacken

```bash
cd /opt/gutafinn
docker-compose -f deploy/proxmox/docker-compose.yml up -d --build
docker-compose -f deploy/proxmox/docker-compose.yml ps
```

## Systemd for app-autostart

```bash
cp /opt/gutafinn/deploy/proxmox/gutafinn.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now gutafinn.service
systemctl status gutafinn.service
```

## Backup

Kor en manuell backup innan en release som innehaller nya migreringar. Runtime-
databasen ligger utanfor Git och ska inte ersattas med `seed-data.json`.
Backupscriptet anvander SQLite online-backup inuti backend-containern, kor
`PRAGMA quick_check` pa snapshoten och publicerar arkivet atomart forst nar
verifieringen ar godkand. Arkivet innehaller en aterlasningsbar `places.db`.

### Manuell backup

```bash
cd /opt/gutafinn/deploy/proxmox
./backup.sh
```

### Nattlig backup (03:30 UTC)

```bash
cp /opt/gutafinn/deploy/proxmox/gutafinn-backup.service /etc/systemd/system/
cp /opt/gutafinn/deploy/proxmox/gutafinn-backup.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now gutafinn-backup.timer
systemctl list-timers --all | grep gutafinn-backup
```

Verifikation:

```bash
systemctl start gutafinn-backup.service
systemctl status gutafinn-backup.service --no-pager
ls -lh /opt/gutafinn/deploy/proxmox/backups/
tar -tzf /opt/gutafinn/deploy/proxmox/backups/gutafinn-data-*.tar.gz | tail -1
```

## Daglig felsokning

### Kontrollera app lokalt i CT 201

```bash
curl -fsS http://127.0.0.1:3003/api/places | head
docker-compose -f /opt/gutafinn/deploy/proxmox/docker-compose.yml ps
```

### Kontrollera publik doman

```bash
curl -fsSI https://gutafinn.tobtech.se
curl -fsSI https://gutafinn.tobtech.se/index.html
curl -fsSI https://gutafinn.tobtech.se/sw.js
curl -fsSI https://gutafinn.tobtech.se/manifest.webmanifest
curl -fsS https://gutafinn.tobtech.se/api/categories
curl -fsS https://gutafinn.tobtech.se/api/places | head
curl -fsSI https://gutafinn-admin.tobtech.se/admin/login
```

### Kontrollera den aktiva kartan

Oppna `https://gutafinn.tobtech.se` i mobil och desktop och verifiera:

1. Aktiv navetikett ar `Karta`.
2. Platschipet visar 977 platser efter att den kuraterade seed-snapshoten har laddats.
3. OpenStreetMap-plattor och markerkluster laddas.
4. `OpenStreetMap-bidragsgivare` ar synligt utan hover eller tryck.
5. Browserkonsolen saknar runtime-undantag.
6. Desktop visar toppnavigation, 460-540px feed och flexibel karta; mobil/iPad
   visar bottom-nav och enkelkolumn.
7. `Kartfokus` kan aterstallas och behaller kategori/feed-state.
8. Listval oppnar ratt popup och markorklick lyfter ratt kort utan kart-reinitiering.
9. Varje platskort oppnar informationspanelen och visar kalla samt alla
   tillgangliga adress-, kontakt-, oppettids- och tillganglighetsuppgifter.
10. En lank med `?q=raukar&kategori=sevardheter&vy=karta` aterstaller sokning,
    kategori och kartfokus; `plats=<id>` valjer en giltig plats.
11. Fran `Sparat`, verifiera dagsplan med GPS tillaten/nekad, alla tre
    fardsatten, etapp-lankar och fler an atta sparade platser.
12. Panorera kartan, valj `Sok i kartomradet`, kontrollera samma urval i feeden
    och aterstall sedan `Hela Gotland`, aven for ett tomt kartomrade.
13. Kombinera 1/5/10 km med oppettids-, kontakt- och tillganglighetsinfo,
    kontrollera tomt state, rensa allt och ladda om den delbara filter-URL:en.
14. Ladda appen online, verifiera installerbart manifest/service worker, ladda
    om offline och kontrollera appskal + senaste platsdata. Karta/vader far visa
    dokumenterad begransning men appen far inte bli tom.

### Verifiera release och databas i CT 201

```bash
cd /opt/gutafinn
git rev-parse HEAD
docker-compose -f deploy/proxmox/docker-compose.yml ps
docker-compose -f deploy/proxmox/docker-compose.yml exec backend node -e \
  "const { db } = require('./db'); console.log({ migrations: db.prepare('SELECT COUNT(*) count FROM schema_migrations').get().count, active: db.prepare('SELECT COUNT(*) count FROM places WHERE is_active = 1').get().count, inactive: db.prepare('SELECT COUNT(*) count FROM places WHERE is_active = 0').get().count });"
```

### Vanliga problem

1. `git pull` failar: kontrollera remote och branch i `/opt/gutafinn`.
2. Frontend-imagen byggs inte: kontrollera `docker compose ... build web` och
   att `package-lock.json`, `src/` och `deploy/Dockerfile` finns i aktuell SHA.
3. API svarar inte: kontrollera `backend`-container och DB-volym.
4. Domanen svarar inte: kontrollera cloudflared-process i CT 200 och ingress-regel.
5. GPS, vader eller typsnitt blockeras: kontrollera public CSP och
   `Permissions-Policy` i `deploy/nginx-public-headers.conf`.
6. Offline-installation uppdateras inte: kontrollera `no-store` pa `/sw.js`,
   service-worker-scope `/` och att manifest/ikoner finns i webbcontainern.

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
