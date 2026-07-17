/* @vitest-environment jsdom */

import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { EditorialCollections } from "@/components/editorial-collections"
import type { EditorialCollection } from "@/lib/collections"

const collection: EditorialCollection = {
  id: "helgtur",
  title: "Helgtur på Gotland",
  description: "Två redaktionellt valda stopp för en lugn utflyktsdag.",
  sortOrder: 10,
  placeIds: ["plats-ett", "plats-tva"],
}

beforeEach(() => {
  document.body.innerHTML = '<div id="root"></div>'
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("editorial collections", () => {
  it("opens a published collection from the editorial carousel", async () => {
    const onSelect = vi.fn()
    const root = createRoot(document.getElementById("root")!)
    await act(async () => root.render(
      <EditorialCollections collections={[collection]} activeCollection={null} onSelect={onSelect} onClear={vi.fn()} />,
    ))

    const button = [...document.querySelectorAll("button")].find((item) => item.textContent?.includes("Visa samlingen"))!
    await act(async () => button.click())
    expect(onSelect).toHaveBeenCalledWith("helgtur")

    await act(async () => root.unmount())
  })

  it("shows the active context and clears it accessibly", async () => {
    const onClear = vi.fn()
    const root = createRoot(document.getElementById("root")!)
    await act(async () => root.render(
      <EditorialCollections collections={[collection]} activeCollection={collection} onSelect={vi.fn()} onClear={onClear} />,
    ))

    expect(document.body.textContent).toContain("2 platser i vald ordning")
    const clear = document.querySelector('button[aria-label="Visa alla platser igen"]')!
    await act(async () => (clear as HTMLButtonElement).click())
    expect(onClear).toHaveBeenCalledTimes(1)

    await act(async () => root.unmount())
  })
})
