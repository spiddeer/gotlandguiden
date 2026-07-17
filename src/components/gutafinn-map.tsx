import L from "leaflet"
import "leaflet.markercluster"
import { LocateFixed, MapPin, Search } from "lucide-react"
import { useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import type { MapBounds } from "@/lib/map-area"
import type { ApiPlace, Coordinates } from "@/lib/places"
import { cn } from "@/lib/utils"

const GOTLAND_CENTER: L.LatLngExpression = [57.5, 18.55]

function createPlaceIcon(selected = false) {
  return L.divIcon({
    className: cn("gutafinn-place-marker", selected && "gutafinn-place-marker--selected"),
    html: '<span aria-hidden="true"></span>',
    iconSize: selected ? [32, 32] : [24, 24],
    iconAnchor: selected ? [16, 16] : [12, 12],
    popupAnchor: [0, selected ? -19 : -15],
  })
}

function createUserIcon() {
  return L.divIcon({
    className: "gutafinn-user-marker",
    html: '<span aria-hidden="true"></span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

function createPopup(place: ApiPlace) {
  const popup = document.createElement("article")
  popup.className = "gutafinn-map-popup"

  const label = document.createElement("p")
  label.className = "gutafinn-map-popup__label"
  label.textContent = place.description || place.category

  const heading = document.createElement("h2")
  heading.className = "gutafinn-map-popup__heading"
  heading.textContent = place.name

  const address = document.createElement("p")
  address.className = "gutafinn-map-popup__address"
  address.textContent = place.address?.formatted || "Öppna platskortet för all information"

  const directions = document.createElement("a")
  directions.className = "gutafinn-map-popup__link"
  directions.href = `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=16/${place.lat}/${place.lng}`
  directions.target = "_blank"
  directions.rel = "noopener noreferrer"
  directions.textContent = "Visa vägen"

  popup.append(label, heading, address, directions)
  return popup
}

export function GutafinnMap({
  places,
  position,
  locationState,
  selectedPlaceId = null,
  onRequestLocation,
  onPlaceSelect,
  onSearchArea,
  mapAreaActive = false,
  className,
}: {
  places: ApiPlace[]
  position: Coordinates | null
  locationState: "idle" | "loading" | "ready" | "unavailable"
  selectedPlaceId?: string | null
  onRequestLocation: () => void
  onPlaceSelect?: (placeId: string) => void
  onSearchArea?: (bounds: MapBounds) => void
  mapAreaActive?: boolean
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const clustersRef = useRef<L.MarkerClusterGroup | null>(null)
  const placeMarkersRef = useRef(new Map<string, L.Marker>())
  const userMarkerRef = useRef<L.Marker | null>(null)
  const selectedMarkerIdRef = useRef<string | null>(null)
  const hasCenteredOnUserRef = useRef(false)
  const onPlaceSelectRef = useRef(onPlaceSelect)

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect
  }, [onPlaceSelect])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const map = L.map(container, {
      center: GOTLAND_CENTER,
      zoom: 9,
      zoomControl: true,
      attributionControl: true,
    })
    mapRef.current = map

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bidragsgivare',
    }).addTo(map)

    const clusters = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 46,
      showCoverageOnHover: false,
    })
    clustersRef.current = clusters
    map.addLayer(clusters)

    const resizeObserver = new ResizeObserver(() => map.invalidateSize())
    resizeObserver.observe(container)
    window.requestAnimationFrame(() => map.invalidateSize())

    return () => {
      resizeObserver.disconnect()
      placeMarkersRef.current.clear()
      clustersRef.current = null
      userMarkerRef.current = null
      mapRef.current = null
      map.remove()
    }
  }, [])

  useEffect(() => {
    const clusters = clustersRef.current
    if (!clusters) return

    const nextIds = new Set(places.map((place) => place.id))
    for (const [placeId, marker] of placeMarkersRef.current) {
      if (nextIds.has(placeId)) continue
      clusters.removeLayer(marker)
      marker.off()
      placeMarkersRef.current.delete(placeId)
    }

    for (const place of places) {
      const existing = placeMarkersRef.current.get(place.id)
      if (existing) {
        const current = existing.getLatLng()
        if (current.lat !== place.lat || current.lng !== place.lng) {
          existing.setLatLng([place.lat, place.lng])
        }
        existing.setPopupContent(createPopup(place))
        existing.getElement()?.setAttribute("title", place.name)
        continue
      }

      const marker = L.marker([place.lat, place.lng], {
        icon: createPlaceIcon(place.id === selectedMarkerIdRef.current),
        keyboard: true,
        title: place.name,
      })
      marker.bindPopup(createPopup(place), { closeButton: true, maxWidth: 260 })
      marker.on("click", () => onPlaceSelectRef.current?.(place.id))
      placeMarkersRef.current.set(place.id, marker)
      clusters.addLayer(marker)
    }
  }, [places])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!position) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove()
        userMarkerRef.current = null
      }
      hasCenteredOnUserRef.current = false
      return
    }

    const latLng: L.LatLngExpression = [position.lat, position.lng]
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(latLng)
    } else {
      userMarkerRef.current = L.marker(latLng, {
        icon: createUserIcon(),
        keyboard: false,
        interactive: false,
        zIndexOffset: 1000,
      }).addTo(map)
    }

    if (!hasCenteredOnUserRef.current) {
      map.setView(latLng, 12)
      hasCenteredOnUserRef.current = true
    }
  }, [position])

  useEffect(() => {
    const map = mapRef.current
    const clusters = clustersRef.current
    const previousId = selectedMarkerIdRef.current

    if (previousId && previousId !== selectedPlaceId) {
      placeMarkersRef.current.get(previousId)?.setIcon(createPlaceIcon())
    }

    selectedMarkerIdRef.current = selectedPlaceId
    if (!map || !clusters || !selectedPlaceId) return

    const marker = placeMarkersRef.current.get(selectedPlaceId)
    if (!marker) return
    marker.setIcon(createPlaceIcon(true))
    clusters.zoomToShowLayer(marker, () => {
      map.panTo(marker.getLatLng())
      marker.openPopup()
    })
  }, [selectedPlaceId])

  return (
    <section
      className={cn(
        "gutafinn-map-shell relative h-[100svh] min-h-[560px] overflow-hidden bg-limestone",
        className,
      )}
      aria-label="Karta över platser på Gotland"
    >
      <div
        ref={containerRef}
        className="gutafinn-map size-full"
        aria-label="Interaktiv OpenStreetMap-karta med platser på Gotland"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[800] flex flex-col items-end gap-2 px-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <div className="pointer-events-auto flex min-h-11 items-center gap-2 rounded-full border border-border bg-card/95 px-4 text-xs font-semibold text-sea-deep shadow-[var(--shadow-float)] backdrop-blur-md">
            <MapPin className="size-4 text-sea" aria-hidden="true" />
            {places.length > 0 ? `${places.length.toLocaleString("sv-SE")} platser` : "Inga platser här"}
          </div>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="pointer-events-auto rounded-full border border-border bg-card/95 shadow-[var(--shadow-float)] backdrop-blur-md"
            aria-label={locationState === "loading" ? "Söker din position" : "Visa min position"}
            onClick={onRequestLocation}
            disabled={locationState === "loading"}
          >
            <LocateFixed className="size-5" aria-hidden="true" />
          </Button>
        </div>
        {onSearchArea && (
          <Button
            type="button"
            variant="secondary"
            className="pointer-events-auto rounded-full border border-border bg-card/95 shadow-[var(--shadow-float)] backdrop-blur-md"
            onClick={() => {
              const bounds = mapRef.current?.getBounds()
              if (!bounds) return
              onSearchArea({
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest(),
              })
            }}
          >
            <Search className="size-4" aria-hidden="true" />
            {mapAreaActive ? "Uppdatera kartområdet" : "Sök i kartområdet"}
          </Button>
        )}
      </div>
    </section>
  )
}
