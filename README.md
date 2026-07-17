# Gutafinn

Gutafinn ar den aktiva responsiva, mobilforst-frontenden for att hitta saker att
gora, se och ata pa Gotland just nu. Samma React-app fungerar som enkelkolumn pa
mobil och iPad samt som synkroniserad feed/karta pa desktop. Repot innehaller
ocksa Gutafinns Express/SQLite-API, passkey-skyddade CMS, OSM-import och
Proxmox-drift.

Varje push till `main` och varje pull request verifieras av GitHub Actions med frontendtest och
bygge, backend- och CMS-tester, tom databasstart, Compose-validering samt alla
tre Dockerbyggen. Backend- och CMS-images startas dessutom mot en gemensam tom
SQLite-volym. Den driftsatta Nginx-konfigurationen syntaxkontrolleras ocksa mot
den byggda webbimagen.

Dokumentationen ar avstamd mot produktionssetupen den 17 juli 2026. Aktuell
driftsatt Git-SHA verifieras med kommandot i Proxmox-runbooken.

## Live

- Produktion: https://gutafinn.tobtech.se
- Tidigare adress: https://gotland.tobtech.se (permanent redirect med bevarad path/query)

## Vad vi bygger

Produkten kombinerar:

- GPS-inspirerad Gutafinn-startsida med sokning och kategorifilter
- Fotografiska kort for narhet, aktivitet, sevardhet och mat
- Lokal sparstatus, fast mobilnavigation och desktop-topnavigation
- Inbyggd Leaflet-karta med klustrade platser, GPS-markor och tvavagsval
- Vader- och solnedgangsoversikt for Ljugarn
- Backend-API for lasning/skapande av platser
- Driftbar setup i Proxmox med Docker Compose, backup och Cloudflare-routing
- Passkey-skyddat CMS for redigering, arkivering och aterstallning av platser

## Huvudfunktioner

- Fotografisk kusthero och Live GPS-status i 440px mobilcanvas
- Rymligare enkelkolumn upp till iPad-portratt och feed/karta sida vid sida fran
  1024px landskap eller 1280px bredd
- 460-540px scrollande desktop-feed, flexibel sticky karta och aterstallbart
  `Kartfokus` som bevarar aktiv sokning och kategori
- Kombinerad sok- och kategorifiltrering for Mat & dryck, Sevardheter, Bad,
  Natur, Aktiviteter, Familj och Lokalt
- `Overraska mig` skapar ett GPS-baserat mikroaventyr fran vald tid och fardsatt
  med faktabaserade skal, adaptiv sokradie och repetitionsskydd
- `Planera min dag` ordnar upp till atta sparade platser i en narsta-stopp-rutt
  for gang, cykel eller bil och oppnar varje etapp i OpenStreetMap
- Featured-kort med verifieringsdatum, GPS-avstand, gangtid, oppetstatus och `Ta mig hit`
- Varje platskort oppnar en informationspanel med all tillganglig adress,
  kontakt, oppettid, tillganglighet, position, kalla och aktualitet
- Den kuraterade snapshoten innehaller 977 besoksmal; bensin, laddning, boende,
  generisk handel och vanlig service ingar inte i den publika katalogen
- Synkroniserad Leaflet-karta: listval fokuserar markor och markorklick lyfter
  motsvarande kort utan att kartinstansen eller oforandrade markorer byggs om
- `Sok i kartomradet` begransar karta och lista till aktuell viewport och kan
  aterstallas till hela Gotland fran feeden
- OpenStreetMap-plattor, markercluster och permanent synlig attribution
- Verkligt GPS-avstand, uppskattad gangtid och livevader/solnedgang
- Beständig sparlista i localStorage
- Delbara lankar som aterstaller sokning, kategori, kartfokus och vald plats
- Praktiska filter for GPS-avstand och om oppettider, kontakt eller
  tillganglighetsinformation finns i kallan
- Installerbar PWA med offline-appskal och senast lyckat hamtade platsdata
- Besokare kan foresla platsrattelser som granskas manuellt i CMS utan att
  platsregistret andras automatiskt
- Redaktionella samlingar med 2-20 ordnade platser, publiceringsflode i CMS och
  delbara `samling=`-lankar i appen
- Fem genererade, optimerade WebP-bilder i `src/assets/`
- shadcn/ui-komponenter, Lucide-ikoner och semantiska OKLCH-tokens
- Tillgangliga fokus-, save- och navigationsstates samt safe-area-stod
- Skip-lank, sanningsenliga GPS-states, 44px touchytor och tydligt markerade
  stamningsbilder
- Befintligt API med rik platsdata fortsatt tillgangligt under `/api/*`

## Tech stack

### Frontend

- React 19 + TypeScript + Vite
- Node.js 22 eller nyare for lokal build och test
- TanStack Router med file-based routes
- Tailwind CSS v4 via `@theme inline`
- shadcn/ui (`new-york`) + Lucide
- Leaflet 1.9 + Leaflet.markercluster
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
  components/gutafinn-map.tsx # stabil Leaflet-karta, kluster, GPS och platsval
  components/gutafinn-map.test.tsx # karta/livscykel/selection i jsdom
  components/surprise-adventure.tsx # tillgangligt helskarmsflode for Overraska mig
  components/ui/          # shadcn/ui-grundkomponenter
  lib/surprise.ts         # radie, urval, motiveringar och OSM-navigation
  lib/surprise-storage.ts # validerad, begransad lokal historik
  routes/                 # TanStack Router-routes
  styles.css              # Tailwind v4, Leaflet-krom och semantiska OKLCH-tokens
deploy/
  Dockerfile              # Vite-build till Nginx
  nginx-public-headers.conf # CSP och browserpolicy for den publika appen
  nginx-admin-headers.conf  # strikt separat policy for CMS-hostnamnet
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

cms/                       # passkey-/reservkontoskyddad platsadministration
  src/
  test/

public/                    # bevarad legacy-Leaflet-frontend; exkluderas ur Vite-build
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
    gutafinn.service
    gutafinn-backup.service
    gutafinn-backup.timer
    README.md
```

## Overraska mig

Funktionen kraver GPS och ateranvander de platser som redan laddats fran
`/api/places`. Anvandaren valjer `30 min`, `1-2 timmar` eller `Halvdag` och
fardsattet `Till fots`, `Cykel` eller `Bil`. Kandidatradien beraknas fran vald
tid och uppskattad hastighet, vaxer i steg om 1 km nar underlaget ar glest och
stannar alltid vid 10 km.

Urvalet anvander endast avstand, produktkategori, `lastVerifiedAt` och lokal
visningshistorik. Motiveringar ar fasta faktamallar; oppettider, vader och
platsbilder anvands inte som urvalsloften. Kortets bild ar uttryckligen en
stamningsbild fran Gotland, inte ett foto av den exakta platsen.
Katalogen och urvalet anvander endast besokskategorier; boende, service,
bensin och laddning ar borttagna redan i importunderlaget.

Val och historik ligger endast i browserns localStorage:

- `gutafinn_surprise_time_budget`
- `gutafinn_surprise_travel_mode`
- `gutafinn_surprise_recent_place_ids`
- `gutafinn_surprise_recent_categories`

Historiklistorna valideras vid lasning och begransas till 20 poster. GPS-position
lagras inte. `Ta mig dit` oppnar OpenStreetMap med gang-, cykel- eller bilmotor
enligt valt fardsatt.

## Delbara upptacktslankar

Sokning, publik kategori, kartfokus, vald plats, redaktionell samling och praktiska filter speglas i
adressfaltet med `q`, `kategori`, `vy=karta`, `plats`, `samling`, `radie` och `fakta`.
URL-varden valideras och okanda
kategorier eller ogiltiga plats-/samlings-id:n ignoreras. Browserns bakat-/framatknappar
aterstaller lankens state. Sparade plats-id:n och GPS-koordinater ingar aldrig i
URL:en.

## Dagsplanerare

Fran `Sparat` kan anvandaren bygga en lokal dagsplan med hogst atta stopp.
Med GPS startar ordningen vid den verkliga positionen; utan GPS anvands platsen
som sparades forst som start. Darefter valjs narmaste aterstaende stopp stegvis.
Raknade avstand ar fagelvag och restider ar uppskattningar for gang, cykel eller
bil. Varje etapp oppnas separat med ratt OpenStreetMap-motor for faktisk vag.
Planen och GPS-positionen lagras inte.

## Sok i kartomradet

Efter panorering eller zoomning kan anvandaren uttryckligen anvanda kartans
aktuella granser som ett extra filter. Samma grans appliceras pa listan och
markorerna, ovanpa sokning, kategori och sparvy. En tydlig status i feeden
aterstaller hela Gotland. Kartgransen ar tillfallig browser-state och lagras
inte som GPS eller i den delbara URL:en.

## Praktiska filter

Filterpanelen kombinerar 1, 5 eller 10 km fran browserns aktuella GPS-position
med tre kallnara val: `Oppettider finns`, `Kontakt finns` och
`Tillganglighetsinfo`. De senare lovar bara att uppgiften finns, inte att en
plats ar oppen eller fullt tillganglig. Snapshoten saknar strukturerade
veckotider och har glest tillganglighetsunderlag, sa Gutafinn visar medvetet
inte missvisande `Oppet nu`, `Gratis` eller `Rullstolsanpassat`-filter. Alla val
kan rensas samlat och foljer med i en delbar URL utan GPS-koordinater.

## Offline och installation

Produktionsbygget genererar manifest, 192/512px appikoner och en versionssatt
service worker. Appskalets lokala JS, CSS och bilder forcachelagras, och
`/api/places`, `/api/categories` samt `/api/collections` varms vid installation och uppdateras med
network-first. Vid natfel anvands senaste lyckade API-svar. En synlig
offline-status forklarar att kartplattor och livevader ar externa och darfor kan
saknas utan nat. Gutafinn service-worker-cachar inte GPS, externa kartplattor,
Open-Meteo eller andra origin-resurser.
Rattelseformular ar en onlinefunktion: rapporter koas inte i browsern och ett
forsok utan nat visar ett tydligt fel i stallet for att lova senare leverans.

## API

### Hamta alla platser

- Method: GET
- Path: /api/places
- Returnerar bakatkompatibla karnfalt plus kategorier, adress, kontaktuppgifter,
  oppettider, bilder, kallor och verifieringsdatum nar dessa finns.

### Hamta kategorier

- Method: GET
- Path: /api/categories

### Hamta redaktionella samlingar

- Method: GET
- Path: /api/collections
- Returnerar endast publicerade samlingar med minst tva aktiva platser.
- Varje objekt innehaller `id`, titel, beskrivning, sortering och en ordnad
  `placeIds`-lista. Samlingsurvalet andrar aldrig platsobjekten.

### Hamta en plats

- Method: GET
- Path: /api/places/:id

### Foresla en rattelse

- Method: POST
- Path: /api/places/:id/corrections
- Body: `issueType` (`hours`, `contact`, `location`, `accessibility`, `closed`
  eller `other`), `message` (10-1000 tecken) och frivillig `email`.
- Svaret `202` betyder att rapporten ligger i manuell granskningsko; platsdata
  andras aldrig automatiskt.
- Hojst fem forsok per klient-IP och timme tillats som standard. IP-adressen
  anvands bara i processminnet for begransningen och lagras inte i databasen.

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
- aktivitet
- natur
- shopping
- familj

API:t fortsatter exponera `/api/categories` och `/api/places`. Gutafinns aktiva
startsida laddar `/api/places`, mappar kategorierna till sju begripliga
besoksteman och sorterar efter verkligt GPS-avstand nar anvandaren godkanner positionering.
Publika GET-svar kan cachelagras i fem minuter och atervalideras med ETag;
`/healthz` skickas alltid med `Cache-Control: no-store`. Skrivnyckeln jamfors
med konstant-tidsjämforelse.
Den inbyggda OpenStreetMap-snapshoten i `public/` bevaras for importens
reproducerbarhet men ar inte den frontend som Compose eller Vite serverar.

## Databas och import

- Backend ar ensam agare av domanschemat och kor migreringar automatiskt vid
  start. CMS startar forst efter gron backend-health och vagrar en oinitierad DB.
- Migrering 5 skapar `visitor_corrections`. CMS visar koade rapporter med
  statusarna `new`, `reviewed`, `resolved` och `dismissed`, granskaridentitet
  samt frivillig granskningsanteckning.
- Migrering 6 skapar `collections` och `collection_places`. Backend ager schemat;
  CMS skapar, ordnar och publicerar samlingarna utan att duplicera platsdata.
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
Varje plats kallsparas till sitt OpenStreetMap-objekt. Importen valjer mat och
dryck, sevardheter, bad, natur, utflykter, aktiviteter, familjemal och lokala
gards-/hantverksmal. Den hamtar inte boende, bensin, laddning, bank, vard eller
generisk handel. `node import-osm.js --curate-existing` kan renodla en verifierad
snapshot deterministiskt nar Overpass tillfalligt ar otillgangligt.

## Aktuellt releaseunderlag

Den kuraterade seed-snapshoten innehaller:

- 977 besoksmal i 8 interna kategorier och 7 anvandarfilter
- 0 service-, boende-, bensin-, ladd- eller generiska butiksposter
- 81 platser med oppettider
- 58 platser med adress
- 138 platser med minst en kontaktuppgift
- OpenStreetMap-kalla och verifieringsdatum for samtliga 977 platser

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
cd ../cms
npm test
```

Efter deploy ska bade webb och API verifieras:

```bash
curl -fsSI https://gutafinn.tobtech.se
curl -fsS https://gutafinn.tobtech.se/api/categories
curl -fsS https://gutafinn.tobtech.se/api/places
```

Verifiera dessutom i en riktig browser vid 320, 390, 768, 820, 1024 landskap,
1280 och 1440px. Mobil/iPad ska vara enkelkolumn utan sidscroll; desktop ska
visa feed och karta sida vid sida. Kontrollera att filter inte skapar en ny
Leaflet-instans, att lista och markorer synkas at bada hall, att `Kartfokus` kan
aterstallas samt att `OpenStreetMap-bidragsgivare` alltid ar synligt.

## Kora lokalt (snabbstart)

### Alternativ A: Docker Compose

```bash
git clone https://github.com/spiddeer/gutafinn.git
cd gutafinn
docker-compose -f deploy/proxmox/docker-compose.yml up -d --build
```

App: http://localhost:3003

### Alternativ B: lokal Vite-utveckling

```bash
npm install
npm run dev
```

Verifiera frontenden med `npm test` och `npm run build`.

## Sakerhet och leverans

Nginx skickar separata sakerhetspolicyer for publik app och CMS. Den publika
policyn tillater endast de externa resurser appen faktiskt anvander: Google
Fonts, Open-Meteo och HTTPS-kartbilder. Inline-stilar tillats eftersom Leaflet
positionerar kartlager via DOM-stilar; inline-script ar fortsatt blockerat. GPS
ar tillaten for den egna origin.
Hashade Vite-assets far ett ars immutable cache, `index.html` atervalideras och
API-cachen styrs av backend. Rootens beroenden ar fastlagda med avsiktliga
semver-intervall och verifieras via lockfilen i CI och Dockerbygget.

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
cd /opt/gutafinn
./deploy/proxmox/deploy.sh
```

Scriptet gor:

1. git pull --ff-only
2. bygger och startar backend samt Gutafinns Vite/Nginx-image med Docker Compose
3. visar containerstatus

## Backup

SQLite-backupen omfattar hela `places.db`, inklusive rattelsekon och dess
granskningsstatus.

Manuell backup:

```bash
cd /opt/gutafinn/deploy/proxmox
./backup.sh
```

Nattlig backup hanteras via systemd timer:

- gutafinn-backup.timer
- gutafinn-backup.service

## Status

Projektet ar aktivt i produktion. Gutafinns responsiva React-startsida och
inbyggda Leaflet-karta serveras av Nginx, medan Express/SQLite fortsatt ar
datakallan. Live-status ska alltid styrkas separat med deployad Git-SHA.
