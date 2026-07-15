import {
  ArrowLeft,
  Bike,
  Car,
  CheckCircle2,
  Footprints,
  LoaderCircle,
  MapPin,
  Navigation,
  RefreshCw,
  Sparkles,
  Timer,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

import raukarSea from "@/assets/raukar-sea.webp"
import saffronPancake from "@/assets/saffron-pancake.webp"
import toftaBeach from "@/assets/tofta-beach.webp"
import visbyRoses from "@/assets/visby-roses.webp"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { ApiPlace, Coordinates, PlaceCategory } from "@/lib/places"
import {
  addRecentCategory,
  addRecentHistoryItem,
  readSurpriseState,
  writeRecentCategories,
  writeRecentPlaceIds,
  writeTimeBudget,
  writeTravelMode,
} from "@/lib/surprise-storage"
import {
  DEFAULT_TIME_BUDGET,
  DEFAULT_TRAVEL_MODE,
  selectSurpriseRecommendation,
  type SurpriseRecommendation,
  type TimeBudget,
  type TravelMode,
} from "@/lib/surprise"
import { cn } from "@/lib/utils"

type ApiState = "loading" | "ready" | "error"
type LocationState = "idle" | "loading" | "ready" | "unavailable"

type SurpriseAdventureProps = {
  places: ApiPlace[]
  position: Coordinates | null
  apiState: ApiState
  locationState: LocationState
  onBack: () => void
  onRequestLocation: () => void
  onRetryPlaces: () => void
  onNavigate: (place: ApiPlace, travelMode: TravelMode) => void
  onRecommendationChange?: (placeId: string | null) => void
}

const timeOptions: Array<{ value: TimeBudget; label: string }> = [
  { value: "30", label: "30 min" },
  { value: "1-2h", label: "1–2 timmar" },
  { value: "half-day", label: "Halvdag" },
]

const travelOptions: Array<{ value: TravelMode; label: string; icon: LucideIcon }> = [
  { value: "walk", label: "Till fots", icon: Footprints },
  { value: "bicycle", label: "Cykel", icon: Bike },
  { value: "car", label: "Bil", icon: Car },
]

const travelLabels: Record<TravelMode, string> = {
  walk: "till fots",
  bicycle: "med cykel",
  car: "med bil",
}

function readInitialState() {
  if (typeof window === "undefined") {
    return {
      timeBudget: null,
      travelMode: null,
      recentPlaceIds: [],
      recentCategories: [] as PlaceCategory[],
    }
  }
  return readSurpriseState(window.localStorage)
}

function getMoodImage(place: ApiPlace, category: PlaceCategory) {
  if (place.category === "mat" || category === "Äta") {
    return {
      src: saffronPancake,
      alt: "Stämningsbild av gotländsk fika och saffranspannkaka",
    }
  }
  if (place.category === "strand") {
    return {
      src: toftaBeach,
      alt: "Stämningsbild av en gotländsk sandstrand",
    }
  }
  if (place.category === "natur") {
    return {
      src: raukarSea,
      alt: "Stämningsbild av gotländsk kust och raukar",
    }
  }
  return {
    src: visbyRoses,
    alt: "Stämningsbild av gotländsk bebyggelse och rosor",
  }
}

export function SurpriseAdventure({
  places,
  position,
  apiState,
  locationState,
  onBack,
  onRequestLocation,
  onRetryPlaces,
  onNavigate,
  onRecommendationChange,
}: SurpriseAdventureProps) {
  const initialState = useRef(readInitialState())
  const recentPlaceIds = useRef(initialState.current.recentPlaceIds)
  const recentCategories = useRef(initialState.current.recentCategories)
  const controlsRef = useRef<HTMLDivElement>(null)
  const [timeBudget, setTimeBudget] = useState<TimeBudget>(
    initialState.current.timeBudget ?? DEFAULT_TIME_BUDGET,
  )
  const [travelMode, setTravelMode] = useState<TravelMode>(
    initialState.current.travelMode ?? DEFAULT_TRAVEL_MODE,
  )
  const [recommendation, setRecommendation] = useState<SurpriseRecommendation | null>(null)
  const [reroll, setReroll] = useState(0)
  const [announcement, setAnnouncement] = useState("")

  useEffect(() => {
    if (apiState !== "ready" || !position) {
      setRecommendation(null)
      onRecommendationChange?.(null)
      return
    }

    const next = selectSurpriseRecommendation({
      places,
      position,
      timeBudget,
      travelMode,
      recentIds: recentPlaceIds.current,
      recentCategories: recentCategories.current,
    })
    setRecommendation(next)
    onRecommendationChange?.(next?.place.id ?? null)

    if (!next) return
    recentPlaceIds.current = addRecentHistoryItem(recentPlaceIds.current, next.place.id)
    recentCategories.current = addRecentCategory(
      recentCategories.current,
      next.productCategory,
    )
    writeRecentPlaceIds(window.localStorage, recentPlaceIds.current)
    writeRecentCategories(window.localStorage, recentCategories.current)
    setAnnouncement(reroll > 0 ? `Nytt tips: ${next.place.name}.` : "")
  }, [apiState, onRecommendationChange, places, position, reroll, timeBudget, travelMode])

  function selectTime(value: TimeBudget) {
    setTimeBudget(value)
    writeTimeBudget(window.localStorage, value)
  }

  function selectTravelMode(value: TravelMode) {
    setTravelMode(value)
    writeTravelMode(window.localStorage, value)
  }

  return (
    <section className="min-h-screen bg-background px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
      <header className="grid grid-cols-[44px_1fr_44px] items-center">
        <Button type="button" variant="secondary" size="icon" aria-label="Tillbaka till startsidan" onClick={onBack}>
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Button>
        <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-sea">Gutafinn</p>
        <span aria-hidden="true" />
      </header>

      <h1 className="mt-5 font-display text-[2.8rem] leading-[0.95] font-semibold tracking-[-0.035em] text-sea-deep">
        Överraska
        <span className="block italic">mig.</span>
      </h1>
      <p className="mt-3 max-w-[34ch] text-[0.95rem] leading-6 text-muted-foreground">
        Hur mycket tid har du? Vi hittar ett oväntat stopp nära dig.
      </p>

      <div ref={controlsRef} className="mt-6 scroll-mt-4 space-y-5">
        <fieldset>
          <legend className="mb-2 text-sm font-bold text-sea-deep">Jag har</legend>
          <div className="grid grid-cols-3 gap-2">
            {timeOptions.map((option) => (
              <ChoiceButton
                key={option.value}
                label={option.label}
                selected={timeBudget === option.value}
                onClick={() => selectTime(option.value)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-bold text-sea-deep">Jag tar mig fram</legend>
          <div className="grid grid-cols-3 gap-2">
            {travelOptions.map(({ value, label, icon: Icon }) => (
              <ChoiceButton
                key={value}
                label={label}
                selected={travelMode === value}
                icon={Icon}
                onClick={() => selectTravelMode(value)}
              />
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-6">
        {apiState === "loading" ? (
          <StatusCard
            icon={LoaderCircle}
            iconClassName="animate-spin"
            title="Hämtar platser"
            description="Vi letar efter små äventyr runt dig."
          />
        ) : apiState === "error" ? (
          <StatusCard
            icon={RefreshCw}
            title="Platsguiden tar en kort paus"
            description="Platsdata kunde inte nås just nu."
            actionLabel="Försök igen"
            onAction={onRetryPlaces}
          />
        ) : locationState === "loading" ? (
          <StatusCard
            icon={LoaderCircle}
            iconClassName="animate-spin"
            title="Söker din position"
            description="GPS behövs för att hitta ett tips som faktiskt är nära."
          />
        ) : locationState !== "ready" || !position ? (
          <StatusCard
            icon={MapPin}
            title="Aktivera din position"
            description="Tillåt platsåtkomst i webbläsaren. Då kan vi hitta något nära dig utan att spara din position."
            actionLabel="Aktivera GPS"
            onAction={onRequestLocation}
          />
        ) : recommendation ? (
          <AdventureCard
            recommendation={recommendation}
            travelMode={travelMode}
            onNavigate={() => onNavigate(recommendation.place, travelMode)}
            onReroll={() => setReroll((value) => value + 1)}
            onChange={() =>
              controlsRef.current?.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                  ? "auto"
                  : "smooth",
                block: "start",
              })
            }
          />
        ) : (
          <StatusCard
            icon={MapPin}
            title="Inget stopp inom 10 km"
            description="Prova en längre tid eller ett annat färdsätt för att bredda sökningen."
          />
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </section>
  )
}

function ChoiceButton({
  label,
  selected,
  icon: Icon,
  onClick,
}: {
  label: string
  selected: boolean
  icon?: LucideIcon
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex min-h-12 items-center justify-center gap-1.5 rounded-full border px-2 text-xs font-bold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40",
        selected
          ? "border-sea-deep bg-sea-deep text-sea-deep-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-secondary",
      )}
    >
      {Icon && <Icon className="size-4" aria-hidden="true" />}
      {label}
    </button>
  )
}

function StatusCard({
  icon: Icon,
  iconClassName,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon
  iconClassName?: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <Card className="p-6 text-center" role="status">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-sand text-sand-foreground">
        <Icon className={cn("size-5", iconClassName)} aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-display text-2xl font-semibold text-sea-deep">{title}</h2>
      <p className="mx-auto mt-2 max-w-[31ch] text-sm leading-6 text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button type="button" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Card>
  )
}

function AdventureCard({
  recommendation,
  travelMode,
  onNavigate,
  onReroll,
  onChange,
}: {
  recommendation: SurpriseRecommendation
  travelMode: TravelMode
  onNavigate: () => void
  onReroll: () => void
  onChange: () => void
}) {
  const mood = getMoodImage(recommendation.place, recommendation.productCategory)

  return (
    <Card className="overflow-hidden" aria-labelledby="surprise-place-name">
      <div className="relative h-[220px] overflow-hidden">
        <img src={mood.src} alt={mood.alt} className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-overlay to-transparent" aria-hidden="true" />
        <p className="absolute bottom-3 right-4 text-[0.68rem] font-semibold text-overlay-foreground">
          Stämningsbild från Gotland
        </p>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-sea">Ditt lilla äventyr · {recommendation.productCategory}</p>
            <h2 id="surprise-place-name" className="mt-1 font-display text-[1.75rem] leading-[1.05] font-semibold text-sea-deep">
              {recommendation.place.name}
            </h2>
          </div>
          <span className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-sand px-3 text-xs font-extrabold text-sand-foreground">
            <Timer className="size-4" aria-hidden="true" />
            ca {recommendation.estimatedTravelMinutes} min
          </span>
        </div>

        <p className="mt-2 text-xs font-semibold text-muted-foreground">
          Restid {travelLabels[travelMode]}
        </p>

        <ul className="mt-4 grid gap-2" aria-label="Därför visas tipset">
          {recommendation.reasons.map((reason) => (
            <li key={reason} className="flex min-h-11 items-center gap-3 rounded-xl bg-muted px-3 py-2.5 text-sm font-semibold text-foreground">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-card text-sea-deep">
                {reason.startsWith("Verifierad") ? (
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                ) : reason.includes("kategori") ? (
                  <Sparkles className="size-4" aria-hidden="true" />
                ) : (
                  <MapPin className="size-4" aria-hidden="true" />
                )}
              </span>
              {reason}
            </li>
          ))}
        </ul>

        <div className="mt-5 grid grid-cols-[1fr_52px] gap-2">
          <Button type="button" variant="poppy" onClick={onNavigate}>
            <Navigation className="size-4" aria-hidden="true" />
            Ta mig dit
          </Button>
          <Button type="button" variant="secondary" className="h-11 px-0" aria-label="Visa ett annat tips" onClick={onReroll}>
            <RefreshCw className="size-5" aria-hidden="true" />
          </Button>
        </div>

        <button
          type="button"
          onClick={onChange}
          className="mt-2 min-h-11 w-full rounded-xl text-xs font-bold text-sea-deep underline decoration-sea/50 underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          Ändra tid eller färdsätt
        </button>
      </div>
    </Card>
  )
}
