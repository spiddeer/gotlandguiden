import { describe, expect, it } from "vitest"

import {
  countWithinRadius,
  distanceKilometers,
  filterPlaces,
  formatDistance,
  getOpeningState,
  toProductCategory,
  type ApiPlace,
} from "@/lib/places"

const place = (overrides: Partial<ApiPlace> = {}): ApiPlace => ({
  id: "place-1",
  name: "Testplats",
  category: "mat",
  lat: 57.333,
  lng: 18.711,
  description: "Restaurang",
  lastVerifiedAt: "2026-07-14",
  ...overrides,
})

describe("place mapping", () => {
  it("maps API categories into the four product filters", () => {
    expect(toProductCategory("aktivitet")).toBe("Göra")
    expect(toProductCategory("strand")).toBe("Göra")
    expect(toProductCategory("natur")).toBe("Se")
    expect(toProductCategory("mat")).toBe("Äta")
  })

  it("computes honest GPS distance and radius counts", () => {
    const position = { lat: 57.333, lng: 18.711 }
    expect(distanceKilometers(position, position)).toBe(0)
    expect(formatDistance(0)).toBe("10 m")
    expect(countWithinRadius([place(), place({ id: "far", lat: 57.64, lng: 18.29 })], position, 5)).toBe(1)
  })

  it("filters all API results and sorts nearest first", () => {
    const position = { lat: 57.333, lng: 18.711 }
    const results = filterPlaces(
      [place({ id: "far", name: "Visby mat", lat: 57.64, lng: 18.29 }), place({ id: "near", name: "Ljugarn mat" })],
      "Äta",
      "mat",
      position,
    )
    expect(results.map((item) => item.id)).toEqual(["near", "far"])
  })

  it("only claims open when structured hours support it", () => {
    const mondayAtNoon = new Date("2026-07-13T12:00:00+02:00")
    expect(getOpeningState(place({ openingHours: { raw: "Mo-Fr 10:00-18:00", weekly: [] } }), mondayAtNoon).kind).toBe("known")
    expect(
      getOpeningState(
        place({ openingHours: { weekly: [{ dayOfWeek: 1, opensAt: "10:00", closesAt: "18:00" }] } }),
        mondayAtNoon,
      ).kind,
    ).toBe("open")
  })
})
