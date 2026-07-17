export type Category =
  | "Allt"
  | "Mat & dryck"
  | "Sevärdheter"
  | "Bad"
  | "Natur"
  | "Aktiviteter"
  | "Familj"
  | "Lokalt"
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
  address?: {
    street?: string | null
    postalCode?: string | null
    locality?: string | null
    municipality?: string | null
    formatted?: string | null
  } | null
  accessibility?: string | null
  priceLevel?: number | null
  website?: string | null
  phone?: string | null
  email?: string | null
  contacts?: {
    websites?: Array<{ value: string; label?: string | null }>
    phones?: Array<{ value: string; label?: string | null }>
    emails?: Array<{ value: string; label?: string | null }>
  }
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
  sources?: Array<{
    sourceType: string
    sourceUrl?: string | null
    externalId?: string | null
    lastVerifiedAt?: string | null
  }>
  lastVerifiedAt?: string | null
}

export type OpeningState = {
  kind: "open" | "closed" | "known" | "unknown"
  label: string
}

export type PlaceViewModel = ApiPlace & {
  kind: PlaceCategory
  kinds: PlaceCategory[]
  tag: string
  distanceKm: number | null
  distanceLabel: string | null
  walkLabel: string | null
  opening: OpeningState
  verifiedLabel: string | null
}

const categoryGroups: Record<PlaceCategory, Set<string>> = {
  "Mat & dryck": new Set(["mat"]),
  Sevärdheter: new Set(["sevardhet"]),
  Bad: new Set(["strand"]),
  Natur: new Set(["natur", "smultronstallen"]),
  Aktiviteter: new Set(["aktivitet"]),
  Familj: new Set(["familj"]),
  Lokalt: new Set(["shopping"]),
}
const discoverableCategoryIds = new Set(
  Object.values(categoryGroups).flatMap((categories) => [...categories]),
)

const curatedPlaceIds = [
  "folhammars-naturreservat-w102775376",
  "ljugarns-strand-n11944704104",
  "bakfickan-n413208650",
  "visby-ringmur-r14377275",
]

export function toProductCategories(categories: string[]): PlaceCategory[] {
  const matches: PlaceCategory[] = []
  for (const category of categories) {
    for (const [productCategory, apiCategories] of Object.entries(categoryGroups)) {
      if (apiCategories.has(category) && !matches.includes(productCategory as PlaceCategory)) {
        matches.push(productCategory as PlaceCategory)
      }
    }
  }
  return matches.length > 0 ? matches : ["Sevärdheter"]
}

export function toProductCategory(category: string): PlaceCategory {
  return toProductCategories([category])[0]
}

function isNullableString(value: unknown) {
  return value == null || typeof value === "string"
}

function isCategoryDetail(value: unknown) {
  if (!value || typeof value !== "object") return false
  const detail = value as Record<string, unknown>
  return (
    typeof detail.id === "string" &&
    typeof detail.isPrimary === "boolean" &&
    typeof detail.label === "string" &&
    typeof detail.emoji === "string"
  )
}

function isOpeningPeriod(value: unknown) {
  if (!value || typeof value !== "object") return false
  const period = value as Record<string, unknown>
  return (
    Number.isInteger(period.dayOfWeek) &&
    typeof period.dayOfWeek === "number" &&
    period.dayOfWeek >= 0 &&
    period.dayOfWeek <= 6 &&
    isNullableString(period.opensAt) &&
    isNullableString(period.closesAt) &&
    isNullableString(period.note)
  )
}

function isOpeningHours(value: unknown) {
  if (value == null) return true
  if (typeof value !== "object") return false
  const openingHours = value as Record<string, unknown>
  return (
    isNullableString(openingHours.raw) &&
    isNullableString(openingHours.note) &&
    (openingHours.weekly == null ||
      (Array.isArray(openingHours.weekly) && openingHours.weekly.every(isOpeningPeriod)))
  )
}

function isImage(value: unknown) {
  if (!value || typeof value !== "object") return false
  const image = value as Record<string, unknown>
  return typeof image.url === "string" && isNullableString(image.altText)
}

function isAddress(value: unknown) {
  if (value == null) return true
  if (typeof value !== "object") return false
  const address = value as Record<string, unknown>
  return (
    isNullableString(address.street) &&
    isNullableString(address.postalCode) &&
    isNullableString(address.locality) &&
    isNullableString(address.municipality) &&
    isNullableString(address.formatted)
  )
}

function isContactItem(value: unknown) {
  if (!value || typeof value !== "object") return false
  const contact = value as Record<string, unknown>
  return typeof contact.value === "string" && isNullableString(contact.label)
}

function isContacts(value: unknown) {
  if (value == null) return true
  if (typeof value !== "object") return false
  const contacts = value as Record<string, unknown>
  return [contacts.websites, contacts.phones, contacts.emails].every(
    (items) => items == null || (Array.isArray(items) && items.every(isContactItem)),
  )
}

function isSource(value: unknown) {
  if (!value || typeof value !== "object") return false
  const source = value as Record<string, unknown>
  return (
    typeof source.sourceType === "string" &&
    isNullableString(source.sourceUrl) &&
    isNullableString(source.externalId) &&
    isNullableString(source.lastVerifiedAt)
  )
}

export function parseApiPlaces(input: unknown): ApiPlace[] {
  if (!Array.isArray(input)) throw new Error("API response must be an array")
  const isPlace = (value: unknown): value is ApiPlace => {
    if (!value || typeof value !== "object") return false
    const place = value as Partial<ApiPlace>
    return (
      typeof place.id === "string" &&
      typeof place.name === "string" &&
      typeof place.category === "string" &&
      typeof place.description === "string" &&
      typeof place.lat === "number" &&
      Number.isFinite(place.lat) &&
      place.lat >= -90 &&
      place.lat <= 90 &&
      typeof place.lng === "number" &&
      Number.isFinite(place.lng) &&
      place.lng >= -180 &&
      place.lng <= 180 &&
      (place.categories == null ||
        (Array.isArray(place.categories) && place.categories.every((category) => typeof category === "string"))) &&
      (place.categoryDetails == null ||
        (Array.isArray(place.categoryDetails) && place.categoryDetails.every(isCategoryDetail))) &&
      isAddress(place.address) &&
      isNullableString(place.accessibility) &&
      (place.priceLevel == null ||
        (typeof place.priceLevel === "number" && [1, 2, 3, 4].includes(place.priceLevel))) &&
      isNullableString(place.website) &&
      isNullableString(place.phone) &&
      isNullableString(place.email) &&
      isContacts(place.contacts) &&
      isOpeningHours(place.openingHours) &&
      (place.images == null || (Array.isArray(place.images) && place.images.every(isImage))) &&
      (place.sources == null || (Array.isArray(place.sources) && place.sources.every(isSource))) &&
      isNullableString(place.lastVerifiedAt)
    )
  }
  const validPlaces = input.filter(isPlace)
  if (input.length > 0 && validPlaces.length === 0) {
    throw new Error("API response contains no valid places")
  }
  return validPlaces.filter((place) =>
    [place.category, ...(place.categories ?? [])].some((category) =>
      discoverableCategoryIds.has(category),
    ),
  )
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
  if (weekly.length > 0) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Stockholm",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now)
    const weekday = parts.find((part) => part.type === "weekday")?.value
    const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday ?? "")
    const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0)
    const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0)
    const currentMinutes = hour * 60 + minute
    const previousDay = (dayIndex + 6) % 7
    const isOpen = weekly.some((period) => {
      const opens = timeToMinutes(period.opensAt)
      const closes = timeToMinutes(period.closesAt)
      if (opens == null || closes == null) return false
      if (opens <= closes) {
        return period.dayOfWeek === dayIndex && currentMinutes >= opens && currentMinutes < closes
      }
      return (
        (period.dayOfWeek === dayIndex && currentMinutes >= opens) ||
        (period.dayOfWeek === previousDay && currentMinutes < closes)
      )
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

  const kinds = toProductCategories([place.category, ...(place.categories ?? [])])
  return {
    ...place,
    kind: kinds[0],
    kinds,
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
  preserveOrder = false,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase("sv")

  return places
    .map((place) => toViewModel(place, position))
    .filter((place) => {
      const matchesCategory = category === "Allt" || place.kinds.includes(category)
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          place.name,
          place.description,
          place.tag,
          place.address?.formatted,
          place.website,
        ]
          .join(" ")
          .toLocaleLowerCase("sv")
          .includes(normalizedQuery)
      const matchesSaved = !savedIds || savedIds.has(place.id)
      return matchesCategory && matchesQuery && matchesSaved
    })
    .sort((a, b) => {
      if (preserveOrder) return 0
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
