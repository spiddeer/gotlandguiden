# Gutafinn Design System

Status: implemented as the active frontend contract. The latest live-verified
release is recorded separately in `README.md` and `deploy/proxmox/README.md`.
Gutafinn is the only active product name across interface copy, components and
new design assets.

## 1. Product character

Gutafinn is a GPS-first companion for finding things to do, see and eat on
Gotland right now. It should feel warm, local and immediate: limestone, Baltic
water, meadow green, poppies and long summer evenings. It is a useful mobile
guide first and a travel editorial surface second.

Core attributes:

- Mobile-first with a 440px phone canvas, a roomier portrait-tablet canvas and
  a balanced feed/map workspace on landscape tablets and desktop
- Coastal, tactile and distinctly Gotland-inspired
- Concise Swedish copy and clear outdoor readability
- Rich photography supported by restrained, token-driven interface chrome

## 2. Stack and implementation contract

- React 19, TypeScript and Vite
- TanStack Router with file routes in `src/routes/`
- Tailwind CSS v4 tokens in `src/styles.css` via `@theme inline`
- shadcn/ui components using the `new-york` style
- Lucide icons
- Leaflet 1.9 and Leaflet.markercluster for the embedded atlas view
- Fraunces for display typography and Inter for interface typography

Component code must use semantic utilities such as `bg-primary`, `text-sea`
and `bg-poppy`. New color values belong in the OKLCH token layer, not inside
components. White text is only acceptable directly over photography.

## 3. Color system

The authoritative values live in `src/styles.css`.

- `background`: warm off-white, `oklch(0.975 0.012 80)`
- `foreground`: dark warm grey
- `primary` / `sea-deep`: deep Baltic blue, `oklch(0.32 0.06 220)`
- `sea`: medium coastal blue
- `sand`: pale warm sand
- `limestone`: quiet limestone beige
- `poppy`: Gotland poppy red, `oklch(0.68 0.18 35)`
- `meadow`: green for open and available states
- `overlay`: dark translucent image overlay
- Map tiles: warm paper treatment via `--map-tile-filter`, `--map-bed`,
  `--map-vignette` and `--map-control`

All foreground/background pairs must meet WCAG AA. Status must never depend on
color alone.

## 4. Typography

- Display: Fraunces, Georgia fallback
- Interface and body: Inter, system sans-serif fallback
- Search inputs and body copy: at least 16px
- Editorial headlines may use italics for a single expressive line
- Metadata stays compact but never below 12px

## 5. Shape, spacing and elevation

- Base radius: `1.25rem`
- Major content cards: `rounded-3xl`
- Search and compact cards: `rounded-2xl`
- Navigation and filters: full pills
- Minimum interactive target: 44px square
- Standard content gutter: 20px
- Use the semantic card and floating shadows from `src/styles.css`

## 6. Responsive composition

### Mobile and portrait tablet

1. A 440px-high photographic hero with a rounded 36px lower edge.
2. Live GPS status and saved-place control at the safe-area-aware top edge.
3. Truthful location state, time-aware greeting and real nearby count in the hero.
4. A search card overlapping the hero by 28px and searching the full API response.
5. Horizontally scrolling category pills for Allt, Mat & dryck, Sevärdheter,
   Bad, Natur, Aktiviteter, Familj and Lokalt.
6. A prominent `Överraska mig` callout opens an internal full-screen flow for
   time, travel mode and one nearby micro-adventure.
7. A large featured place with save, source verification, distance, walk time, opening state
   and a poppy-colored `Ta mig hit` action.
8. Compact horizontal place cards filtered by search and category. Every card
   opens a responsive information dialog with all sourced place facts.
9. A sea-deep weather strip.
10. A fixed safe-area-aware pill navigation for Hem, Karta, Nära and Sparat.
11. Karta opens an embedded Leaflet atlas view with clustered live places, a GPS marker,
    keyboard-visible controls and persistently readable OpenStreetMap attribution.

At 640-1023px and portrait tablets up to 1279px, the single column grows to a
maximum 720px, the hero becomes a rounded inset card and bottom navigation stays
available.

### Landscape tablet and desktop

- Split layout starts at 1024px in landscape, or at 1280px regardless of orientation.
- A sticky 72px top bar replaces bottom navigation.
- The independently scrolling feed is 460-540px wide; the map consumes the
  remaining viewport and stays mounted while feed state changes.
- The featured place becomes a horizontal editorial card; at 1280px compact
  places form a two-column grid inside the feed.
- `Kartfokus` collapses the feed without discarding search, category, saved view
  or the selected place; returning to `Hem` restores the same feed state.
- Selecting a list card focuses and opens its marker. Selecting a marker marks
  and scrolls the corresponding card into view.

## 7. Photography

The five active assets live in `src/assets/` as optimized WebP files:

- `hero-coast.webp`
- `visby-roses.webp`
- `saffron-pancake.webp`
- `raukar-sea.webp`
- `tofta-beach.webp`

Use natural Scandinavian editorial photography, plausible Gotland geography,
warm restrained light and no embedded text or logos. Preserve meaningful
`alt` text for content images; decorative duplicates use an empty `alt`.

## 8. Interaction and accessibility

- Category filtering is held in `useState<Category>`.
- Search and category filters combine across the live `/api/places` response.
- GPS-derived distance is only shown after successful geolocation.
- Opening claims require structured source hours; raw hours use a neutral state.
- Weather and sunset come from Open-Meteo for the user position or Ljugarn fallback.
- Save controls persist IDs in localStorage and expose `aria-pressed`.
- Surprise time/mode controls use labelled fieldsets and `aria-pressed`; rerolls
  announce the new place through a polite live region.
- Surprise loading, denied-GPS, unavailable-data and empty-radius states always
  provide truthful copy and a clear next action where one exists.
- Adventure photography is labelled `Stämningsbild från Gotland`; never imply
  that a category asset depicts the recommended place.
- Featured fallback photography is labelled the same way. Compact place cards
  without a sourced API image use a neutral location placeholder instead of
  presenting stock photography as the place itself.
- Preserve time and travel mode across rerolls, avoid the first five place
  repetitions when the pool permits and bound local history to 20 entries.
- The active bottom-nav item uses `aria-current="page"`.
- The map renders the full API dataset through marker clusters and uses the GPS
  position as a separate, non-interactive user marker.
- The Leaflet map instance is initialized once. Marker clusters, GPS state and
  selected-place state update independently so filtering and nav changes do not
  rebuild or race the map.
- The selected marker has a non-color-only visual state; selection changes are
  also announced in a polite live region.
- OpenStreetMap attribution stays readable without hover, focus or transient
  active state on both the active React map and preserved legacy map.
- All controls show a visible focus ring and meet the 44px target.
- A keyboard-visible skip link moves focus directly to the discovery feed.
- Blocked geolocation is announced as blocked and never labelled as an active
  or available GPS state.
- Honor safe-area insets and `prefers-reduced-motion`.
- The layout must work without horizontal page scrolling at 320px.
- At 768/820px the layout remains a generous single column; at 1024px landscape,
  1280px and 1440px it uses the split workspace without clipping either pane.

## 9. Voice

Use concise, local Swedish phrasing: `Närmast dig nu`, `Fler tips på Gotland`
and `Ta mig hit`. Avoid generic tourism claims, long onboarding copy and English
interface labels.

## 10. Review checklist

- All component colors use semantic tokens.
- Hero copy remains readable across the full image crop.
- Category, search, save and navigation states are keyboard accessible.
- `Överraska mig` works with GPS granted and denied, all three time choices,
  all three travel modes and five consecutive rerolls.
- Each surprise navigation action uses the correct OpenStreetMap direction engine.
- Karta loads tiles and clusters without runtime errors and keeps attribution visible.
- Filtering preserves the Leaflet instance and reuses unchanged markers; list
  and marker selection stay synchronized; `Kartfokus -> Hem` preserves active
  category and feed mode.
- Browser smoke covers 320, 390, 768, 820, 1024 landscape, 1280 and 1440px,
  including denied GPS and horizontal-overflow checks.
- `src/components/gutafinn-map.test.tsx` covers one-time map initialization,
  GPS/cluster updates, selected-place updates and marker-click callbacks.
- Generated assets are optimized and committed under `src/assets/`.
- Root `npm test` verifies data mapping before `npm run build` completes TypeScript and Vite verification.
- Docker serves `dist/` and continues proxying `/api/*` to the backend.
