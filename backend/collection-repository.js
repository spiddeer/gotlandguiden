function listPublishedCollections(database) {
  const collections = database.prepare(`
    SELECT id, title, description, sort_order
    FROM collections
    WHERE is_published = 1
    ORDER BY sort_order, title COLLATE NOCASE, id
  `).all();
  if (!collections.length) return [];

  const byId = new Map(collections.map((collection) => [collection.id, {
    id: collection.id,
    title: collection.title,
    description: collection.description,
    sortOrder: collection.sort_order,
    placeIds: [],
  }]));
  for (const row of database.prepare(`
    SELECT cp.collection_id, cp.place_id
    FROM collection_places cp
    JOIN collections c ON c.id = cp.collection_id AND c.is_published = 1
    JOIN places p ON p.id = cp.place_id AND p.is_active = 1
    ORDER BY c.sort_order, c.title COLLATE NOCASE, cp.sort_order, cp.place_id
  `).all()) {
    byId.get(row.collection_id)?.placeIds.push(row.place_id);
  }

  return [...byId.values()].filter((collection) => collection.placeIds.length >= 2);
}

module.exports = { listPublishedCollections };
