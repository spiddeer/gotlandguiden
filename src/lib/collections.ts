const COLLECTION_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export type EditorialCollection = {
  id: string
  title: string
  description: string
  sortOrder: number
  placeIds: string[]
}

export function parseEditorialCollections(value: unknown): EditorialCollection[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const candidate = item as Record<string, unknown>
    const id = typeof candidate.id === "string" ? candidate.id.trim() : ""
    const title = typeof candidate.title === "string" ? candidate.title.trim() : ""
    const description = typeof candidate.description === "string" ? candidate.description.trim() : ""
    const sortOrder = Number(candidate.sortOrder)
    const placeIds = Array.isArray(candidate.placeIds)
      ? [...new Set(candidate.placeIds.filter((placeId): placeId is string =>
        typeof placeId === "string" && COLLECTION_ID_PATTERN.test(placeId),
      ))].slice(0, 20)
      : []
    if (
      seen.has(id) || !COLLECTION_ID_PATTERN.test(id) || title.length < 2 || title.length > 80 ||
      description.length < 10 || description.length > 500 || !Number.isInteger(sortOrder) ||
      placeIds.length === 0
    ) return []
    seen.add(id)
    return [{ id, title, description, sortOrder, placeIds }]
  }).sort((left, right) => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title, "sv"))
}
