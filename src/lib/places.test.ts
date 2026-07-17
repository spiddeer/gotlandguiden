import { describe, expect, it } from "vitest"

import {
  countWithinRadius,
  distanceKilometers,
  filterPlaces,
  formatDistance,
  getOpeningState,
  parseApiPlaces,
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
  it("maps API categories into visitor-facing filters", () => {
    expect(toProductCategory("aktivitet")).toBe("Aktiviteter")
    expect(toProductCategory("strand")).toBe("Bad")
    expect(toProductCategory("natur")).toBe("Natur")
    expect(toProductCategory("mat")).toBe("Mat & dryck")
  })

  it("matches filters through secondary API categories", () => {
    const results = filterPlaces(
      [place({ category: "service", categories: ["service", "mat"] })],
      "Mat & dryck",
      "",
      null,
    )
    expect(results).toHaveLength(1)
  })

  it("keeps the canonical category as the displayed primary kind", () => {
    const [result] = filterPlaces(
      [place({ category: "service", categories: ["mat", "service"] })],
      "Allt",
      "",
      null,
    )
    expect(result.kind).toBe("Mat & dryck")
    expect(result.kinds).toEqual(["Mat & dryck"])
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
      "Mat & dryck",
      "mat",
      position,
    )
    expect(results.map((item) => item.id)).toEqual(["near", "far"])
  })

  it("preserves the explicit order of an editorial collection", () => {
    const ordered = [place({ id: "second", name: "Ö-stoppet" }), place({ id: "first", name: "A-stoppet" })]
    expect(filterPlaces(ordered, "Allt", "", null, undefined, true).map((item) => item.id))
      .toEqual(["second", "first"])
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

  it("handles overnight hours in the Gotland timezone", () => {
    const overnight = place({
      openingHours: { weekly: [{ dayOfWeek: 1, opensAt: "22:00", closesAt: "02:00" }] },
    })
    expect(getOpeningState(overnight, new Date("2026-07-13T21:00:00Z")).kind).toBe("open")
    expect(getOpeningState(overnight, new Date("2026-07-13T23:00:00Z")).kind).toBe("open")
    expect(getOpeningState(overnight, new Date("2026-07-14T01:00:00Z")).kind).toBe("closed")
  })

  it("rejects malformed API payloads before they reach the UI", () => {
    expect(() => parseApiPlaces([{ name: "Saknar koordinater" }])).toThrow()
    expect(parseApiPlaces([place()])).toHaveLength(1)
  })

  it("drops malformed records without losing the valid catalogue", () => {
    const malformedNestedPlace = place({
      id: "bad",
      images: [{ url: "https://example.com/image.jpg" }],
    }) as unknown as Record<string, unknown>
    malformedNestedPlace.images = [{ url: 42 }]

    expect(parseApiPlaces([place(), malformedNestedPlace])).toEqual([place()])
  })

  it("removes utility and accommodation records from the public catalogue", () => {
    expect(
      parseApiPlaces([
        place(),
        place({ id: "fuel", category: "service", categories: ["service"] }),
        place({ id: "hotel", category: "boende", categories: ["boende"] }),
      ]).map((item) => item.id),
    ).toEqual(["place-1"])
  })

  it("accepts address, contact and source facts used by the information view", () => {
    const enriched = place({
      address: { formatted: "Strandvägen 1, Ljugarn" },
      phone: "+46 498 00 00 00",
      website: "https://example.test",
      contacts: { websites: [{ value: "https://example.test" }] },
      sources: [{ sourceType: "OpenStreetMap", sourceUrl: "https://www.openstreetmap.org/node/1" }],
    })
    expect(parseApiPlaces([enriched])).toEqual([enriched])
  })

  it("validates nested structures used by the UI", () => {
    const malformedHours = place() as unknown as Record<string, unknown>
    malformedHours.openingHours = {
      weekly: [{ dayOfWeek: 9, opensAt: "10:00", closesAt: "18:00" }],
    }

    expect(() => parseApiPlaces([malformedHours])).toThrow()
  })
})
