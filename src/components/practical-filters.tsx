import {
  Accessibility,
  Clock3,
  Globe2,
  MapPin,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  countPracticalFilters,
  DEFAULT_PRACTICAL_FILTERS,
  type DistanceRadius,
  type PracticalFilterState,
} from "@/lib/practical-filters"
import { cn } from "@/lib/utils"

const distanceOptions: Array<{ value: DistanceRadius; label: string }> = [
  { value: null, label: "Alla" },
  { value: 1, label: "1 km" },
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
]

const factOptions: Array<{
  key: "hasOpeningHours" | "hasContact" | "hasAccessibility"
  label: string
  icon: LucideIcon
}> = [
  { key: "hasOpeningHours", label: "Öppettider finns", icon: Clock3 },
  { key: "hasContact", label: "Kontakt finns", icon: Globe2 },
  { key: "hasAccessibility", label: "Tillgänglighetsinfo", icon: Accessibility },
]

export function PracticalFilters({
  filters,
  positionAvailable,
  resultCount,
  onChange,
  onRequestLocation,
}: {
  filters: PracticalFilterState
  positionAvailable: boolean
  resultCount: number
  onChange: (filters: PracticalFilterState) => void
  onRequestLocation: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const activeCount = countPracticalFilters(filters)

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        className="w-full justify-between rounded-2xl"
        aria-expanded={expanded}
        aria-controls="practical-filter-panel"
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Praktiska filter
        </span>
        <span className="text-xs">
          {activeCount > 0 ? `${activeCount} aktiva · ${resultCount} träffar` : "Avstånd och fakta"}
        </span>
      </Button>

      {expanded && (
        <Card id="practical-filter-panel" className="mt-3 space-y-5 p-4">
          <fieldset>
            <legend className="text-sm font-bold text-sea-deep">Avstånd från dig</legend>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {distanceOptions.map((option) => {
                const selected = filters.radiusKm === option.value
                const disabled = option.value !== null && !positionAvailable
                return (
                  <button
                    key={option.label}
                    type="button"
                    aria-pressed={selected}
                    disabled={disabled}
                    onClick={() => onChange({ ...filters, radiusKm: option.value })}
                    className={cn(
                      "min-h-11 rounded-xl border px-2 text-xs font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-45",
                      selected
                        ? "border-sea-deep bg-sea-deep text-sea-deep-foreground"
                        : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
            {!positionAvailable && (
              <button
                type="button"
                onClick={onRequestLocation}
                className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-xs font-bold text-sea-deep underline decoration-sea/40 underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <MapPin className="size-4" aria-hidden="true" />
                Aktivera GPS för avståndsfilter
              </button>
            )}
          </fieldset>

          <fieldset>
            <legend className="text-sm font-bold text-sea-deep">Uppgifter som finns</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {factOptions.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filters[key]}
                  onClick={() => onChange({ ...filters, [key]: !filters[key] })}
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-xl border px-3 text-left text-xs font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                    filters[key]
                      ? "border-sea-deep bg-sea-deep text-sea-deep-foreground"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          {activeCount > 0 && (
            <Button type="button" variant="ghost" className="w-full" onClick={() => onChange(DEFAULT_PRACTICAL_FILTERS)}>
              <X className="size-4" aria-hidden="true" />
              Rensa praktiska filter
            </Button>
          )}
        </Card>
      )}
    </div>
  )
}
