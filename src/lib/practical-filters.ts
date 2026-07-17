import type { PlaceViewModel } from "@/lib/places"

export type DistanceRadius = 1 | 5 | 10 | null

export type PracticalFilterState = {
  radiusKm: DistanceRadius
  hasOpeningHours: boolean
  hasContact: boolean
  hasAccessibility: boolean
}

export const DEFAULT_PRACTICAL_FILTERS: PracticalFilterState = {
  radiusKm: null,
  hasOpeningHours: false,
  hasContact: false,
  hasAccessibility: false,
}

function hasOpeningHours(place: PlaceViewModel) {
  return Boolean(
    place.openingHours?.raw ||
      place.openingHours?.note ||
      place.openingHours?.weekly?.length,
  )
}

function hasContact(place: PlaceViewModel) {
  return Boolean(
    place.website ||
      place.phone ||
      place.email ||
      place.contacts?.websites?.length ||
      place.contacts?.phones?.length ||
      place.contacts?.emails?.length,
  )
}

export function countPracticalFilters(filters: PracticalFilterState) {
  return Number(filters.radiusKm !== null) +
    Number(filters.hasOpeningHours) +
    Number(filters.hasContact) +
    Number(filters.hasAccessibility)
}

export function applyPracticalFilters(
  places: readonly PlaceViewModel[],
  filters: PracticalFilterState,
) {
  return places.filter((place) => {
    if (filters.radiusKm !== null && place.distanceKm != null && place.distanceKm > filters.radiusKm) {
      return false
    }
    if (filters.hasOpeningHours && !hasOpeningHours(place)) return false
    if (filters.hasContact && !hasContact(place)) return false
    if (filters.hasAccessibility && !place.accessibility) return false
    return true
  })
}
