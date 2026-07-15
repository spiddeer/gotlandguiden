import { createFileRoute } from "@tanstack/react-router"
import {
  Bookmark,
  Camera,
  CheckCircle2,
  Clock3,
  Footprints,
  Heart,
  Home,
  LocateFixed,
  LoaderCircle,
  Map as MapIcon,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  Sun,
  Sunset,
  Utensils,
  Waves,
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
import { loadWeather, type Weather } from "@/lib/weather"

export const Route = createFileRoute("/")({
  component: GutafinnPage,
})

const SAVED_KEY = "gutafinn_saved_places"
const LJUGARN = { lat: 57.333523, lng: 18.713461 }

const categoryItems: Array<{ label: Category; icon: LucideIcon }> = [
  { label: "Allt", icon: Sun },
  { label: "Göra", icon: Waves },
  { label: "Se", icon: Camera },
  { label: "Äta", icon: Utensils },
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

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 5) return "God natt"
  if (hour < 11) return "God morgon"
  if (hour < 17) return "God eftermiddag"
  return "God kväll"
}

function getPlaceImage(place: ApiPlace) {
  const apiImage = place.images?.[0]?.url
  if (apiImage) return apiImage

  const name = place.name.toLocaleLowerCase("sv")
  if (name.includes("folhammar") || place.category === "natur") return raukarSea
  if (name.includes("tofta") || place.category === "strand") return toftaBeach
  if (name.includes("bakfickan") || place.category === "mat") return saffronPancake
  return visbyRoses
}

function GutafinnPage() {
  const [places, setPlaces] = useState<ApiPlace[]>([])
  const [apiState, setApiState] = useState<"loading" | "ready" | "error">("loading")
  const [category, setCategory] = useState<Category>("Allt")
  const [query, setQuery] = useState("")
  const [saved, setSaved] = useState<Set<string>>(loadSavedIds)
  const [activeNav, setActiveNav] = useState("Hem")
  const [position, setPosition] = useState<Coordinates | null>(null)
  const [locationState, setLocationState] = useState<"idle" | "loading" | "ready" | "unavailable">("idle")
  const [routeTarget, setRouteTarget] = useState<string | null>(null)
  const requestedLocation = useRef(false)
  const placeRequestId = useRef(0)

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
    localStorage.setItem(SAVED_KEY, JSON.stringify([...saved]))
  }, [saved])

  const visiblePlaces = useMemo(
    () =>
      filterPlaces(
        places,
        category,
        query,
        position,
        activeNav === "Sparat" ? saved : undefined,
      ),
    [activeNav, category, places, position, query, saved],
  )

  const nearbyCount = useMemo(
    () => (position ? countWithinRadius(places, position, 5) : null),
    [places, position],
  )
  const featuredPlace = visiblePlaces[0] ?? null
  const listStart = featuredPlace ? 1 : 0
  const listPlaces =
    activeNav === "Sparat"
      ? visiblePlaces.slice(listStart)
      : visiblePlaces.slice(listStart, query || category !== "Allt" ? 40 : 5)

  function toggleSaved(placeId: string) {
    setSaved((current) => {
      const next = new Set(current)
      if (next.has(placeId)) next.delete(placeId)
      else next.add(placeId)
      return next
    })
  }

  function openDirections(place: ApiPlace) {
    const destination = `${place.lat},${place.lng}`
    const url = position
      ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${position.lat}%2C${position.lng}%3B${destination}`
      : `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=15/${place.lat}/${place.lng}`
    window.open(url, "_blank", "noopener,noreferrer")
    setRouteTarget(place.name)
  }

  function selectNavigation(label: string) {
    if (label === "Karta") {
      const center = position ?? LJUGARN
      window.open(
        `https://www.openstreetmap.org/#map=11/${center.lat}/${center.lng}`,
        "_blank",
        "noopener,noreferrer",
      )
      return
    }

    setActiveNav(label)
    if (label === "Hem") {
      setCategory("Allt")
      setQuery("")
    }
    if (label === "Nära") requestLocation()
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[440px] overflow-x-hidden bg-background shadow-[var(--shadow-float)]">
      <Hero
        totalPlaces={places.length}
        nearbyCount={nearbyCount}
        locationState={locationState}
        onRequestLocation={requestLocation}
        onShowSaved={() => setActiveNav("Sparat")}
      />

      <div className="safe-bottom relative z-10 -mt-7 space-y-8 px-5">
        <SearchBar query={query} onQueryChange={setQuery} onRequestLocation={requestLocation} />
        <CategoryFilter selected={category} onSelect={setCategory} />

        {apiState === "error" ? (
          <ApiUnavailable onRetry={loadPlaces} />
        ) : apiState === "loading" ? (
          <LoadingPlaces />
        ) : featuredPlace ? (
          <section aria-labelledby="nearby-heading">
            <SectionHeading id="nearby-heading">
              {position ? "Närmast dig nu" : activeNav === "Sparat" ? "Dina sparade platser" : "Utvalt på Gotland"}
            </SectionHeading>
            <FeaturedPlace
              place={featuredPlace}
              isSaved={saved.has(featuredPlace.id)}
              onToggleSaved={() => toggleSaved(featuredPlace.id)}
              onNavigate={() => openDirections(featuredPlace)}
            />
            <p className="sr-only" role="status" aria-live="polite">
              {routeTarget ? `Kartan till ${routeTarget} har öppnats.` : ""}
            </p>
          </section>
        ) : (
          <EmptyPlaces savedView={activeNav === "Sparat"} />
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

            <div className="space-y-3">
              {listPlaces.map((place) => (
                <CompactPlace
                  key={place.id}
                  place={place}
                  isSaved={saved.has(place.id)}
                  onToggleSaved={() => toggleSaved(place.id)}
                  onOpen={() => openDirections(place)}
                />
              ))}
            </div>
          </section>
        )}

        <WeatherStrip position={position} />
      </div>

      <BottomNavigation active={activeNav} onSelect={selectNavigation} />
    </main>
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
      : nearbyCount != null
        ? `${nearbyCount.toLocaleString("sv-SE")} platser inom 5 km`
        : `${totalPlaces.toLocaleString("sv-SE")} platser på hela Gotland`

  return (
    <section className="relative h-[440px] overflow-hidden rounded-b-[36px] text-overlay-foreground">
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
            className="flex h-10 items-center gap-2 rounded-full bg-overlay px-4 text-xs font-semibold tracking-wide outline-none backdrop-blur-md focus-visible:ring-[3px] focus-visible:ring-overlay-foreground/55"
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
            {locationState === "ready" ? "Live GPS" : "Aktivera GPS"}
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
          <p className="mt-4 text-sm font-medium text-overlay-foreground/85">{statusText}</p>
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
  onNavigate,
}: {
  place: PlaceViewModel
  isSaved: boolean
  onToggleSaved: () => void
  onNavigate: () => void
}) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-[238px] overflow-hidden">
        <img src={getPlaceImage(place)} alt={place.name} className="size-full object-cover" />
        <Badge className="absolute left-4 top-4 bg-card/92 text-sea-deep backdrop-blur-md">{place.tag}</Badge>
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

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
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

        <Button variant="poppy" className="mt-5 w-full" onClick={onNavigate}>
          <Navigation className="size-4" aria-hidden="true" />
          {place.distanceKm == null ? "Visa på kartan" : "Ta mig hit"}
        </Button>
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

function CompactPlace({
  place,
  isSaved,
  onToggleSaved,
  onOpen,
}: {
  place: PlaceViewModel
  isSaved: boolean
  onToggleSaved: () => void
  onOpen: () => void
}) {
  return (
    <Card className="flex items-center gap-3 rounded-2xl p-3">
      <button type="button" className="shrink-0 rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40" onClick={onOpen}>
        <img src={getPlaceImage(place)} alt="" className="size-20 rounded-xl object-cover" loading="lazy" />
      </button>
      <button type="button" className="min-w-0 flex-1 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40" onClick={onOpen}>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.13em] text-sea">{place.tag}</p>
        <h3 className="mt-1 truncate font-display text-lg leading-tight font-semibold text-sea-deep">{place.name}</h3>
        <div className="mt-2 flex items-center gap-3 text-xs font-semibold text-muted-foreground">
          {place.distanceLabel ? <span>{place.distanceLabel}</span> : <span>{place.kind}</span>}
          <span className={cn(place.opening.kind === "open" && "text-meadow")}>{place.opening.label}</span>
        </div>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-10"
        aria-label={isSaved ? `Ta bort ${place.name} från sparade` : `Spara ${place.name}`}
        aria-pressed={isSaved}
        onClick={onToggleSaved}
      >
        <Heart className={cn("size-4", isSaved && "fill-current text-poppy")} aria-hidden="true" />
      </Button>
    </Card>
  )
}

function LoadingPlaces() {
  return (
    <Card className="flex items-center gap-3 p-5" role="status">
      <LoaderCircle className="size-5 animate-spin text-sea" aria-hidden="true" />
      <div>
        <p className="font-semibold text-sea-deep">Hämtar platser från Gotlandsguiden</p>
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
      className="nav-safe fixed left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[408px] -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card/95 p-2 shadow-[var(--shadow-float)] backdrop-blur-xl"
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
