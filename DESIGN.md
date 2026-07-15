# Gutafinn Design System

Status: implemented as the active frontend contract on 2026-07-14.

## 1. Product character

Gutafinn is a GPS-first companion for finding things to do, see and eat on
Gotland right now. It should feel warm, local and immediate: limestone, Baltic
water, meadow green, poppies and long summer evenings. It is a useful mobile
guide first and a travel editorial surface second.

Core attributes:

- Mobile-first and designed around a single `max-width: 440px` canvas
- Coastal, tactile and distinctly Gotland-inspired
- Concise Swedish copy and clear outdoor readability
- Rich photography supported by restrained, token-driven interface chrome

## 2. Stack and implementation contract

- React 19, TypeScript and Vite
- TanStack Router with file routes in `src/routes/`
- Tailwind CSS v4 tokens in `src/styles.css` via `@theme inline`
- shadcn/ui components using the `new-york` style
- Lucide icons
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

## 6. Active mobile composition

1. A 440px-high photographic hero with a rounded 36px lower edge.
2. Live GPS status and saved-place control at the safe-area-aware top edge.
3. Truthful location state, time-aware greeting and real nearby count in the hero.
4. A search card overlapping the hero by 28px and searching the full API response.
5. Horizontally scrolling category pills for Allt, Göra, Se and Äta.
6. A large featured place with save, source verification, distance, walk time, opening state
   and a poppy-colored `Ta mig hit` action.
7. Compact horizontal place cards filtered by search and category.
8. A sea-deep weather strip.
9. A fixed safe-area-aware pill navigation for Hem, Karta, Nära and Sparat.
10. Karta opens an embedded Leaflet atlas view with clustered live places, a GPS marker,
    keyboard-visible controls and persistently readable OpenStreetMap attribution.

No desktop-specific information architecture is required. On wider screens the
mobile canvas remains centered on the warm page background.

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
- The active bottom-nav item uses `aria-current="page"`.
- All controls show a visible focus ring and meet the 44px target.
- Honor safe-area insets and `prefers-reduced-motion`.
- The layout must work without horizontal page scrolling at 320px.

## 9. Voice

Use concise, local Swedish phrasing: `Närmast dig nu`, `Fler tips på Gotland`
and `Ta mig hit`. Avoid generic tourism claims, long onboarding copy and English
interface labels.

## 10. Review checklist

- All component colors use semantic tokens.
- Hero copy remains readable across the full image crop.
- Category, search, save and navigation states are keyboard accessible.
- Generated assets are optimized and committed under `src/assets/`.
- Root `npm test` verifies data mapping before `npm run build` completes TypeScript and Vite verification.
- Docker serves `dist/` and continues proxying `/api/*` to the backend.
