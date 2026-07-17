import { describe, expect, it } from "vitest"

import { filterPlacesInBounds } from "@/lib/map-area"

const places = [
  { id: "visby", lat: 57.64, lng: 18.29 },
  { id: "ljugarn", lat: 57.33, lng: 18.71 },
  { id: "far", lat: 58.2, lng: 19.2 },
]

describe("map area filtering", () => {
  it("keeps places inside the selected viewport, including its edge", () => {
    expect(
      filterPlacesInBounds(places, { north: 57.64, south: 57.3, west: 18.2, east: 18.8 })
        .map((place) => place.id),
    ).toEqual(["visby", "ljugarn"])
  })

  it("returns the original catalogue for missing or invalid bounds", () => {
    expect(filterPlacesInBounds(places, null)).toEqual(places)
    expect(
      filterPlacesInBounds(places, { north: -10, south: 10, west: 18, east: 19 }),
    ).toEqual(places)
  })

  it("supports viewports that cross the antimeridian", () => {
    const aroundDateline = [
      { id: "east", lat: 0, lng: 179 },
      { id: "west", lat: 0, lng: -179 },
      { id: "middle", lat: 0, lng: 0 },
    ]
    expect(
      filterPlacesInBounds(aroundDateline, { north: 10, south: -10, west: 170, east: -170 })
        .map((place) => place.id),
    ).toEqual(["east", "west"])
  })
})
