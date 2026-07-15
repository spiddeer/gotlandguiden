import L from "leaflet"
import "leaflet.markercluster"
import { LocateFixed, MapPin } from "lucide-react"
import { useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import type { ApiPlace, Coordinates } from "@/lib/places"

const GOTLAND_CENTER: L.LatLngExpression = [57.5, 18.55]

function createPopup(place: ApiPlace) {
  const popup = document.createElement("article")
  popup.className = "gutafinn-map-popup"

  const label = document.createElement("p")
  label.className = "gutafinn-map-popup__label"
  label.textContent = place.description || place.category

  const heading = document.createElement("h2")
  heading.className = "gutafinn-map-popup__heading"
  heading.textContent = place.name

  const directions = document.createElement("a")
  directions.className = "gutafinn-map-popup__link"
  directions.href = `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=16/${place.lat}/${place.lng}`
  directions.target = "_blank"
  directions.rel = "noopener noreferrer"
  directions.textContent = "Visa vägen"

  popup.append(label, heading, directions)
  return popup
}

export function GutafinnMap({
  places,
  position,
  locationState,
  onRequestLocation,
}: {
  places: ApiPlace[]
  position: Coordinates | null
  locationState: "idle" | "loading" | "ready" | "unavailable"
  onRequestLocation: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const map = L.map(container, {
      center: position ? [position.lat, position.lng] : GOTLAND_CENTER,
      zoom: position ? 12 : 9,
      zoomControl: true,
      attributionControl: true,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bidragsgivare',
    }).addTo(map)

    const placeIcon = L.divIcon({
      className: "gutafinn-place-marker",
      html: '<span aria-hidden="true"></span>',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -15],
    })
    const clusters = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 46,
      showCoverageOnHover: false,
    })

    for (const place of places) {
      const marker = L.marker([place.lat, place.lng], {
        icon: placeIcon,
        keyboard: true,
        title: place.name,
      })
      marker.bindPopup(createPopup(place), { closeButton: true, maxWidth: 260 })
      clusters.addLayer(marker)
    }
    map.addLayer(clusters)

    if (position) {
      const userIcon = L.divIcon({
        className: "gutafinn-user-marker",
        html: '<span aria-hidden="true"></span>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
      L.marker([position.lat, position.lng], {
        icon: userIcon,
        keyboard: false,
        interactive: false,
        zIndexOffset: 1000,
      }).addTo(map)
    }

    window.requestAnimationFrame(() => map.invalidateSize())
    return () => {
      map.remove()
    }
  }, [places, position])

  return (
    <section className="gutafinn-map-shell relative h-[100svh] min-h-[560px] overflow-hidden bg-limestone" aria-label="Karta över platser på Gotland">
      <div
        ref={containerRef}
        className="gutafinn-map size-full"
        aria-label="Interaktiv OpenStreetMap-karta med platser på Gotland"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[800] flex items-start justify-end gap-2 px-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex min-h-11 items-center gap-2 rounded-full border border-border bg-card/95 px-4 text-xs font-semibold text-sea-deep shadow-[var(--shadow-float)] backdrop-blur-md">
          <MapPin className="size-4 text-sea" aria-hidden="true" />
          {places.length > 0 ? `${places.length.toLocaleString("sv-SE")} platser` : "Laddar platser…"}
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
    </section>
  )
}
