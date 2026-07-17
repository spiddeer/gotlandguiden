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

This document is the primary context for AI agents working in this repo.

## System Snapshot

- Frontend: React 19 + TypeScript + Vite + TanStack Router + Tailwind CSS v4,
  Leaflet and Leaflet.markercluster in `src/`
- Backend: Node.js + Express + SQLite in `backend/`
- Deploy: Docker Compose in `deploy/proxmox/`
- Runtime environment: Proxmox LXC CT 201 (`gutafinn`)
- Public domain: `https://gutafinn.tobtech.se`
- Compatibility domain: `https://gotland.tobtech.se` permanently redirects to
  the matching path/query on the primary domain
- Edge routing: Cloudflare Tunnel (config in a separate CT 200)
- Git remote: `https://github.com/spiddeer/gutafinn.git`
- Deployed frontend SHA: verified in CT 201 with `git rev-parse HEAD`
- Curated release snapshot: 977 visitor destinations across 8 internal
  categories and 7 visitor filters; no service, accommodation, fuel or
  charging entries

## Architecture

### Application flow

1. Docker builds the Vite frontend in `deploy/Dockerfile` and copies `dist/` to Nginx.
2. The browser loads Gutafinn via the Nginx container (`web`).
3. Gutafinn loads all active places from `/api/places`, filtering and sorting locally.
4. Mobile/iPad shows a single column and opens the map via `Karta`; from
   1024px landscape or 1280px the feed and map show at the same time.
5. The Leaflet instance is created once. Filters diff the marker registry
   instead of rebuilding the cluster; GPS and the selected place update via
   separate effects. The map keeps permanently visible OSM attribution.
6. The browser requests geolocation for real distance/GPS markers and fetches weather from Open-Meteo.
7. `Överraska mig` makes a local selection from the same place list and opens
   travel-mode-matched navigation at OpenStreetMap.
8. Nginx proxies `/api/*` to the Express container (`backend:8080`).
9. The backend reads/writes SQLite in the mounted volume `deploy/proxmox/data/places.db`.

### Frontend files

- `index.html`: Vite shell, font links and static SEO metadata.
- `src/routes/__root.tsx`: TanStack Router root and dynamic head metadata.
- `src/routes/index.tsx`: responsive shell, API/GPS, search/filter, nav state,
  map focus, selected place ID and list/map sync.
- `src/components/gutafinn-map.tsx`: stable Leaflet lifecycle, clusters, popups,
  GPS markers, marker registry, selected state and OSM attribution.
- `src/components/gutafinn-map.test.tsx`: jsdom regression tests for
  one-time initialization, separate GPS/cluster updates, selection and marker clicks.
- `src/components/surprise-adventure.tsx`: accessible full-screen flow for time, travel mode, GPS states and adventure cards.
- `src/components/visitor-correction-form.tsx`: validated online form that
  queues visitor correction suggestions without directly changing the place.
- `src/components/editorial-collections.tsx`: horizontal collection surface with a clear
  active/editorial selection.
- `src/components/day-planner.tsx`: internal day plan from saved places with
  travel mode, legs and truthful estimates.
- `src/lib/places.ts`: API types, category mapping, distance, opening hours and filtering.
- `src/lib/surprise.ts`: pure radius/selection logic, fact justifications, travel-time estimates and OSM URLs.
- `src/lib/surprise-storage.ts`: validated localStorage state with a max of 20 history entries.
- `src/lib/weather.ts`: live weather and sunset from Open-Meteo.
- `src/lib/discovery-url.ts`: validated parse/serialization of shareable search,
  category, map view, selected place and editorial collection.
- `src/lib/collections.ts`: strict parsing and sorting of public collections.
- `src/lib/day-planner.ts`: deterministic nearest-stop ordering, max eight stops
  and estimated distance/travel time.
- `src/lib/map-area.ts`: validated viewport filtering including date-line edge cases.
- `src/lib/practical-filters.ts`: combinable filters for GPS radius and the
  presence of opening hours, contact and accessibility information.
- `src/lib/pwa.ts`: defensive production registration of `/sw.js`.
- `src/pwa/`: manifest and service-worker template; Vite injects a hashed precache
  and emits stable PWA files via `vite.config.ts`.
- `src/lib/places.test.ts`: frontend tests for data mapping and truthful states.
- `src/styles.css`: Tailwind v4, Leaflet/markercluster CSS, `@theme inline` and semantic OKLCH tokens.
- `src/components/ui/`: shadcn/ui components in the `new-york` style.
- `src/assets/`: five generated and optimized Gotland images.
- `public/`: preserved legacy Leaflet frontend; excluded from the Vite build and
  no longer mounted by Compose.

### Backend files

- `backend/server.js`: read/write API for categories and places.
- `backend/db.js`: SQLite connection and migration bootstrap.
- `backend/migrations.js`: versioned, additive SQLite migrations.
- `backend/place-repository.js`: data contract, relational reads and writes.
- `backend/correction-repository.js`: validation and storage of visitor
  correction suggestions.
- `backend/collection-repository.js`: public reads of published collections
  with at least two active places.
- `backend/import-osm.js`: Overpass import, categorization, deduplication and
  generation of the seed and fallback snapshot.
- `backend/seed.js`: idempotent OSM import at container start.
- `backend/seed-data.json`: seed dataset.
- `backend/test/`: tests for the API, migrations/database and OSM import.

### CMS files

- `cms/src/`: passkey/backup-account-protected place administration against the same SQLite database.
- The correction queue in the CMS moves reports between `new`, `reviewed`, `resolved` and
  `dismissed`; it never writes automatically to the place register.
- The media library stores validated JPEG, PNG and WebP images as BLOBs via
  backend migration 7. The max size is 2 MiB, the public URL is `/api/media/:id`, and
  the CMS may only delete images that are not referenced by `place_images`.
- `cms/test/`: auth, WebAuthn, validation and CRUD regression tests.
- The backend owns the domain schema and migrations. The CMS must never initiate or
  alter the domain schema, and must refuse to start against an uninitialized database.

## Frontend state and design contract

Gutafinn uses local React state in `src/routes/index.tsx`. The category must
remain `useState<Category>` with `Allt`, `Mat & dryck`, `Sevärdheter`,
`Bad`, `Natur`, `Aktiviteter`, `Familj` and `Lokalt`; search
and category combine in a memoized filter. Save status and the active
bottom nav are local UI state. Saved place IDs persist in localStorage
under `gutafinn_saved_places` and are not part of SQLite or the API contract.
`Karta` is an internal React view; it must not be swapped back for an external link.

`Överraska mig` is also an internal React view and must reuse already-loaded
places and existing GPS state. The catalog must only contain visitor categories;
accommodation, service, fuel, charging and generic retail are filtered out at import.
The v1 ranking may only rank by distance, category variety,
`lastVerifiedAt` and local viewing history. The radius may grow
in 1 km steps but never beyond 10 km. The four `gutafinn_surprise_*` keys
store time, travel mode and at most the 20 most recent place IDs/categories; GPS
coordinates must not be stored. Preserve fact templates, a clear mood-image
label and travel-mode-matched OSM engines for walking, cycling and driving.

All component coloring must go through semantic tokens from
`src/styles.css`. Preserve a single column on mobile, a roomier single column on
iPad portrait, and the split layout from 1024px landscape/1280px. The desktop feed must
be 460-540px, the map flexible, and the top navigation replaces the bottom nav. Preserve
Swedish copy, 44px touch targets, focus states, safe areas and
reduced-motion support per `DESIGN.md`.

Components inside the desktop feed must respond to their actual container width,
not only viewport breakpoints like `sm:`. Use container queries or
content-driven `auto-fit` grids for internal columns, and let long Swedish copy
wrap without overlapping controls or creating horizontal overflow.

`activeNav` and `feedMode` are intentionally separate: `Kartfokus` must not lose
search, category or the saved view. List selection and marker clicks must sync
`selectedPlaceId` in both directions. Never rebuild the Leaflet instance or all
unchanged markers for filters, GPS or selection; initialization, marker diffing,
GPS and selection must remain separate.

URL state may only contain the search phrase, public category, `vy=karta`, a
validated place ID, `samling` and practical filters via `radie`/`fakta`. GPS coordinates and
the contents of the saved list must never be serialized. Unknown URL values must
fall back to `Allt`/the home view, and browser history must be able to restore
state without a full page load.

Editorial collections contain 2-20 ordered place IDs and may only be shown
publicly when they are published and at least two linked places are active. The
editorial order must be preserved even with GPS; search, category, practical
filters and map area may be layered on top of the selection. Collections never
duplicate or alter place data.

The day planner must always start from the persistent save order, but never
store a plan or GPS. With GPS, the nearest place is chosen as the first stop; without
GPS, the first saved place becomes the start. Show at most eight stops, label
distance/travel time as estimates, and keep walking/cycling/driving linked to the correct OSM engine.

The map-area filter is an explicit, transient filter layered on top of search, category
and the saved view. `GutafinnMap` only reports the current Leaflet bounds when
the user presses the button. The feed must always show its active status and be able to
reset to all of Gotland; GPS and URL state must not be conflated with the viewport.

Practical filters may only claim that underlying data exists. `Öppettider finns` does not mean
`Öppet nu`, and `Tillgänglighetsinfo` does not automatically mean full
accessibility. The distance filter is 1/5/10 km and must not exclude data before a
GPS position exists. All practical filters combine with search, category,
the saved view and any map area.

The offline contract covers the app shell and the last successful public API data. The service
worker must not cache GPS, external OSM tiles, Open-Meteo or arbitrary
image origins. Navigation is network-first with `index.html` as a fallback; public
API calls are network-first with a separate data cache. `/sw.js` must be served with `no-store`
by Nginx and registered with `updateViaCache: none`.
Correction submissions are explicitly online-only and must never be queued in the service worker
or localStorage.
Leaflet controls, markers and attribution must be keyboard/touch operable,
and the OpenStreetMap credit must remain permanently readable at every viewport size.

## Data contract

The place object's backward-compatible core must always be:

`{ id, name, category, lat, lng, description }`

Optional enrichment fields are `categories`, `address`, `contacts`, `openingHours`,
`accessibility`, `priceLevel`, `images`, `sources` and `lastVerifiedAt`.

A place can belong to multiple categories, but `category` is always the primary category.
Category keys must exist in both the SQLite `categories` table and the fallback
`CATEGORIES` in `public/js/places-data.js`.

Public categories are `mat`, `sevardhet`, `strand`, `smultronstallen`, `natur`,
`aktivitet`, `familj` and `shopping`. New import runs must not reintroduce
`service`, `boende` (accommodation), fuel, charging or generic retail. Every active place
must have a name, description, coordinates and a source; the information panel additionally shows
all available address, contact, opening-hours and accessibility data.

The API must continue to expose `/api/categories`, `/api/places`, `/api/collections`
and `/api/media/:id`. The active
Gutafinn frontend uses `/api/places` as its only place source. The `public/`
fallback is preserved for import reproducibility but is not the active runtime frontend.

`POST /api/places/:id/corrections` accepts six defined correction types,
a 10-1000 character message and an optional email. The honeypot and the default limit of
five attempts per IP/hour must be preserved, but IP addresses must not be stored. The backend
owns migration 5 and the `visitor_corrections` table; the CMS may only query and
use the table. No queue changes may automatically alter a place.

Seed/import may update core data with `UPSERT`, but must never delete manually
enriched opening hours, contact details, images or sources.

Import-owned category links have `source_type = 'OpenStreetMap'` and may be
synced away when the source changes. Manual category links lack that
source marking and must be preserved. Entries that disappear from OSM are marked
`is_active = 0`; public reads return only active entries.

The current seed and the frontend fallback must always be generated by the same import run.
Do not change one snapshot without syncing and testing the other.

## Operations and infrastructure

### Proxmox

- CT 201: runs the application (`/opt/gutafinn`)
- CT 200: runs the cloudflared tunnel process

### Cloudflare

- Hostname: `gutafinn.tobtech.se`
- Redirect hostname: `gotland.tobtech.se`
- Tunnel ingress target: `http://192.168.1.224:3003` (CT 201)

### Compose services

- `backend` (Node/Express, internal 8080)
- `cms` (Node, internal 3000; starts after backend health is green)
- `web` (multi-stage Vite build + Nginx, published on port 3003 in CT 201)

Nginx uses separate CSP/browser policies for the public app and the CMS. Do not change
the public `connect-src`, `font-src` or `Permissions-Policy` in a way that breaks Open-Meteo,
Google Fonts or GPS. Hashed assets are cached as immutable,
while `index.html` is revalidated and the API cache is set by the backend.

## Standard operational commands

In CT 201:

```bash
cd /opt/gutafinn
./deploy/proxmox/deploy.sh
```

Manual backup:

```bash
cd /opt/gutafinn/deploy/proxmox
./backup.sh
```

Timer status:

```bash
systemctl status gutafinn-backup.timer
systemctl list-timers --all | grep gutafinn-backup
```

Local verification from the project root and `backend/`:

```bash
npm run build
npm test
cd backend
npm test
cd ../cms
npm test
```

After deploy:

```bash
curl -fsSI https://gutafinn.tobtech.se
curl -fsS https://gutafinn.tobtech.se/api/categories
curl -fsS https://gutafinn.tobtech.se/api/places
```

Then browser-verify at 320, 390, 768, 820, 1024 landscape, 1280 and 1440px.
Check the Leaflet container, map tiles, clusters, list/map sync,
restorable map focus, preserved filters and visible OpenStreetMap attribution.

## AI agent policy (important)

1. Never change the API schema without updating the backend + seed + docs and any new API consumer.
2. Preserve Gutafinn's mobile-first design, semantic tokens, accessibility and Swedish copy.
3. Avoid hardcoded runtime data in git (`deploy/proxmox/data/`, `backups/`).
4. Use the existing deploy script instead of ad-hoc deploy commands.
5. If Cloudflare routing changes: document the new ingress in this file and in `deploy/proxmox/README.md`.
6. For new deployment steps: update every markdown file in the repo.
7. Run backend tests after changes to schema, repository, seed or import.
8. Keep `backend/seed-data.json` and `public/js/places-data.js` synchronized.
9. Run `npm test` and `npm run build` after changes to `src/`, Vite, Tailwind or the frontend Docker build.
10. For map changes: keep Leaflet attribution visible and verify against the full `/api/places` dataset.
11. The Leaflet instance must not be reinitialized by filters, GPS or the selected place ID;
    keep and extend `gutafinn-map.test.tsx` for lifecycle changes.
12. Responsive changes must be browser-checked across the full 320-1440px matrix
    and must not create mobile page scroll or hide the bottom nav/top navigation.
13. For correction-queue changes: run frontend, backend and CMS tests; preserve
    the online-only flow, rate limit, privacy and manual review.
14. For collection changes: test the publishing threshold, 2-20 active places,
    editorial order, shareable URL, offline cache and CMS validation.
15. For media changes: verify migration 7, JPEG/PNG/WebP signatures,
    the 2 MiB limit, CSRF, immutable public reads, and that used images cannot be deleted.
16. For Nginx/header changes: build the web image, run `nginx -t` and check
    GPS, Open-Meteo, Google Fonts, map tiles and both hostnames' CSP.
17. For map-area changes: test the bounds filter and callback without moving
    ownership of the Leaflet instance or auto-linking filtering to `moveend`.
18. Never add `Öppet nu`, price or accessibility claims without
    sufficiently structured source data and truthful empty states.
19. For PWA changes: verify the generated manifest/icons/sw, `node --check`,
    Nginx content types/cache headers, and the online -> reload -> offline flow.

## Quick troubleshooting

- No public response: verify cloudflared in CT 200 and the ingress rule.
- Frontend build fails: run `npm run build` and check TanStack route generation.
- API data missing: check `GET /api/places` in CT 201 and Gutafinn's retry state.
- DB problems: check that `deploy/proxmox/data/places.db` exists and is writable.
- Styling needs sharpening: check `src/styles.css`, semantic tokens and Tailwind classes.
- Map is empty: check `/api/places`, the Leaflet imports, markercluster and the browser console.
- Map flickers or loses state: check effect dependencies and that initialization
  still happens once while clusters, GPS and selection update separately.

## Related documentation

- `deploy/proxmox/README.md`: operations/runbook
- `README.md`: product overview, API and data status
- `DESIGN.md`: visual and interaction design contract
- `CLAUDE.md`: short project context and IJFW references
- `.github/hooks/README.md`: hook system and quality rules

<!-- IJFW-MEMORY-START -->
Project memory at .ijfw/memory/. Call `ijfw_memory_prelude` for full context.
<!-- IJFW-MEMORY-END -->

<!-- IJFW-AGENTS-START -->
No project agents yet. Run `ijfw team` to set them up.
<!-- IJFW-AGENTS-END -->
