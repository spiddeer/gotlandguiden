# Gotlandsguiden Design System

Status: implemented and reviewed against the production UI on 2026-07-14.
This document is the design contract for future interface changes.

## 1. Product Character

Gotlandsguiden is a calm, practical travel companion for exploring the island.
The interface should feel local and tactile: limestone, sea, juniper, warm
summer light, and paper maps. It must remain a useful map application first,
with visual warmth supporting orientation rather than competing with it.

Core attributes:

- Warm, coastal, and distinctly Gotland-inspired
- Clear enough to use outdoors and while moving
- Friendly and editorial without becoming decorative
- Mobile-first, touch-first, and accessible in light and dark themes

## 2. Visual Direction

Use a warm-organic system adapted for a map-based travel guide. Rounded panels,
soft warm shadows, restrained texture, and editorial headings create character.
The map supplies most of the visual detail; controls and cards should therefore
stay quiet, legible, and consistent.

Avoid generic dashboard styling, cold blue-grey surfaces, excessive glass blur,
neon color, and large decorative elements that reduce map space.

## 3. Color System

### Light theme

- `--color-primary`: `#0F5F7A` - Baltic sea blue; active controls and links
- `--color-primary-dark`: `#0A4458` - pressed states and high-contrast text
- `--color-accent`: `#D78A3C` - saffron and summer light; sparing emphasis
- `--color-bg`: `#F2EDE3` - limestone page background
- `--color-surface-solid`: `#FFFAF1` - primary cards and panels
- `--color-surface`: `rgba(255, 252, 247, 0.94)` - elevated map overlay
- `--color-text`: `#1D2D34` - primary text
- `--color-text-muted`: `#586C73` - supporting text
- `--color-border`: `rgba(28, 62, 74, 0.16)` - quiet structure
- `--color-success`: `#2E6B52` - successful location and confirmations
- `--color-danger`: `#A63F36` - errors and destructive warnings

### Dark theme

- `--color-primary`: `#64C4DE` - active controls and links
- `--color-primary-dark`: `#BDE8F2` - high-emphasis text
- `--color-accent`: `#F0AD67` - warm secondary emphasis
- `--color-bg`: `#0F1518` - night background
- `--color-surface-solid`: `#182329` - primary cards and panels
- `--color-surface`: `rgba(21, 32, 37, 0.94)` - elevated map overlay
- `--color-text`: `#E6F1F4` - primary text
- `--color-text-muted`: `#A8BBC2` - supporting text
- `--color-border`: `rgba(186, 221, 232, 0.22)` - quiet structure
- `--color-success`: `#79C7A5` - successful location and confirmations
- `--color-danger`: `#FF9B90` - errors and destructive warnings

All normal text must reach WCAG AA contrast of at least 4.5:1. Do not use the
accent color for small text on a light background.

## 4. Typography

- Display and editorial headings: `Newsreader`, fallback `Georgia, serif`
- Interface and body copy: `Sora`, fallback `Segoe UI, sans-serif`
- Body size: `16px` minimum for inputs and primary reading text
- Small metadata: `13px` minimum with strong contrast
- Body line height: `1.5-1.65`
- Heading line height: `1.05-1.2`
- Heading tracking: `-0.02em`; body tracking remains normal

Use the serif face for page identity and section-level storytelling. Buttons,
labels, search, metadata, and place names stay in the interface face.

## 5. Spacing and Shape

Spacing scale: `4, 8, 12, 16, 20, 24, 32, 40px`.

- Main bottom sheet radius: `28px` on mobile, `24px` on desktop
- Cards: `16-20px`
- Buttons and inputs: `12-14px`
- Chips: full pill radius
- Minimum touch target: `44px` square
- Mobile horizontal content padding: `20px`
- Desktop panel padding: `24-32px`

Rounded shapes should feel organic, but nesting must remain disciplined: inner
elements use a smaller radius than their containing surface.

## 6. Elevation and Surfaces

Use warm, low-opacity shadows:

- Floating control: `0 8px 24px rgba(12, 37, 47, 0.16)`
- Card: `0 2px 10px rgba(12, 37, 47, 0.08)`
- Main panel: `0 -12px 32px rgba(12, 37, 47, 0.20)`
- Dialog: `0 24px 64px rgba(12, 37, 47, 0.24)`

The main map panel may use restrained backdrop blur. Content cards should use
mostly opaque surfaces so text remains readable over every map position.

## 7. Layout

### Mobile

- The map fills the viewport behind a bottom sheet.
- The sheet may occupy roughly 68-74 percent of the height in its resting state.
- Search remains visible while the discovery list scrolls.
- Quick actions and filters scroll horizontally rather than wrapping into dense
  multi-row toolbars.
- Primary navigation sits at the safe-area-aware bottom edge.
- Floating map controls must never overlap navigation or the sheet handle.

### Tablet and desktop

- Use a fixed left exploration panel over a full-height map.
- Target panel width: `420-480px`, with at least `24px` outer spacing.
- Keep search, tabs, and filters inside the panel rather than spanning the map.
- Detail views remain compact and preserve geographic context.

## 8. Components

The current production surface includes the Upptack, Sparade, and Guide tabs;
separate Vill besoka and Besokta lists; horizontal category chips; nearby,
food, beach, and random quick actions; a route builder based on Vill besoka;
and rich place details for address, contact data, opening hours, sources, and
verification dates when available. Extend these patterns before introducing a
parallel navigation or component system.

### Search

Search is the strongest control in the panel. Use a visible search icon, a
16px input size, clear placeholder copy, and a 3px focus ring. It should look
like a deliberate command surface rather than an unlabelled text field.

### Tabs and bottom navigation

Active tabs use sea blue text plus a lightly tinted background. Inactive tabs
remain neutral. Icons support labels but never replace them. The active state
must be clear without relying on color alone.

### Chips and quick actions

Chips are compact but at least 44px high. The selected chip uses a tinted sea
blue background, stronger border, and medium-weight text. Category emoji can
support scanning; do not add emoji to every sentence or heading.

### Place cards

Cards prioritize name, short description, category, distance, and the separate
Vill besoka and Besokta actions.
Use the category color as a small accent only. Hover, focus, and selected states
must be distinct. Truncate long descriptions only when the complete text is
available in the detail view.

### Map controls and markers

Floating controls use the same surface, border, radius, shadow, and focus rules.
Markers must retain a visible outline against both light and dark map tiles.
Clusters should use the primary color family and display their count clearly.

### Detail sheet

The detail view is a focused reading surface with a clear close button, compact
category badge, large place name, and one dominant directions action. Secondary
actions must not compete with directions.

### Empty, loading, and status states

Use direct, helpful Swedish copy. Explain the next available action. Status
messages must use text and iconography in addition to color.

## 9. Motion and Interaction

- Standard transition: `160-220ms ease`
- Sheet and dialog movement: `240-320ms cubic-bezier(0.22, 1, 0.36, 1)`
- Hover lift: maximum `1px`
- Never animate map movement and large sheet movement simultaneously without a
  direct user action.
- Honor `prefers-reduced-motion: reduce` by removing non-essential transforms
  and smooth scrolling.

Every interactive element needs a visible `:focus-visible` style. Keyboard and
pointer interactions must expose the same actions.

## 10. Responsive and Accessibility Rules

- Base styles are written for mobile; enhance at `768px` and above.
- Preserve layout at 320 CSS pixels without horizontal page scrolling.
- Use `env(safe-area-inset-*)` for floating controls and bottom navigation.
- Maintain 44px touch targets and at least 8px separation between adjacent
  compact controls.
- Do not hide focus indicators, status text, or essential labels.
- Dialogs must restore focus to their trigger and contain focus while open.
- Map-only information must also be available in the place list.

## 11. Content Voice

Swedish copy should be concise, useful, and locally grounded. Prefer concrete
phrasing such as `Platser nara dig`, `Visa pa kartan`, and `Bygg dagens rutt`.
Avoid tourism cliches, generic marketing claims, and overlong onboarding text.

## 12. Design Review Checklist

Before accepting a UI change, verify:

- The map remains useful and visually dominant.
- Search and the main location action are immediately discoverable.
- Light and dark themes both meet WCAG AA contrast.
- The layout works at 320px, 375px, 768px, and desktop widths.
- Touch targets are at least 44px and keyboard focus is visible.
- Safe areas do not cover navigation or floating controls.
- New components reuse the tokens and shapes in this document.
- The interface still feels like Gotlandsguiden, not a generic dashboard.
