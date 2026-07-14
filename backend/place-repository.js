const DEFAULT_CATEGORIES = [
  { id: "strand", label: "Stränder", color: "#3f9bc0", emoji: "🏖️", sortOrder: 10 },
  { id: "sevardhet", label: "Sevärdheter", color: "#e0a458", emoji: "🏛️", sortOrder: 20 },
  { id: "mat", label: "Mat & dryck", color: "#c0603f", emoji: "🍽️", sortOrder: 30 },
  { id: "smultronstallen", label: "Smultronställen", color: "#60a074", emoji: "🌿", sortOrder: 40 },
  { id: "boende", label: "Boende", color: "#7667a8", emoji: "🛏️", sortOrder: 50 },
  { id: "aktivitet", label: "Aktiviteter", color: "#d1764f", emoji: "🚲", sortOrder: 60 },
  { id: "natur", label: "Natur & friluftsliv", color: "#4f8661", emoji: "🌲", sortOrder: 70 },
  { id: "shopping", label: "Butiker & gårdsbutiker", color: "#aa6c84", emoji: "🛍️", sortOrder: 80 },
  { id: "familj", label: "För familjen", color: "#bd7f2f", emoji: "🧸", sortOrder: 90 },
  { id: "service", label: "Service", color: "#607d8b", emoji: "ℹ️", sortOrder: 100 },
];

function groupBy(rows, key) {
  const grouped = new Map();
  for (const row of rows) {
    const value = row[key];
    if (!grouped.has(value)) grouped.set(value, []);
    grouped.get(value).push(row);
  }
  return grouped;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

function withoutPlaceId(row) {
  const { place_id, ...publicFields } = row;
  return publicFields;
}

function ensureCategories(db, categories = DEFAULT_CATEGORIES) {
  const upsert = db.prepare(`
    INSERT INTO categories (id, label, color, emoji, sort_order)
    VALUES (@id, @label, @color, @emoji, @sortOrder)
    ON CONFLICT(id) DO UPDATE SET
      label = excluded.label,
      color = excluded.color,
      emoji = excluded.emoji,
      sort_order = excluded.sort_order
  `);
  db.transaction((rows) => rows.forEach((row) => upsert.run(row)))(categories);
  db.prepare(`
    INSERT OR IGNORE INTO place_categories (place_id, category_id, is_primary)
    SELECT p.id, p.category, 1
    FROM places p
    JOIN categories c ON c.id = p.category
  `).run();
}

function listCategories(db) {
  return db.prepare(`
    SELECT id, label, color, emoji, sort_order AS sortOrder
    FROM categories
    ORDER BY sort_order, label
  `).all();
}

function upsertCorePlace(db, place, source = null) {
  const upsert = db.prepare(`
    INSERT INTO places (id, name, category, lat, lng, description)
    VALUES (@id, @name, @category, @lat, @lng, @description)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      lat = excluded.lat,
      lng = excluded.lng,
      description = excluded.description
  `);
  upsert.run({ ...place, description: place.description || null });

  db.prepare("UPDATE place_categories SET is_primary = 0 WHERE place_id = ?")
    .run(place.id);
  db.prepare(`
    INSERT INTO place_categories (place_id, category_id, is_primary)
    VALUES (?, ?, 1)
    ON CONFLICT(place_id, category_id) DO UPDATE SET is_primary = 1
  `).run(place.id, place.category);

  if (source) {
    db.prepare(`
      INSERT INTO place_sources
        (place_id, source_type, source_url, external_id, last_verified_at)
      VALUES
        (@placeId, @sourceType, @sourceUrl, @externalId, @lastVerifiedAt)
      ON CONFLICT(place_id, source_type, external_id) DO UPDATE SET
        source_url = excluded.source_url,
        last_verified_at = excluded.last_verified_at
    `).run({
      placeId: place.id,
      sourceType: source.sourceType,
      sourceUrl: source.sourceUrl || null,
      externalId: source.externalId || place.id,
      lastVerifiedAt: source.lastVerifiedAt || null,
    });
  }
}

function deactivateSourcePlaces(db, sourceType) {
  return db.prepare(`
    UPDATE places
    SET is_active = 0
    WHERE id IN (
      SELECT place_id FROM place_sources WHERE source_type = ?
    )
  `).run(sourceType).changes;
}

function mergeImportedPlace(db, place, source = null) {
  upsertCorePlace(db, place, source);
  db.prepare("UPDATE places SET is_active = 1 WHERE id = ?").run(place.id);

  const insertCategory = db.prepare(`
    INSERT INTO place_categories (place_id, category_id, is_primary)
    VALUES (?, ?, 0)
    ON CONFLICT(place_id, category_id) DO NOTHING
  `);
  for (const categoryId of place.categories || []) {
    if (categoryId !== place.category) insertCategory.run(place.id, categoryId);
  }

  const address = place.address || {};
  const openingHours = place.openingHours || {};
  const detailValues = {
    placeId: place.id,
    streetAddress: address.street || null,
    postalCode: address.postalCode || null,
    locality: address.locality || null,
    municipality: address.municipality || null,
    accessibility: place.accessibility || null,
    openingHoursRaw: openingHours.raw || null,
    openingHoursNote: openingHours.note || null,
  };
  if (Object.entries(detailValues).some(([key, value]) => key !== "placeId" && value)) {
    db.prepare(`
      INSERT INTO place_details
        (place_id, street_address, postal_code, locality, municipality,
         accessibility, opening_hours_raw, opening_hours_note, updated_at)
      VALUES
        (@placeId, @streetAddress, @postalCode, @locality, @municipality,
         @accessibility, @openingHoursRaw, @openingHoursNote, CURRENT_TIMESTAMP)
      ON CONFLICT(place_id) DO UPDATE SET
        street_address = COALESCE(excluded.street_address, place_details.street_address),
        postal_code = COALESCE(excluded.postal_code, place_details.postal_code),
        locality = COALESCE(excluded.locality, place_details.locality),
        municipality = COALESCE(excluded.municipality, place_details.municipality),
        accessibility = COALESCE(excluded.accessibility, place_details.accessibility),
        opening_hours_raw = COALESCE(excluded.opening_hours_raw, place_details.opening_hours_raw),
        opening_hours_note = COALESCE(excluded.opening_hours_note, place_details.opening_hours_note),
        updated_at = CURRENT_TIMESTAMP
    `).run(detailValues);
  }

  const insertContact = db.prepare(`
    INSERT OR IGNORE INTO place_contacts (place_id, type, value, label)
    VALUES (?, ?, ?, ?)
  `);
  for (const type of ["website", "phone", "email"]) {
    const values = place.contacts?.[`${type}s`] || [];
    for (const item of values) {
      const normalized = typeof item === "string" ? { value: item } : item;
      if (normalized?.value) {
        insertContact.run(place.id, type, normalized.value, normalized.label || null);
      }
    }
  }
}

function addressFromRow(detail) {
  if (!detail) return null;
  const address = {
    street: detail.street_address,
    postalCode: detail.postal_code,
    locality: detail.locality,
    municipality: detail.municipality,
  };
  if (!Object.values(address).some(Boolean)) return null;
  address.formatted = [
    address.street,
    [address.postalCode, address.locality].filter(Boolean).join(" "),
    address.municipality && address.municipality !== address.locality
      ? address.municipality
      : null,
  ].filter(Boolean).join(", ");
  return address;
}

function serializePlaces(db, baseRows) {
  if (baseRows.length === 0) return [];

  const details = new Map(
    db.prepare("SELECT * FROM place_details").all().map((row) => [row.place_id, row])
  );
  const categories = groupBy(db.prepare(`
    SELECT pc.place_id, pc.category_id AS id, pc.is_primary AS isPrimary,
           c.label, c.color, c.emoji, c.sort_order AS sortOrder
    FROM place_categories pc
    JOIN categories c ON c.id = pc.category_id
    ORDER BY pc.is_primary DESC, c.sort_order, c.label
  `).all(), "place_id");
  const contacts = groupBy(
    db.prepare("SELECT place_id, type, value, label FROM place_contacts ORDER BY id").all(),
    "place_id"
  );
  const weeklyHours = groupBy(db.prepare(`
    SELECT place_id, day_of_week AS dayOfWeek, opens_at AS opensAt,
           closes_at AS closesAt, valid_from AS validFrom, valid_to AS validTo, note
    FROM opening_hours
    ORDER BY day_of_week, opens_at
  `).all(), "place_id");
  const exceptions = groupBy(db.prepare(`
    SELECT place_id, date, is_closed AS isClosed, opens_at AS opensAt,
           closes_at AS closesAt, note
    FROM opening_hour_exceptions
    ORDER BY date
  `).all(), "place_id");
  const images = groupBy(db.prepare(`
    SELECT place_id, url, alt_text AS altText, source_url AS sourceUrl,
           sort_order AS sortOrder
    FROM place_images
    ORDER BY sort_order, id
  `).all(), "place_id");
  const sources = groupBy(db.prepare(`
    SELECT place_id, source_type AS sourceType, source_url AS sourceUrl,
           external_id AS externalId, last_verified_at AS lastVerifiedAt
    FROM place_sources
    ORDER BY last_verified_at DESC, id
  `).all(), "place_id");

  return baseRows.map((place) => {
    const detail = details.get(place.id) || null;
    const placeCategories = categories.get(place.id) || [];
    const placeContacts = contacts.get(place.id) || [];
    const placeSources = (sources.get(place.id) || []).map(withoutPlaceId);
    const hours = (weeklyHours.get(place.id) || []).map(withoutPlaceId);
    const hourExceptions = (exceptions.get(place.id) || []).map(withoutPlaceId);
    const primaryCategory = placeCategories.find((category) => category.isPrimary)?.id
      || place.category;
    const websites = placeContacts.filter((item) => item.type === "website").map(withoutPlaceId);
    const phones = placeContacts.filter((item) => item.type === "phone").map(withoutPlaceId);
    const emails = placeContacts.filter((item) => item.type === "email").map(withoutPlaceId);
    const hasHours = Boolean(detail?.opening_hours_raw || detail?.opening_hours_note
      || hours.length || hourExceptions.length);

    return {
      id: place.id,
      name: place.name,
      category: primaryCategory,
      categories: placeCategories.map((category) => category.id),
      categoryDetails: placeCategories.map((category) => ({
        ...withoutPlaceId(category),
        isPrimary: Boolean(category.isPrimary),
      })),
      lat: place.lat,
      lng: place.lng,
      description: place.description || "",
      address: addressFromRow(detail),
      accessibility: detail?.accessibility || null,
      priceLevel: detail?.price_level || null,
      website: websites[0]?.value || null,
      phone: phones[0]?.value || null,
      email: emails[0]?.value || null,
      contacts: {
        websites,
        phones,
        emails,
      },
      openingHours: hasHours ? {
        raw: detail?.opening_hours_raw || null,
        note: detail?.opening_hours_note || null,
        weekly: hours,
        exceptions: hourExceptions.map((item) => ({
          ...item,
          isClosed: Boolean(item.isClosed),
        })),
      } : null,
      images: (images.get(place.id) || []).map(withoutPlaceId),
      sources: placeSources,
      lastVerifiedAt: placeSources.find((source) => source.lastVerifiedAt)?.lastVerifiedAt || null,
    };
  });
}

function listPlaces(db) {
  const places = db.prepare(`
    SELECT id, name, category, lat, lng, description
    FROM places
    WHERE is_active = 1
    ORDER BY name COLLATE NOCASE
  `).all();
  return serializePlaces(db, places);
}

function getPlace(db, id) {
  const place = db.prepare(`
    SELECT id, name, category, lat, lng, description
    FROM places WHERE id = ? AND is_active = 1
  `).get(id);
  return place ? serializePlaces(db, [place])[0] : null;
}

function replaceCategories(db, placeId, categoryIds, primaryCategory) {
  const valid = new Set(listCategories(db).map((category) => category.id));
  const unique = [...new Set([primaryCategory, ...(categoryIds || [])].filter(Boolean))];
  for (const categoryId of unique) {
    if (!valid.has(categoryId)) throw new Error(`Unknown category: ${categoryId}`);
  }

  db.prepare("DELETE FROM place_categories WHERE place_id = ?").run(placeId);
  const insert = db.prepare(`
    INSERT INTO place_categories (place_id, category_id, is_primary)
    VALUES (?, ?, ?)
  `);
  for (const categoryId of unique) {
    insert.run(placeId, categoryId, categoryId === primaryCategory ? 1 : 0);
  }
}

function saveDetails(db, placeId, input) {
  const current = db.prepare("SELECT * FROM place_details WHERE place_id = ?").get(placeId) || {};
  const address = input.address || {};
  const details = {
    placeId,
    streetAddress: hasOwn(address, "street") ? address.street : current.street_address || null,
    postalCode: hasOwn(address, "postalCode") ? address.postalCode : current.postal_code || null,
    locality: hasOwn(address, "locality") ? address.locality : current.locality || null,
    municipality: hasOwn(address, "municipality") ? address.municipality : current.municipality || null,
    accessibility: hasOwn(input, "accessibility") ? input.accessibility : current.accessibility || null,
    priceLevel: hasOwn(input, "priceLevel") ? input.priceLevel : current.price_level || null,
    openingHoursRaw: hasOwn(input.openingHours, "raw")
      ? input.openingHours.raw : current.opening_hours_raw || null,
    openingHoursNote: hasOwn(input.openingHours, "note")
      ? input.openingHours.note : current.opening_hours_note || null,
  };

  db.prepare(`
    INSERT INTO place_details
      (place_id, street_address, postal_code, locality, municipality,
       accessibility, price_level, opening_hours_raw, opening_hours_note, updated_at)
    VALUES
      (@placeId, @streetAddress, @postalCode, @locality, @municipality,
       @accessibility, @priceLevel, @openingHoursRaw, @openingHoursNote, CURRENT_TIMESTAMP)
    ON CONFLICT(place_id) DO UPDATE SET
      street_address = excluded.street_address,
      postal_code = excluded.postal_code,
      locality = excluded.locality,
      municipality = excluded.municipality,
      accessibility = excluded.accessibility,
      price_level = excluded.price_level,
      opening_hours_raw = excluded.opening_hours_raw,
      opening_hours_note = excluded.opening_hours_note,
      updated_at = CURRENT_TIMESTAMP
  `).run(details);
}

function replaceContacts(db, placeId, contacts) {
  db.prepare("DELETE FROM place_contacts WHERE place_id = ?").run(placeId);
  const insert = db.prepare(`
    INSERT INTO place_contacts (place_id, type, value, label) VALUES (?, ?, ?, ?)
  `);
  for (const type of ["website", "phone", "email"]) {
    const plural = `${type}s`;
    const values = contacts?.[plural] || (contacts?.[type] ? [contacts[type]] : []);
    for (const item of values) {
      const normalized = typeof item === "string" ? { value: item } : item;
      if (normalized?.value) insert.run(placeId, type, normalized.value, normalized.label || null);
    }
  }
}

function replaceOpeningHours(db, placeId, openingHours) {
  db.prepare("DELETE FROM opening_hours WHERE place_id = ?").run(placeId);
  db.prepare("DELETE FROM opening_hour_exceptions WHERE place_id = ?").run(placeId);
  const insertWeekly = db.prepare(`
    INSERT INTO opening_hours
      (place_id, day_of_week, opens_at, closes_at, valid_from, valid_to, note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of openingHours?.weekly || []) {
    insertWeekly.run(
      placeId, item.dayOfWeek, item.opensAt || null, item.closesAt || null,
      item.validFrom || null, item.validTo || null, item.note || null
    );
  }
  const insertException = db.prepare(`
    INSERT INTO opening_hour_exceptions
      (place_id, date, is_closed, opens_at, closes_at, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const item of openingHours?.exceptions || []) {
    insertException.run(
      placeId, item.date, item.isClosed === false ? 0 : 1,
      item.opensAt || null, item.closesAt || null, item.note || null
    );
  }
}

function replaceImages(db, placeId, images) {
  db.prepare("DELETE FROM place_images WHERE place_id = ?").run(placeId);
  const insert = db.prepare(`
    INSERT INTO place_images (place_id, url, alt_text, source_url, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);
  (images || []).forEach((image, index) => {
    insert.run(placeId, image.url, image.altText || null, image.sourceUrl || null, image.sortOrder ?? index);
  });
}

function replaceSources(db, placeId, sources) {
  db.prepare("DELETE FROM place_sources WHERE place_id = ?").run(placeId);
  const insert = db.prepare(`
    INSERT INTO place_sources
      (place_id, source_type, source_url, external_id, last_verified_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const source of sources || []) {
    insert.run(
      placeId, source.sourceType, source.sourceUrl || null,
      source.externalId || null, source.lastVerifiedAt || null
    );
  }
}

function savePlace(db, input, { create = false } = {}) {
  return db.transaction(() => {
    const current = getPlace(db, input.id);
    if (!create && !current) return null;
    if (create && current) throw new Error("Place already exists");

    const core = {
      id: input.id,
      name: hasOwn(input, "name") ? input.name : current.name,
      category: hasOwn(input, "category") ? input.category : current.category,
      lat: hasOwn(input, "lat") ? input.lat : current.lat,
      lng: hasOwn(input, "lng") ? input.lng : current.lng,
      description: hasOwn(input, "description") ? input.description : current.description,
    };
    upsertCorePlace(db, core);

    if (create || hasOwn(input, "categories") || hasOwn(input, "category")) {
      replaceCategories(
        db,
        input.id,
        hasOwn(input, "categories") ? input.categories : current?.categories,
        core.category
      );
    }
    if (input.address || hasOwn(input, "accessibility") || hasOwn(input, "priceLevel")
      || input.openingHours) {
      saveDetails(db, input.id, input);
    }
    if (hasOwn(input, "contacts")) replaceContacts(db, input.id, input.contacts);
    if (hasOwn(input, "openingHours")) replaceOpeningHours(db, input.id, input.openingHours);
    if (hasOwn(input, "images")) replaceImages(db, input.id, input.images);
    if (hasOwn(input, "sources")) replaceSources(db, input.id, input.sources);
    return getPlace(db, input.id);
  })();
}

module.exports = {
  DEFAULT_CATEGORIES,
  deactivateSourcePlaces,
  ensureCategories,
  getPlace,
  listCategories,
  listPlaces,
  mergeImportedPlace,
  savePlace,
  upsertCorePlace,
};
