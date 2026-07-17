import { describe, expect, it } from "vitest"

import { buildDiscoverySearch, parseDiscoverySearch } from "@/lib/discovery-url"
import { DEFAULT_PRACTICAL_FILTERS } from "@/lib/practical-filters"

describe("shareable discovery URL state", () => {
  it("parses supported filters, map view, and a place selection", () => {
    expect(
      parseDiscoverySearch("?q=raukar&kategori=sevardheter&vy=karta&plats=hovs-hallar-n123"),
    ).toEqual({
      query: "raukar",
      category: "Sevärdheter",
      mapView: true,
      selectedPlaceId: "hovs-hallar-n123",
      practicalFilters: {
        radiusKm: null,
        hasOpeningHours: false,
        hasContact: false,
        hasAccessibility: false,
      },
    })
  })

  it("ignores unknown or unsafe values", () => {
    expect(parseDiscoverySearch("?kategori=service&vy=extern&plats=../admin")).toEqual({
      query: "",
      category: "Allt",
      mapView: false,
      selectedPlaceId: null,
      practicalFilters: {
        radiusKm: null,
        hasOpeningHours: false,
        hasContact: false,
        hasAccessibility: false,
      },
    })
  })

  it("builds a compact canonical query and omits defaults", () => {
    expect(
      buildDiscoverySearch({
        query: "  saffranspannkaka  ",
        category: "Mat & dryck",
        mapView: true,
        selectedPlaceId: "bakfickan-n123",
        practicalFilters: {
          radiusKm: 5,
          hasOpeningHours: true,
          hasContact: true,
          hasAccessibility: false,
        },
      }),
    ).toBe("?q=saffranspannkaka&kategori=mat&vy=karta&plats=bakfickan-n123&radie=5&fakta=tider%2Ckontakt")

    expect(
      buildDiscoverySearch({
        query: "",
        category: "Allt",
        mapView: false,
        selectedPlaceId: null,
        practicalFilters: {
          radiusKm: null,
          hasOpeningHours: false,
          hasContact: false,
          hasAccessibility: false,
        },
      }),
    ).toBe("")
  })

  it("round-trips every public category slug", () => {
    const categories = [
      "Mat & dryck",
      "Sevärdheter",
      "Bad",
      "Natur",
      "Aktiviteter",
      "Familj",
      "Lokalt",
    ] as const

    for (const category of categories) {
      const search = buildDiscoverySearch({
        query: "",
        category,
        mapView: false,
        selectedPlaceId: null,
        practicalFilters: {
          radiusKm: null,
          hasOpeningHours: false,
          hasContact: false,
          hasAccessibility: false,
        },
      })
      expect(parseDiscoverySearch(search).category).toBe(category)
    }
  })

  it("parses only supported practical filter values", () => {
    expect(parseDiscoverySearch("?radie=10&fakta=tider,kontakt,tillganglighet,okand").practicalFilters)
      .toEqual({
        radiusKm: 10,
        hasOpeningHours: true,
        hasContact: true,
        hasAccessibility: true,
      })
    expect(parseDiscoverySearch("?radie=500").practicalFilters).toEqual(DEFAULT_PRACTICAL_FILTERS)
  })
})
