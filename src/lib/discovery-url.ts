import type { Category } from "@/lib/places"
import {
  type DistanceRadius,
  type PracticalFilterState,
} from "@/lib/practical-filters"

const CATEGORY_SLUGS: Record<Exclude<Category, "Allt">, string> = {
  "Mat & dryck": "mat",
  "Sevärdheter": "sevardheter",
  Bad: "bad",
  Natur: "natur",
  Aktiviteter: "aktiviteter",
  Familj: "familj",
  Lokalt: "lokalt",
}

const SLUG_CATEGORIES = new Map(
  Object.entries(CATEGORY_SLUGS).map(([category, slug]) => [slug, category as Category]),
)
const PLACE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export type DiscoveryUrlState = {
  query: string
  category: Category
  mapView: boolean
  selectedPlaceId: string | null
  practicalFilters: PracticalFilterState
}

export function parseDiscoverySearch(search: string): DiscoveryUrlState {
  const params = new URLSearchParams(search)
  const query = (params.get("q") ?? "").trim().slice(0, 100)
  const category = SLUG_CATEGORIES.get(params.get("kategori") ?? "") ?? "Allt"
  const requestedPlaceId = params.get("plats")?.trim() ?? ""
  const requestedRadius = Number(params.get("radie"))
  const radiusKm: DistanceRadius = [1, 5, 10].includes(requestedRadius)
    ? requestedRadius as Exclude<DistanceRadius, null>
    : null
  const facts = new Set((params.get("fakta") ?? "").split(","))

  return {
    query,
    category,
    mapView: params.get("vy") === "karta",
    selectedPlaceId: PLACE_ID_PATTERN.test(requestedPlaceId) ? requestedPlaceId : null,
    practicalFilters: {
      radiusKm,
      hasOpeningHours: facts.has("tider"),
      hasContact: facts.has("kontakt"),
      hasAccessibility: facts.has("tillganglighet"),
    },
  }
}

export function buildDiscoverySearch(state: DiscoveryUrlState) {
  const params = new URLSearchParams()
  const query = state.query.trim().slice(0, 100)
  if (query) params.set("q", query)
  if (state.category !== "Allt") params.set("kategori", CATEGORY_SLUGS[state.category])
  if (state.mapView) params.set("vy", "karta")
  if (state.selectedPlaceId && PLACE_ID_PATTERN.test(state.selectedPlaceId)) {
    params.set("plats", state.selectedPlaceId)
  }
  if (state.practicalFilters.radiusKm !== null) {
    params.set("radie", String(state.practicalFilters.radiusKm))
  }
  const facts = [
    state.practicalFilters.hasOpeningHours ? "tider" : null,
    state.practicalFilters.hasContact ? "kontakt" : null,
    state.practicalFilters.hasAccessibility ? "tillganglighet" : null,
  ].filter((value): value is string => value !== null)
  if (facts.length > 0) params.set("fakta", facts.join(","))

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ""
}
