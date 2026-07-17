export type MapBounds = {
  north: number
  south: number
  east: number
  west: number
}

function validBounds(bounds: MapBounds) {
  return (
    Number.isFinite(bounds.north) &&
    Number.isFinite(bounds.south) &&
    Number.isFinite(bounds.east) &&
    Number.isFinite(bounds.west) &&
    bounds.north >= bounds.south &&
    bounds.north <= 90 &&
    bounds.south >= -90 &&
    bounds.east >= -180 &&
    bounds.east <= 180 &&
    bounds.west >= -180 &&
    bounds.west <= 180
  )
}

export function filterPlacesInBounds<T extends { lat: number; lng: number }>(
  places: readonly T[],
  bounds: MapBounds | null,
): T[] {
  if (!bounds || !validBounds(bounds)) return [...places]

  return places.filter((place) => {
    if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return false
    const insideLatitude = place.lat >= bounds.south && place.lat <= bounds.north
    const insideLongitude = bounds.west <= bounds.east
      ? place.lng >= bounds.west && place.lng <= bounds.east
      : place.lng >= bounds.west || place.lng <= bounds.east
    return insideLatitude && insideLongitude
  })
}
