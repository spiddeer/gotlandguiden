export type Category = "Allt" | "Göra" | "Se" | "Äta"
export type PlaceCategory = Exclude<Category, "Allt">

export type Coordinates = {
  lat: number
  lng: number
}

export type ApiCategory = {
  id: string
  label: string
  color: string
  emoji: string
  sortOrder: number
}

export type ApiPlace = {
  id: string
  name: string
  category: string
  categories?: string[]
  categoryDetails?: Array<{
    id: string
    isPrimary: boolean
    label: string
    emoji: string
  }>
  lat: number
  lng: number
  description: string
  openingHours?: {
    raw?: string | null
    note?: string | null
    weekly?: Array<{
      dayOfWeek: number
      opensAt?: string | null
      closesAt?: string | null
      note?: string | null
    }>
  } | null
  images?: Array<{ url: string; altText?: string | null }>
  lastVerifiedAt?: string | null
}

export type OpeningState = {
  kind: "open" | "closed" | "known" | "unknown"
  label: string
}

export type PlaceViewModel = ApiPlace & {
  kind: PlaceCategory
  tag: string
  distanceKm: number | null
  distanceLabel: string | null
  walkLabel: string | null
  opening: OpeningState
  verifiedLabel: string | null
}

const categoryGroups: Record<PlaceCategory, Set<string>> = {
  Göra: new Set(["aktivitet", "strand", "familj", "boende", "service"]),
  Se: new Set(["sevardhet", "natur", "smultronstallen", "shopping"]),
  Äta: new Set(["mat"]),
}

const curatedPlaceIds = [
  "folhammars-naturreservat-w102775376",
  "ljugarns-strand-n11944704104",
  "bakfickan-n413208650",
  "visby-ringmur-r14377275",
]

export function toProductCategory(category: string): PlaceCategory {
  for (const [productCategory, apiCategories] of Object.entries(categoryGroups)) {
    if (apiCategories.has(category)) return productCategory as PlaceCategory
  }

  return "Se"
}

export function distanceKilometers(from: Coordinates, to: Coordinates) {
  const earthRadiusKm = 6371
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const latDelta = toRadians(to.lat - from.lat)
  const lngDelta = toRadians(to.lng - from.lng)
  const fromLat = toRadians(from.lat)
  const toLat = toRadians(to.lat)
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDelta / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(distanceKm: number) {
  if (distanceKm < 1) return `${Math.max(10, Math.round((distanceKm * 1000) / 10) * 10)} m`
  if (distanceKm < 10) return `${distanceKm.toLocaleString("sv-SE", { maximumFractionDigits: 1 })} km`
  return `${Math.round(distanceKm)} km`
}

export function formatWalk(distanceKm: number) {
  const minutes = Math.max(1, Math.round((distanceKm / 4.8) * 60))
  if (minutes < 60) return `ca ${minutes} min`

  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder > 0 ? `ca ${hours} h ${remainder} min` : `ca ${hours} h`
}

function timeToMinutes(value?: string | null) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return null
  const [hours, minutes] = value.split(":").map(Number)
  return hours * 60 + minutes
}

export function getOpeningState(place: ApiPlace, now = new Date()): OpeningState {
  const raw = place.openingHours?.raw?.trim()
  if (raw === "24/7") return { kind: "open", label: "Öppet dygnet runt" }

  const weekly = place.openingHours?.weekly ?? []
  const today = weekly.filter((period) => period.dayOfWeek === now.getDay())
  if (weekly.length > 0 && today.length === 0) return { kind: "closed", label: "Stängt idag" }

  if (today.length > 0) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const isOpen = today.some((period) => {
      const opens = timeToMinutes(period.opensAt)
      const closes = timeToMinutes(period.closesAt)
      return opens != null && closes != null && currentMinutes >= opens && currentMinutes < closes
    })

    return isOpen ? { kind: "open", label: "Öppet nu" } : { kind: "closed", label: "Stängt nu" }
  }

  if (raw) return { kind: "known", label: "Öppettider finns" }
  return { kind: "unknown", label: "Tider saknas" }
}

export function formatVerifiedDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short", year: "numeric" }).format(date)
}

export function toViewModel(place: ApiPlace, position: Coordinates | null, now = new Date()): PlaceViewModel {
  const distanceKm = position
    ? distanceKilometers(position, { lat: place.lat, lng: place.lng })
    : null
  const primaryCategory = place.categoryDetails?.find((category) => category.isPrimary)

  return {
    ...place,
    kind: toProductCategory(place.category),
    tag: primaryCategory?.label ?? place.description ?? place.category,
    distanceKm,
    distanceLabel: distanceKm == null ? null : formatDistance(distanceKm),
    walkLabel: distanceKm == null ? null : formatWalk(distanceKm),
    opening: getOpeningState(place, now),
    verifiedLabel: formatVerifiedDate(place.lastVerifiedAt),
  }
}

export function filterPlaces(
  places: ApiPlace[],
  category: Category,
  query: string,
  position: Coordinates | null,
  savedIds?: Set<string>,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase("sv")

  return places
    .map((place) => toViewModel(place, position))
    .filter((place) => {
      const matchesCategory = category === "Allt" || place.kind === category
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [place.name, place.description, place.tag]
          .join(" ")
          .toLocaleLowerCase("sv")
          .includes(normalizedQuery)
      const matchesSaved = !savedIds || savedIds.has(place.id)
      return matchesCategory && matchesQuery && matchesSaved
    })
    .sort((a, b) => {
      if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm
      const aPriority = curatedPlaceIds.indexOf(a.id)
      const bPriority = curatedPlaceIds.indexOf(b.id)
      if (aPriority !== -1 || bPriority !== -1) {
        if (aPriority === -1) return 1
        if (bPriority === -1) return -1
        return aPriority - bPriority
      }
      return a.name.localeCompare(b.name, "sv")
    })
}

export function countWithinRadius(places: ApiPlace[], position: Coordinates, radiusKm: number) {
  return places.filter(
    (place) => distanceKilometers(position, { lat: place.lat, lng: place.lng }) <= radiusKm,
  ).length
}
