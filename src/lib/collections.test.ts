import { describe, expect, it } from "vitest"

import { parseEditorialCollections } from "@/lib/collections"

describe("editorial collections", () => {
  it("validates, deduplicates, limits, and sorts the public response", () => {
    const parsed = parseEditorialCollections([
      {
        id: "senare",
        title: "Senare tur",
        description: "Ett redaktionellt urval för en senare utflykt.",
        sortOrder: 20,
        placeIds: ["plats-tva", "plats-tva", "../unsafe"],
      },
      {
        id: "forst",
        title: "Första turen",
        description: "Ett redaktionellt urval som ska visas först.",
        sortOrder: 10,
        placeIds: ["plats-ett"],
      },
    ])

    expect(parsed.map((collection) => collection.id)).toEqual(["forst", "senare"])
    expect(parsed[1].placeIds).toEqual(["plats-tva"])
  })

  it("drops malformed and duplicate collections", () => {
    expect(parseEditorialCollections([
      { id: "ok", title: "Giltig", description: "En tillräckligt lång beskrivning.", sortOrder: 0, placeIds: ["plats"] },
      { id: "ok", title: "Dubblett", description: "En tillräckligt lång beskrivning.", sortOrder: 1, placeIds: ["plats"] },
      { id: "../fel", title: "Fel", description: "En tillräckligt lång beskrivning.", sortOrder: 2, placeIds: ["plats"] },
    ])).toHaveLength(1)
    expect(parseEditorialCollections({})).toEqual([])
  })
})
