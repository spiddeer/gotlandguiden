import { describe, expect, it } from "vitest"

import type { PlaceViewModel } from "@/lib/places"
import {
  applyPracticalFilters,
  countPracticalFilters,
  DEFAULT_PRACTICAL_FILTERS,
} from "@/lib/practical-filters"

const place = (overrides: Partial<PlaceViewModel> = {}): PlaceViewModel => ({
  id: "place",
  name: "Plats",
  category: "natur",
  lat: 57.5,
  lng: 18.5,
  description: "Natur",
  kind: "Natur",
  kinds: ["Natur"],
  tag: "Natur",
  distanceKm: 2,
  distanceLabel: "2 km",
  walkLabel: "25 min",
  opening: { kind: "unknown", label: "Tider saknas" },
  verifiedLabel: null,
  ...overrides,
})

describe("practical filters", () => {
  it("combines reliable distance and available-fact filters", () => {
    const matching = place({
      id: "matching",
      openingHours: { raw: "Mo-Fr 10:00-18:00" },
      contacts: { websites: [{ value: "https://example.test" }] },
      accessibility: "limited",
    })
    const results = applyPracticalFilters(
      [matching, place({ id: "too-far", distanceKm: 8 }), place({ id: "missing-facts" })],
      {
        radiusKm: 5,
        hasOpeningHours: true,
        hasContact: true,
        hasAccessibility: true,
      },
    )

    expect(results.map((item) => item.id)).toEqual(["matching"])
  })

  it("does not reject places by radius before GPS distance exists", () => {
    expect(
      applyPracticalFilters([place({ distanceKm: null })], {
        ...DEFAULT_PRACTICAL_FILTERS,
        radiusKm: 1,
      }),
    ).toHaveLength(1)
  })

  it("counts active choices for a compact filter badge", () => {
    expect(countPracticalFilters(DEFAULT_PRACTICAL_FILTERS)).toBe(0)
    expect(
      countPracticalFilters({
        radiusKm: 10,
        hasOpeningHours: true,
        hasContact: false,
        hasAccessibility: true,
      }),
    ).toBe(3)
  })
})
