import { createFileRoute } from "@tanstack/react-router"
import {
  Accessibility,
  ArrowRight,
  Baby,
  Bike,
  Bookmark,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Footprints,
  Globe2,
  Heart,
  Home,
  Info,
  Landmark,
  LocateFixed,
  LoaderCircle,
  Mail,
  Map as MapIcon,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  Search,
  ShoppingBasket,
  Sparkles,
  Sun,
  Sunset,
  Trees,
  Utensils,
  Waves,
  X,
  type LucideIcon,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import heroCoast from "@/assets/hero-coast.webp"
import raukarSea from "@/assets/raukar-sea.webp"
import saffronPancake from "@/assets/saffron-pancake.webp"
import toftaBeach from "@/assets/tofta-beach.webp"
import visbyRoses from "@/assets/visby-roses.webp"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { GutafinnMap } from "@/components/gutafinn-map"
import { SurpriseAdventure } from "@/components/surprise-adventure"
import {
  countWithinRadius,
  filterPlaces,
  parseApiPlaces,
  type ApiPlace,
  type Category,
  type Coordinates,
  type PlaceViewModel,
} from "@/lib/places"
import { cn } from "@/lib/utils"
import {
  buildOpenStreetMapDirectionsUrl,
  type TravelMode,
} from "@/lib/surprise"
import { loadWeather, type Weather } from "@/lib/weather"

export const Route = createFileRoute("/")({
  component: GutafinnPage,
})

const SAVED_KEY = "gutafinn_saved_places"
const LJUGARN = { lat: 57.333523, lng: 18.713461 }
const SPLIT_LAYOUT_QUERY = "(min-width: 1024px) and (orientation: landscape), (min-width: 1280px)"

const categoryItems: Array<{ label: Category; icon: LucideIcon }> = [
  { label: "Allt", icon: Sun },
  { label: "Mat & dryck", icon: Utensils },
  { label: "Sevärdheter", icon: Landmark },
  { label: "Bad", icon: Waves },
  { label: "Natur", icon: Trees },
  { label: "Aktiviteter", icon: Bike },
  { label: "Familj", icon: Baby },
  { label: "Lokalt", icon: ShoppingBasket },
]

const navItems: Array<{ label: string; icon: LucideIcon }> = [
  { label: "Hem", icon: Home },
  { label: "Karta", icon: MapIcon },
  { label: "Nära", icon: LocateFixed },
  { label: "Sparat", icon: Bookmark },
]

function loadSavedIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]")
    return new Set<string>(Array.isArray(stored) ? stored.filter((id) => typeof id === "string") : [])
  } catch {
    return new Set<string>()
  }
}

function saveSavedIds(saved: Set<string>) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify([...saved]))
  } catch {
    // Saved places remain available for the current session when storage is blocked.
  }
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 5) return "God natt"
  if (hour < 11) return "God morgon"
  if (hour < 17) return "God eftermiddag"
  return "God kväll"
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const update = () => setMatches(mediaQuery.matches)
    update()
    mediaQuery.addEventListener("change", update)
    return () => mediaQuery.removeEventListener("change", update)
  }, [query])

  return matches
}

function getPlaceImage(place: ApiPlace) {
  const apiImage = place.images?.[0]?.url
  if (apiImage) {
    return {
      src: apiImage,
      alt: place.images?.[0]?.altText || place.name,
      moodImage: false,
    }
  }

  const name = place.name.toLocaleLowerCase("sv")
  const src = name.includes("folhammar") || place.category === "natur"
    ? raukarSea
    : name.includes("tofta") || place.category === "strand"
      ? toftaBeach
      : name.includes("bakfickan") || place.category === "mat"
        ? saffronPancake
        : visbyRoses
  return { src, alt: "Stämningsbild från Gotland", moodImage: true }
}

function GutafinnPage() {
  const [places, setPlaces] = useState<ApiPlace[]>([])
  const [apiState, setApiState] = useState<"loading" | "ready" | "error">("loading")
  const [category, setCategory] = useState<Category>("Allt")
  const [query, setQuery] = useState("")
  const [saved, setSaved] = useState<Set<string>>(loadSavedIds)
  const [activeNav, setActiveNav] = useState("Hem")
  const [feedMode, setFeedMode] = useState("Hem")
  const [position, setPosition] = useState<Coordinates | null>(null)
  const [locationState, setLocationState] = useState<"idle" | "loading" | "ready" | "unavailable">("idle")
  const [routeTarget, setRouteTarget] = useState<string | null>(null)
  const [showSurprise, setShowSurprise] = useState(false)
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [detailsPlaceId, setDetailsPlaceId] = useState<string | null>(null)
  const requestedLocation = useRef(false)
  const placeRequestId = useRef(0)
  const splitLayout = useMediaQuery(SPLIT_LAYOUT_QUERY)

  const loadPlaces = useCallback(async () => {
    const requestId = ++placeRequestId.current
    setApiState("loading")
    try {
      const response = await fetch("/api/places", { headers: { Accept: "application/json" } })
      if (!response.ok) throw new Error("Platsdata kunde inte hämtas")
      const data = parseApiPlaces(await response.json())
      if (requestId !== placeRequestId.current) return
      setPlaces(data)
      setApiState("ready")
    } catch {
      if (requestId !== placeRequestId.current) return
      setPlaces([])
      setApiState("error")
    }
  }, [])

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocationState("unavailable")
      return
    }

    setLocationState("loading")
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ lat: coords.latitude, lng: coords.longitude })
        setLocationState("ready")
      },
      () => setLocationState("unavailable"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }, [])

  useEffect(() => {
    void loadPlaces()
  }, [loadPlaces])

  useEffect(() => {
    if (requestedLocation.current) return
    requestedLocation.current = true
    requestLocation()
  }, [requestLocation])

  useEffect(() => {
    saveSavedIds(saved)
  }, [saved])

  const visiblePlaces = useMemo(
    () =>
      filterPlaces(
        places,
        category,
        query,
        position,
        feedMode === "Sparat" ? saved : undefined,
      ),
    [category, feedMode, places, position, query, saved],
  )

  const nearbyCount = useMemo(
    () => (position ? countWithinRadius(places, position, 5) : null),
    [places, position],
  )
  const featuredPlace = visiblePlaces[0] ?? null
  const selectedPlace = selectedPlaceId
    ? visiblePlaces.find((place) => place.id === selectedPlaceId) ?? null
    : null
  const detailsPlace = detailsPlaceId
    ? visiblePlaces.find((place) => place.id === detailsPlaceId) ?? null
    : null
  const listStart = featuredPlace ? 1 : 0
  const baseListPlaces =
    feedMode === "Sparat"
      ? visiblePlaces.slice(listStart)
      : visiblePlaces.slice(listStart, query || category !== "Allt" ? 40 : 5)
  const listPlaces =
    selectedPlace && selectedPlace.id !== featuredPlace?.id && !baseListPlaces.some((place) => place.id === selectedPlace.id)
      ? [selectedPlace, ...baseListPlaces.slice(0, Math.max(0, baseListPlaces.length - 1))]
      : baseListPlaces

  useEffect(() => {
    if (selectedPlaceId && !visiblePlaces.some((place) => place.id === selectedPlaceId)) {
      setSelectedPlaceId(null)
    }
  }, [selectedPlaceId, visiblePlaces])

  useEffect(() => {
    if (detailsPlaceId && !visiblePlaces.some((place) => place.id === detailsPlaceId)) {
      setDetailsPlaceId(null)
    }
  }, [detailsPlaceId, visiblePlaces])

  function toggleSaved(placeId: string) {
    setSaved((current) => {
      const next = new Set(current)
      if (next.has(placeId)) next.delete(placeId)
      else next.add(placeId)
      return next
    })
  }

  function openDirections(place: ApiPlace, travelMode: TravelMode = "car") {
    const directionsUrl = position
      ? buildOpenStreetMapDirectionsUrl(position, { lat: place.lat, lng: place.lng }, travelMode)
      : null
    const url =
      directionsUrl ??
      `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=15/${place.lat}/${place.lng}`
    window.open(url, "_blank", "noopener,noreferrer")
    setRouteTarget(place.name)
  }

  function showPlaceDetails(placeId: string) {
    setSelectedPlaceId(placeId)
    setDetailsPlaceId(placeId)
  }

  function selectNavigation(label: string) {
    setShowSurprise(false)
    setActiveNav(label)
    if (label !== "Karta") setFeedMode(label)
    if (label === "Nära") requestLocation()
  }

  const selectPlaceOnMap = useCallback((placeId: string) => {
    setSelectedPlaceId(placeId)
    window.requestAnimationFrame(() => {
      document.getElementById(`place-card-${placeId}`)?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "nearest",
      })
    })
  }, [])

  return (
    <main className="gutafinn-app min-h-screen w-full overflow-x-hidden bg-background">
      <a className="gutafinn-skip-link" href="#discovery-content">
        Hoppa till innehållet
      </a>
      <DesktopHeader active={activeNav} locationState={locationState} onSelect={selectNavigation} />

      <div className={cn("gutafinn-responsive-shell", activeNav === "Karta" && "is-map-focus")}>
        <section
          id="discovery-content"
          tabIndex={-1}
          className="gutafinn-feed"
          aria-label={showSurprise ? "Överraska mig" : "Upptäck platser"}
        >
          {showSurprise ? (
            <SurpriseAdventure
              places={places}
              position={position}
              apiState={apiState}
              locationState={locationState}
              onBack={() => setShowSurprise(false)}
              onRequestLocation={requestLocation}
              onRetryPlaces={loadPlaces}
              onNavigate={openDirections}
              onRecommendationChange={setSelectedPlaceId}
            />
          ) : (
            <>
              <Hero
                totalPlaces={places.length}
                nearbyCount={nearbyCount}
                locationState={locationState}
                onRequestLocation={requestLocation}
                onShowSaved={() => selectNavigation("Sparat")}
              />

              <div className="gutafinn-feed-content safe-bottom relative z-10 -mt-7 space-y-8 px-5">
                <SearchBar query={query} onQueryChange={setQuery} onRequestLocation={requestLocation} />
                <CategoryFilter selected={category} onSelect={setCategory} />
                {feedMode === "Hem" && <SurpriseCallout onOpen={() => setShowSurprise(true)} />}

                {apiState === "error" ? (
                  <ApiUnavailable onRetry={loadPlaces} />
                ) : apiState === "loading" ? (
                  <LoadingPlaces />
                ) : featuredPlace ? (
                  <section aria-labelledby="nearby-heading">
                    <SectionHeading id="nearby-heading">
                      {position ? "Närmast dig nu" : feedMode === "Sparat" ? "Dina sparade platser" : "Utvalt på Gotland"}
                    </SectionHeading>
                    <FeaturedPlace
                      place={featuredPlace}
                      isSaved={saved.has(featuredPlace.id)}
                      onToggleSaved={() => toggleSaved(featuredPlace.id)}
                      onShowDetails={() => showPlaceDetails(featuredPlace.id)}
                      onNavigate={() => openDirections(featuredPlace)}
                    />
                    <p className="sr-only" role="status" aria-live="polite">
                      {routeTarget ? `Kartan till ${routeTarget} har öppnats.` : ""}
                    </p>
                  </section>
                ) : (
                  <EmptyPlaces savedView={feedMode === "Sparat"} />
                )}

                {apiState === "ready" && visiblePlaces.length > 0 && (
                  <section aria-labelledby="feed-heading">
                    <div className="mb-4 flex items-end justify-between gap-4">
                      <SectionHeading id="feed-heading" className="mb-0">
                        {position ? "Runt din plats" : "Fler tips på Gotland"}
                      </SectionHeading>
                      <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                        {visiblePlaces.length.toLocaleString("sv-SE")} träffar
                      </span>
                    </div>

                    <div className="gutafinn-place-grid space-y-3">
                      {listPlaces.map((place) => (
                        <CompactPlace
                          key={place.id}
                          place={place}
                          isSaved={saved.has(place.id)}
                          isSelected={selectedPlaceId === place.id}
                          mapSelectionEnabled={splitLayout}
                          onToggleSaved={() => toggleSaved(place.id)}
                          onShowDetails={() => showPlaceDetails(place.id)}
                          onSelectMap={() => selectPlaceOnMap(place.id)}
                        />
                      ))}
                    </div>
                  </section>
                )}

                <WeatherStrip position={position} />
              </div>
            </>
          )}
        </section>

        {(splitLayout || activeNav === "Karta") && (
          <div className="gutafinn-map-pane">
            <GutafinnMap
              places={visiblePlaces}
              position={position}
              locationState={locationState}
              selectedPlaceId={selectedPlaceId}
              onRequestLocation={requestLocation}
              onPlaceSelect={selectPlaceOnMap}
              className="h-full min-h-0"
            />
          </div>
        )}
      </div>

      {!showSurprise && <BottomNavigation active={activeNav} onSelect={selectNavigation} />}
      {detailsPlace && (
        <PlaceDetailsDialog
          place={detailsPlace}
          isSaved={saved.has(detailsPlace.id)}
          onClose={() => setDetailsPlaceId(null)}
          onToggleSaved={() => toggleSaved(detailsPlace.id)}
          onNavigate={() => openDirections(detailsPlace)}
        />
      )}
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {selectedPlace ? `${selectedPlace.name} är vald på kartan.` : ""}
      </p>
    </main>
  )
}

function DesktopHeader({
  active,
  locationState,
  onSelect,
}: {
  active: string
  locationState: "idle" | "loading" | "ready" | "unavailable"
  onSelect: (label: string) => void
}) {
  return (
    <header className="gutafinn-desktop-header">
      <button type="button" className="gutafinn-brand" onClick={() => onSelect("Hem")}>
        Guta<span>finn</span>
      </button>
      <nav className="flex items-center justify-center gap-1" aria-label="Huvudnavigation för stora skärmar">
        {navItems.map(({ label, icon: Icon }) => {
          const isActive = active === label
          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelect(label)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40",
                isActive ? "bg-sea-deep text-sea-deep-foreground" : "text-muted-foreground hover:bg-secondary",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label === "Karta" ? "Kartfokus" : label}
            </button>
          )
        })}
      </nav>
      <span className="flex min-h-11 items-center gap-2 justify-self-end rounded-full border border-border bg-card px-4 text-xs font-bold text-sea-deep">
        <span className={cn("size-2 rounded-full", locationState === "ready" ? "bg-meadow" : "bg-sand")} aria-hidden="true" />
        {locationState === "ready" ? "Live GPS" : "GPS väntar"}
      </span>
    </header>
  )
}

function SurpriseCallout({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex min-h-24 w-full items-center gap-4 rounded-3xl bg-sea-deep p-5 text-left text-sea-deep-foreground shadow-[var(--shadow-card)] outline-none transition-transform focus-visible:ring-[3px] focus-visible:ring-ring/40 active:scale-[0.99]"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sand text-sand-foreground">
        <Sparkles className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-xl font-semibold">Överraska mig</span>
        <span className="mt-1 block text-xs leading-5 text-sea-deep-foreground/75">
          Hitta något nära som du annars hade missat.
        </span>
      </span>
      <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </button>
  )
}

function Hero({
  totalPlaces,
  nearbyCount,
  locationState,
  onRequestLocation,
  onShowSaved,
}: {
  totalPlaces: number
  nearbyCount: number | null
  locationState: "idle" | "loading" | "ready" | "unavailable"
  onRequestLocation: () => void
  onShowSaved: () => void
}) {
  const statusText =
    locationState === "loading"
      ? "Söker din position…"
      : locationState === "unavailable"
        ? "Platsåtkomst är blockerad – ändra behörigheten i webbläsaren"
      : nearbyCount != null
        ? `${nearbyCount.toLocaleString("sv-SE")} platser inom 5 km`
        : `${totalPlaces.toLocaleString("sv-SE")} platser på hela Gotland`

  return (
    <section className="gutafinn-hero relative h-[440px] overflow-hidden rounded-b-[36px] text-overlay-foreground">
      <img
        src={heroCoast}
        alt="Gotländsk kalkstenskust i varmt kvällsljus"
        className="absolute inset-0 size-full object-cover"
        fetchPriority="high"
      />
      <div className="hero-scrim absolute inset-0" aria-hidden="true" />

      <div className="relative flex h-full flex-col justify-between px-5 pb-14 pt-[calc(1.25rem+env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onRequestLocation}
            className="flex min-h-11 items-center gap-2 rounded-full bg-overlay px-4 text-xs font-semibold tracking-wide outline-none backdrop-blur-md focus-visible:ring-[3px] focus-visible:ring-overlay-foreground/55"
          >
            {locationState === "loading" ? (
              <LoaderCircle className="size-4 animate-spin text-sand" aria-hidden="true" />
            ) : (
              <span className="relative flex size-2.5" aria-hidden="true">
                {locationState === "ready" && (
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-meadow opacity-70" />
                )}
                <span
                  className={cn(
                    "relative inline-flex size-2.5 rounded-full",
                    locationState === "ready" ? "bg-meadow" : "bg-sand",
                  )}
                />
              </span>
            )}
            {locationState === "ready"
              ? "Live GPS"
              : locationState === "unavailable"
                ? "GPS blockerad"
                : "Aktivera GPS"}
          </button>

          <button
            type="button"
            aria-label="Visa sparade platser"
            onClick={onShowSaved}
            className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-overlay-foreground/55"
          >
            <Avatar className="border border-overlay-foreground/25 backdrop-blur-md">
              <AvatarFallback>
                <Bookmark className="size-4" aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
          </button>
        </div>

        <div>
          <p className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <MapPin className="size-4" aria-hidden="true" />
            {locationState === "ready" ? "Din position, Gotland" : "Gotland"}
          </p>
          <h1 className="max-w-[360px] font-display text-[2.75rem] leading-[0.98] font-semibold tracking-[-0.035em]">
            {getGreeting()},
            <span className="block italic">upptäck närmast.</span>
          </h1>
          <p className="mt-4 text-sm font-medium text-overlay-foreground/85" role="status" aria-live="polite">
            {statusText}
          </p>
        </div>
      </div>
    </section>
  )
}

function SearchBar({
  query,
  onQueryChange,
  onRequestLocation,
}: {
  query: string
  onQueryChange: (value: string) => void
  onRequestLocation: () => void
}) {
  return (
    <Card className="flex h-16 items-center gap-3 rounded-2xl border-card px-4 shadow-[var(--shadow-float)]">
      <Search className="size-5 shrink-0 text-sea" aria-hidden="true" />
      <label htmlFor="place-search" className="sr-only">
        Sök bland alla platser
      </label>
      <input
        id="place-search"
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Sök raukar, kaffe, badplats…"
        className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
      />
      <Button size="icon" aria-label="Använd min position" onClick={onRequestLocation}>
        <Navigation className="size-5" aria-hidden="true" />
      </Button>
    </Card>
  )
}

function CategoryFilter({ selected, onSelect }: { selected: Category; onSelect: (value: Category) => void }) {
  return (
    <nav className="scrollbar-hidden -mx-5 flex gap-2 overflow-x-auto px-5" aria-label="Filtrera kategori">
      {categoryItems.map(({ label, icon: Icon }) => {
        const isActive = selected === label
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(label)}
            aria-pressed={isActive}
            className={cn(
              "flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40",
              isActive
                ? "border-sea-deep bg-sea-deep text-sea-deep-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-secondary",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        )
      })}
    </nav>
  )
}

function SectionHeading({ id, className, children }: { id: string; className?: string; children: string }) {
  return (
    <h2 id={id} className={cn("mb-4 font-display text-[1.65rem] leading-tight font-semibold text-sea-deep", className)}>
      {children}
    </h2>
  )
}

function FeaturedPlace({
  place,
  isSaved,
  onToggleSaved,
  onShowDetails,
  onNavigate,
}: {
  place: PlaceViewModel
  isSaved: boolean
  onToggleSaved: () => void
  onShowDetails: () => void
  onNavigate: () => void
}) {
  const image = getPlaceImage(place)
  return (
    <Card className="gutafinn-featured-card overflow-hidden">
      <div className="gutafinn-featured-media relative h-[238px] overflow-hidden">
        <img src={image.src} alt={image.alt} className="size-full object-cover" />
        {image.moodImage && (
          <span className="absolute bottom-3 left-4 rounded-full bg-overlay px-3 py-1 text-[0.68rem] font-semibold text-overlay-foreground backdrop-blur-md">
            Stämningsbild från Gotland
          </span>
        )}
        <Badge className="absolute left-4 top-4 max-w-[calc(100%-5.5rem)] truncate bg-card/92 text-sea-deep backdrop-blur-md">
          {place.tag}
        </Badge>
        <Button
          type="button"
          variant="overlay"
          size="icon"
          className="absolute right-4 top-4"
          aria-label={isSaved ? `Ta bort ${place.name} från sparade` : `Spara ${place.name}`}
          aria-pressed={isSaved}
          onClick={onToggleSaved}
        >
          <Heart className={cn("size-5", isSaved && "fill-current")} aria-hidden="true" />
        </Button>
      </div>

      <div className="gutafinn-featured-body p-5">
        <div className="flex flex-col items-start gap-3 min-[380px]:flex-row min-[380px]:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sea">{place.kind}</p>
            <h3 className="mt-1 font-display text-[1.7rem] leading-tight font-semibold text-sea-deep">{place.name}</h3>
          </div>
          <span className="flex min-h-9 shrink-0 items-center gap-1 rounded-full bg-sand px-3 text-xs font-bold text-sand-foreground">
            {place.verifiedLabel ? (
              <CheckCircle2 className="size-4" aria-hidden="true" />
            ) : (
              <Clock3 className="size-4" aria-hidden="true" />
            )}
            {place.verifiedLabel ?? "Datum saknas"}
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">{place.description}</p>
        <PlaceMeta place={place} />

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="secondary" onClick={onShowDetails}>
            <Info className="size-4" aria-hidden="true" />
            Mer information
          </Button>
          <Button variant="poppy" onClick={onNavigate}>
            <Navigation className="size-4" aria-hidden="true" />
            {place.distanceKm == null ? "Visa på kartan" : "Ta mig hit"}
          </Button>
        </div>
      </div>
    </Card>
  )
}

function PlaceMeta({ place }: { place: PlaceViewModel }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-muted-foreground">
      {place.distanceLabel && (
        <span className="flex items-center gap-1.5">
          <MapPin className="size-4 text-sea" aria-hidden="true" />
          {place.distanceLabel}
        </span>
      )}
      {place.walkLabel && (
        <span className="flex items-center gap-1.5">
          <Footprints className="size-4 text-sea" aria-hidden="true" />
          {place.walkLabel}
        </span>
      )}
      <span
        className={cn(
          "flex items-center gap-1.5",
          place.opening.kind === "open" && "text-meadow",
        )}
      >
        <span
          className={cn(
            "size-2 rounded-full",
            place.opening.kind === "open" ? "bg-meadow" : "bg-muted-foreground",
          )}
          aria-hidden="true"
        />
        {place.opening.label}
      </span>
    </div>
  )
}

function safeHttpUrl(value?: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null
  } catch {
    return null
  }
}

function accessibilityLabel(value?: string | null) {
  return {
    yes: "Tillgängligt med rullstol",
    limited: "Delvis tillgängligt med rullstol",
    no: "Inte markerat som rullstolstillgängligt",
  }[value ?? ""] ?? value ?? "Uppgift saknas i källan"
}

function PlaceInfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-secondary/65 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-card text-sea shadow-sm">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.13em] text-muted-foreground">{label}</p>
        <div className="mt-1 break-words text-sm leading-6 text-foreground">{children}</div>
      </div>
    </div>
  )
}

export function PlaceDetailsDialog({
  place,
  isSaved,
  onClose,
  onToggleSaved,
  onNavigate,
}: {
  place: PlaceViewModel
  isSaved: boolean
  onClose: () => void
  onToggleSaved: () => void
  onNavigate: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const headingId = `place-details-${place.id}`
  const website = safeHttpUrl(place.website ?? place.contacts?.websites?.[0]?.value)
  const source = place.sources?.find((item) => item.sourceType === "OpenStreetMap") ?? place.sources?.[0]
  const sourceUrl = safeHttpUrl(source?.sourceUrl)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal()
      else dialog.setAttribute("open", "")
    }
    return () => {
      if (!dialog?.open) return
      if (typeof dialog.close === "function") dialog.close()
      else dialog.removeAttribute("open")
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[92svh] w-full max-w-none overflow-hidden rounded-t-[2rem] border border-border bg-card p-0 text-foreground shadow-[var(--shadow-float)] backdrop:bg-overlay/75 backdrop:backdrop-blur-sm sm:inset-0 sm:m-auto sm:max-w-[640px] sm:rounded-[2rem]"
    >
      <div className="max-h-[92svh] overflow-y-auto overscroll-contain">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card/95 px-5 py-4 backdrop-blur-xl">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-sea">
            <Info className="size-4" aria-hidden="true" />
            Platsinformation
          </p>
          <Button type="button" variant="ghost" size="icon" aria-label="Stäng platsinformation" onClick={onClose}>
            <X className="size-5" aria-hidden="true" />
          </Button>
        </header>

        <div className="space-y-6 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-7">
          <section>
            <div className="flex flex-wrap gap-2">
              {(place.categoryDetails?.length
                ? place.categoryDetails
                : [{ id: place.category, label: place.kind, emoji: "", isPrimary: true }]
              ).map((categoryDetail) => (
                <Badge key={categoryDetail.id}>
                  {categoryDetail.emoji ? `${categoryDetail.emoji} ` : ""}{categoryDetail.label}
                </Badge>
              ))}
            </div>
            <h2 id={headingId} className="mt-3 font-display text-3xl leading-tight font-semibold text-sea-deep">
              {place.name}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{place.description}</p>
            <PlaceMeta place={place} />
          </section>

          <section className="grid gap-3" aria-label="Fakta om platsen">
            <PlaceInfoRow icon={MapPin} label="Adress och position">
              <p>{place.address?.formatted || "Gatuadress saknas i källan"}</p>
              <p className="text-xs text-muted-foreground">
                {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
              </p>
            </PlaceInfoRow>

            <PlaceInfoRow icon={Clock3} label="Öppettider">
              {place.openingHours?.raw || place.openingHours?.note || "Uppgift saknas i källan"}
            </PlaceInfoRow>

            <PlaceInfoRow icon={Accessibility} label="Tillgänglighet">
              {accessibilityLabel(place.accessibility)}
            </PlaceInfoRow>

            <PlaceInfoRow icon={Globe2} label="Kontakt">
              <div className="flex flex-col items-start gap-1">
                {website && (
                  <a className="font-semibold text-sea-deep underline-offset-4 hover:underline" href={website} target="_blank" rel="noopener noreferrer">
                    Webbplats <ExternalLink className="ml-1 inline size-3.5" aria-hidden="true" />
                  </a>
                )}
                {place.phone && (
                  <a className="inline-flex items-center gap-1.5 font-semibold text-sea-deep underline-offset-4 hover:underline" href={`tel:${place.phone.replace(/[^+\d]/g, "")}`}>
                    <Phone className="size-3.5" aria-hidden="true" /> {place.phone}
                  </a>
                )}
                {place.email && (
                  <a className="inline-flex items-center gap-1.5 font-semibold text-sea-deep underline-offset-4 hover:underline" href={`mailto:${place.email}`}>
                    <Mail className="size-3.5" aria-hidden="true" /> {place.email}
                  </a>
                )}
                {!website && !place.phone && !place.email && "Kontaktuppgifter saknas i källan"}
              </div>
            </PlaceInfoRow>

            <PlaceInfoRow icon={CheckCircle2} label="Källa och aktualitet">
              <p>{place.verifiedLabel ? `Kontrollerad mot källan ${place.verifiedLabel}.` : "Verifieringsdatum saknas."}</p>
              {sourceUrl ? (
                <a className="mt-1 inline-flex items-center gap-1 font-semibold text-sea-deep underline-offset-4 hover:underline" href={sourceUrl} target="_blank" rel="noopener noreferrer">
                  {source?.sourceType || "Visa källa"} <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              ) : (
                <p className="mt-1 text-muted-foreground">Länk till källa saknas.</p>
              )}
            </PlaceInfoRow>
          </section>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button type="button" variant="secondary" onClick={onToggleSaved} aria-pressed={isSaved}>
              <Heart className={cn("size-4", isSaved && "fill-current text-poppy")} aria-hidden="true" />
              {isSaved ? "Sparad" : "Spara platsen"}
            </Button>
            <Button type="button" variant="poppy" onClick={onNavigate}>
              <Navigation className="size-4" aria-hidden="true" />
              {place.distanceKm == null ? "Visa på kartan" : "Ta mig hit"}
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  )
}

function CompactPlace({
  place,
  isSaved,
  isSelected,
  mapSelectionEnabled,
  onToggleSaved,
  onShowDetails,
  onSelectMap,
}: {
  place: PlaceViewModel
  isSaved: boolean
  isSelected: boolean
  mapSelectionEnabled: boolean
  onToggleSaved: () => void
  onShowDetails: () => void
  onSelectMap: () => void
}) {
  const image = getPlaceImage(place)
  return (
    <Card
      id={`place-card-${place.id}`}
      className={cn(
        "flex items-center gap-3 rounded-2xl p-3",
        isSelected && "border-sea ring-3 ring-sea/20",
      )}
    >
      <button type="button" className="shrink-0 rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40" onClick={onShowDetails} aria-label={`Visa information om ${place.name}`}>
        {image.moodImage ? (
          <span className="grid size-20 place-items-center rounded-xl bg-limestone text-sea-deep" aria-hidden="true">
            <MapPin className="size-6" />
          </span>
        ) : (
          <img src={image.src} alt="" className="size-20 rounded-xl object-cover" loading="lazy" />
        )}
      </button>
      <button type="button" className="min-w-0 flex-1 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40" onClick={onShowDetails}>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.13em] text-sea">{place.tag}</p>
        <h3 className="mt-1 truncate font-display text-lg leading-tight font-semibold text-sea-deep">{place.name}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-muted-foreground">
          {place.distanceLabel ? <span>{place.distanceLabel}</span> : <span>{place.kind}</span>}
          <span className={cn(place.opening.kind === "open" && "text-meadow")}>{place.opening.label}</span>
        </div>
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-sea-deep">
          <Info className="size-3.5" aria-hidden="true" />
          Visa information
        </span>
      </button>
      <div className="flex shrink-0 flex-col gap-1">
        {mapSelectionEnabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label={isSelected ? `${place.name} är vald på kartan` : `Visa ${place.name} på kartan`}
            aria-pressed={isSelected}
            onClick={onSelectMap}
          >
            <MapPin className={cn("size-4", isSelected && "fill-current text-sea")} aria-hidden="true" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11"
          aria-label={isSaved ? `Ta bort ${place.name} från sparade` : `Spara ${place.name}`}
          aria-pressed={isSaved}
          onClick={onToggleSaved}
        >
          <Heart className={cn("size-4", isSaved && "fill-current text-poppy")} aria-hidden="true" />
        </Button>
      </div>
    </Card>
  )
}

function LoadingPlaces() {
  return (
    <Card className="flex items-center gap-3 p-5" role="status">
      <LoaderCircle className="size-5 animate-spin text-sea" aria-hidden="true" />
      <div>
        <p className="font-semibold text-sea-deep">Hämtar platser från Gutafinn</p>
        <p className="mt-1 text-sm text-muted-foreground">Ett ögonblick, vi gör ön sökbar.</p>
      </div>
    </Card>
  )
}

function ApiUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="p-6 text-center" role="status">
      <p className="font-display text-xl text-sea-deep">Platsguiden tar en kort paus</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Designen är redo, men platsdata kunde inte nås just nu.
      </p>
      <Button className="mt-4" onClick={onRetry}>
        <RefreshCw className="size-4" aria-hidden="true" />
        Försök igen
      </Button>
    </Card>
  )
}

function EmptyPlaces({ savedView }: { savedView: boolean }) {
  return (
    <Card className="border-dashed p-6 text-center">
      <p className="font-display text-xl text-sea-deep">
        {savedView ? "Din Gotlandslista börjar här" : "Prova ett annat sökord"}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {savedView
          ? "Tryck på hjärtat vid en plats så sparas den till nästa besök."
          : "Det finns fler raukar, bad och smaker att hitta i guiden."}
      </p>
    </Card>
  )
}

function WeatherStrip({ position }: { position: Coordinates | null }) {
  const [weather, setWeather] = useState<Weather | null>(null)
  const [weatherState, setWeatherState] = useState<"loading" | "ready" | "error">("loading")
  const weatherPosition = position ?? LJUGARN

  useEffect(() => {
    const controller = new AbortController()
    setWeatherState("loading")
    void loadWeather(weatherPosition, controller.signal)
      .then((result) => {
        setWeather(result)
        setWeatherState("ready")
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setWeather(null)
        setWeatherState("error")
      })
    return () => controller.abort()
  }, [weatherPosition.lat, weatherPosition.lng])

  const windLabel = weather
    ? weather.windSpeed < 5
      ? "nästan vindstilla"
      : weather.windSpeed < 20
        ? "lugn bris"
        : "frisk vind"
    : null

  return (
    <section className="flex items-center gap-4 rounded-3xl bg-sea-deep p-5 text-sea-deep-foreground" aria-label="Aktuellt väder">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.13em] text-sea-deep-foreground/65">
          Aktuellt · {position ? "din plats" : "Ljugarn"}
        </p>
        {weatherState === "loading" ? (
          <p className="mt-1 flex items-center gap-2 font-display text-xl font-semibold">
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> Hämtar väder
          </p>
        ) : weather ? (
          <>
            <p className="mt-1 font-display text-2xl font-semibold">
              {Math.round(weather.temperature)}° · {windLabel}
            </p>
            <p className="mt-3 flex items-center gap-2 text-xs font-medium text-sea-deep-foreground/75">
              <Sunset className="size-4 text-sand" aria-hidden="true" />
              Solnedgång {weather.sunset}
              <Clock3 className="ml-1 size-4 text-sand" aria-hidden="true" />
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm font-medium text-sea-deep-foreground/75">Vädret kan inte nås just nu</p>
        )}
      </div>
      <Sun className="size-16 shrink-0 text-sand" strokeWidth={1.35} aria-hidden="true" />
    </section>
  )
}

function BottomNavigation({ active, onSelect }: { active: string; onSelect: (label: string) => void }) {
  return (
    <nav
      className="gutafinn-bottom-nav nav-safe fixed left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[408px] -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card/95 p-2 shadow-[var(--shadow-float)] backdrop-blur-xl"
      aria-label="Huvudnavigation"
    >
      {navItems.map(({ label, icon: Icon }) => {
        const isActive = active === label
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(label)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex h-12 min-w-12 flex-1 items-center justify-center gap-2 rounded-full px-3 text-xs font-semibold outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-ring/40",
              isActive ? "bg-sea-deep text-sea-deep-foreground" : "text-muted-foreground hover:bg-secondary",
            )}
          >
            <Icon className="size-[1.15rem]" aria-hidden="true" />
            {isActive && <span>{label}</span>}
            {!isActive && <span className="sr-only">{label}</span>}
          </button>
        )
      })}
    </nav>
  )
}
