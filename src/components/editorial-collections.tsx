import { ArrowRight, BookOpen, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { EditorialCollection } from "@/lib/collections"

export function EditorialCollections({
  collections,
  activeCollection,
  onSelect,
  onClear,
}: {
  collections: EditorialCollection[]
  activeCollection: EditorialCollection | null
  onSelect: (collectionId: string) => void
  onClear: () => void
}) {
  if (!collections.length) return null

  if (activeCollection) {
    return (
      <Card className="border-sea/25 bg-secondary/70 p-5" role="status">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Badge>Redaktionens urval</Badge>
            <h2 className="mt-3 font-display text-2xl font-semibold text-sea-deep">{activeCollection.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{activeCollection.description}</p>
            <p className="mt-3 text-xs font-bold text-sea">
              {activeCollection.placeIds.length.toLocaleString("sv-SE")} platser i vald ordning
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Visa alla platser igen" onClick={onClear}>
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <section aria-labelledby="collections-heading">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-sea">Kurerat av redaktionen</p>
          <h2 id="collections-heading" className="mt-1 font-display text-[1.65rem] font-semibold text-sea-deep">
            Samlingar för en bra dag
          </h2>
        </div>
        <BookOpen className="size-5 shrink-0 text-sea" aria-hidden="true" />
      </div>
      <div className="scrollbar-hidden -mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1">
        {collections.map((collection) => (
          <button
            key={collection.id}
            type="button"
            onClick={() => onSelect(collection.id)}
            className="group min-h-44 w-[82%] max-w-[310px] shrink-0 snap-start rounded-3xl border border-border bg-card p-5 text-left shadow-[var(--shadow-card)] outline-none transition-transform focus-visible:ring-[3px] focus-visible:ring-ring/40 active:scale-[0.99]"
          >
            <span className="text-xs font-bold uppercase tracking-[0.13em] text-sea">
              {collection.placeIds.length.toLocaleString("sv-SE")} platser
            </span>
            <span className="mt-3 block font-display text-2xl leading-tight font-semibold text-sea-deep">
              {collection.title}
            </span>
            <span className="mt-2 line-clamp-2 block text-sm leading-6 text-muted-foreground">
              {collection.description}
            </span>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-sea-deep">
              Visa samlingen
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
