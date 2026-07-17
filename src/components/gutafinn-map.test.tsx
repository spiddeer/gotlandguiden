/* @vitest-environment jsdom */

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ApiPlace } from "@/lib/places"

const doubles = vi.hoisted(() => {
  const markerRecords: Array<{
    options: Record<string, unknown>
    handlers: Record<string, () => void>
    bindPopup: ReturnType<typeof vi.fn>
    openPopup: ReturnType<typeof vi.fn>
    setIcon: ReturnType<typeof vi.fn>
    setLatLng: ReturnType<typeof vi.fn>
    setPopupContent: ReturnType<typeof vi.fn>
    remove: ReturnType<typeof vi.fn>
    getLatLng: ReturnType<typeof vi.fn>
  }> = []

  const mapInstance = {
    addLayer: vi.fn(),
    invalidateSize: vi.fn(),
    panTo: vi.fn(),
    remove: vi.fn(),
    setView: vi.fn(),
  }
  const clusters = {
    addLayer: vi.fn(),
    clearLayers: vi.fn(),
    removeLayer: vi.fn(),
    zoomToShowLayer: vi.fn((_marker: unknown, callback: () => void) => callback()),
  }
  const map = vi.fn(() => mapInstance)
  const markerClusterGroup = vi.fn(() => clusters)
  const divIcon = vi.fn((options: Record<string, unknown>) => options)
  const tileLayer = vi.fn(() => ({ addTo: vi.fn() }))
  const marker = vi.fn((_latLng: unknown, options: Record<string, unknown>) => {
    const handlers: Record<string, () => void> = {}
    const record = {
      options,
      handlers,
      bindPopup: vi.fn(),
      openPopup: vi.fn(),
      setIcon: vi.fn(),
      setLatLng: vi.fn(),
      setPopupContent: vi.fn(),
      remove: vi.fn(),
      getLatLng: vi.fn(() => _latLng),
    }
    const markerDouble = {
      ...record,
      addTo: vi.fn(() => markerDouble),
      bindPopup: vi.fn(() => markerDouble),
      on: vi.fn((event: string, handler: () => void) => {
        handlers[event] = handler
        return markerDouble
      }),
      off: vi.fn(() => markerDouble),
      getElement: vi.fn(() => null),
    }
    markerRecords.push({ ...record, bindPopup: markerDouble.bindPopup })
    return markerDouble
  })

  return {
    clusters,
    divIcon,
    map,
    mapInstance,
    marker,
    markerClusterGroup,
    markerRecords,
    tileLayer,
  }
})

vi.mock("leaflet", () => ({
  default: {
    divIcon: doubles.divIcon,
    map: doubles.map,
    marker: doubles.marker,
    markerClusterGroup: doubles.markerClusterGroup,
    tileLayer: doubles.tileLayer,
  },
}))
vi.mock("leaflet.markercluster", () => ({}))

import { GutafinnMap } from "./gutafinn-map"

class ResizeObserverDouble {
  observe() {}
  disconnect() {}
  unobserve() {}
}

const places: ApiPlace[] = [
  {
    id: "first",
    name: "Första platsen",
    category: "natur",
    lat: 57.64,
    lng: 18.3,
    description: "Natur",
  },
  {
    id: "second",
    name: "Andra platsen",
    category: "mat",
    lat: 57.65,
    lng: 18.31,
    description: "Mat",
  },
]

function renderMap(
  root: Root,
  props: Partial<React.ComponentProps<typeof GutafinnMap>> = {},
) {
  return act(async () => {
    root.render(
      <GutafinnMap
        places={places}
        position={null}
        locationState="ready"
        onRequestLocation={() => {}}
        {...props}
      />,
    )
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  doubles.markerRecords.length = 0
  vi.stubGlobal("ResizeObserver", ResizeObserverDouble)
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0)
    return 1
  })
  document.body.innerHTML = '<div id="root"></div>'
})

describe("GutafinnMap lifecycle", () => {
  it("initializes Leaflet once while markers and GPS update independently", async () => {
    const root = createRoot(document.getElementById("root")!)
    await renderMap(root)
    await renderMap(root, {
      position: { lat: 57.63, lng: 18.29 },
    })

    expect(doubles.map).toHaveBeenCalledTimes(1)
    expect(doubles.clusters.clearLayers).not.toHaveBeenCalled()
    expect(doubles.marker).toHaveBeenCalledTimes(3)
    expect(doubles.mapInstance.setView).toHaveBeenCalledWith([57.63, 18.29], 12)

    await act(async () => root.unmount())
    expect(doubles.mapInstance.remove).toHaveBeenCalledTimes(1)
  })

  it("changes selection without rebuilding the marker layer", async () => {
    const root = createRoot(document.getElementById("root")!)
    await renderMap(root)
    await renderMap(root, { selectedPlaceId: "first" })
    await renderMap(root, { selectedPlaceId: "second" })

    expect(doubles.map).toHaveBeenCalledTimes(1)
    expect(doubles.clusters.clearLayers).not.toHaveBeenCalled()
    expect(doubles.marker).toHaveBeenCalledTimes(2)
    expect(doubles.clusters.zoomToShowLayer).toHaveBeenCalledTimes(2)
    expect(doubles.mapInstance.panTo).toHaveBeenCalledTimes(2)

    const first = doubles.markerRecords.find((record) => record.options.title === "Första platsen")
    const second = doubles.markerRecords.find((record) => record.options.title === "Andra platsen")
    expect(first?.setIcon).toHaveBeenCalled()
    expect(second?.openPopup).toHaveBeenCalled()

    await act(async () => root.unmount())
  })

  it("notifies the parent when a marker is clicked", async () => {
    const onPlaceSelect = vi.fn()
    const root = createRoot(document.getElementById("root")!)
    await renderMap(root, { onPlaceSelect })

    const first = doubles.markerRecords.find((record) => record.options.title === "Första platsen")
    act(() => first?.handlers.click())
    expect(onPlaceSelect).toHaveBeenCalledWith("first")

    await act(async () => root.unmount())
  })

  it("removes filtered markers without rebuilding markers that remain", async () => {
    const root = createRoot(document.getElementById("root")!)
    await renderMap(root)
    await renderMap(root, { places: [places[0]] })

    expect(doubles.marker).toHaveBeenCalledTimes(2)
    expect(doubles.clusters.removeLayer).toHaveBeenCalledTimes(1)
    expect(doubles.clusters.clearLayers).not.toHaveBeenCalled()

    await act(async () => root.unmount())
  })
})
