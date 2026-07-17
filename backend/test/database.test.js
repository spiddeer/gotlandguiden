const test = require("node:test");
const assert = require("node:assert/strict");
const Database = require("better-sqlite3");
const { openDatabase } = require("../db");
const { runMigrations } = require("../migrations");
const {
  ensureCategories,
  deactivateSourcePlaces,
  getPlace,
  listCategories,
  listPlaces,
  mergeImportedPlace,
  savePlace,
  upsertCorePlace,
} = require("../place-repository");

test("migrations preserve a legacy places table and its rows", () => {
  const database = new Database(":memory:");
  database.exec(`
    CREATE TABLE places (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      description TEXT
    );
    INSERT INTO places VALUES ('legacy', 'Befintlig plats', 'sevardhet', 57.6, 18.3, 'Ruin');
  `);
  database.pragma("foreign_keys = ON");
  runMigrations(database);
  ensureCategories(database);
  assert.equal(database.prepare("SELECT COUNT(*) count FROM places").get().count, 1);
  assert.equal(getPlace(database, "legacy").name, "Befintlig plats");
  assert.deepEqual(getPlace(database, "legacy").categories, ["sevardhet"]);
  database.close();
});

test("migrations create the rich schema and default categories", () => {
  const database = openDatabase(":memory:");
  const tables = new Set(
    database.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all()
      .map((row) => row.name)
  );
  for (const table of [
    "places",
    "categories",
    "place_categories",
    "place_details",
    "place_contacts",
    "opening_hours",
    "opening_hour_exceptions",
    "place_images",
    "place_sources",
    "import_runs",
    "visitor_corrections",
    "collections",
    "collection_places",
  ]) {
    assert.ok(tables.has(table), `${table} should exist`);
  }
  assert.equal(listCategories(database).length, 8);
  assert.deepEqual(
    listCategories(database).map((category) => category.id),
    ["mat", "sevardhet", "strand", "smultronstallen", "natur", "aktivitet", "familj", "shopping"]
  );
  assert.equal(database.prepare("SELECT COUNT(*) count FROM schema_migrations").get().count, 6);
  database.close();
});

test("core imports preserve manually enriched place data", () => {
  const database = openDatabase(":memory:");
  const core = {
    id: "testplats",
    name: "Testplats",
    category: "mat",
    lat: 57.64,
    lng: 18.29,
    description: "Restaurang",
  };
  upsertCorePlace(database, core, {
    sourceType: "OpenStreetMap",
    externalId: "n123",
    lastVerifiedAt: "2026-07-14",
  });
  savePlace(database, {
    id: core.id,
    address: { street: "Strandgatan 1", postalCode: "621 56", locality: "Visby" },
    contacts: {
      websites: [{ value: "https://example.test" }],
      phones: [{ value: "+46 498 00 00 00" }],
    },
    openingHours: {
      raw: "Mo-Fr 10:00-18:00",
      note: "Säsongsöppet",
      weekly: [{ dayOfWeek: 1, opensAt: "10:00", closesAt: "18:00" }],
      exceptions: [{ date: "2026-12-24", isClosed: true, note: "Julafton" }],
    },
    images: [{ url: "https://example.test/place.jpg", altText: "Testplatsen" }],
  });

  upsertCorePlace(database, { ...core, description: "Restaurang och café" }, {
    sourceType: "OpenStreetMap",
    externalId: "n123",
    lastVerifiedAt: "2026-07-15",
  });
  const place = getPlace(database, core.id);
  assert.equal(place.description, "Restaurang och café");
  assert.equal(place.address.formatted, "Strandgatan 1, 621 56 Visby");
  assert.equal(place.website, "https://example.test");
  assert.equal(place.phone, "+46 498 00 00 00");
  assert.equal(place.openingHours.weekly.length, 1);
  assert.equal(place.openingHours.exceptions[0].isClosed, true);
  assert.equal(place.images.length, 1);
  assert.equal(place.lastVerifiedAt, "2026-07-15");
  database.close();
});

test("a place can belong to several categories", () => {
  const database = openDatabase(":memory:");
  savePlace(database, {
    id: "gardscafe",
    name: "Gårdscaféet",
    category: "mat",
    categories: ["mat", "shopping", "familj"],
    lat: 57.5,
    lng: 18.5,
    description: "Café och gårdsbutik",
  }, { create: true });
  assert.deepEqual(getPlace(database, "gardscafe").categories, ["mat", "familj", "shopping"]);
  database.close();
});

test("public reads exclude utility-only places and hide legacy utility categories", () => {
  const database = openDatabase(":memory:");
  database.prepare(`
    INSERT INTO categories (id, label, color, emoji, sort_order)
    VALUES ('service', 'Service', '#607d8b', 'i', 100)
  `).run();

  mergeImportedPlace(database, {
    id: "fuel",
    name: "Bensinstation",
    category: "service",
    categories: ["service"],
    lat: 57.5,
    lng: 18.5,
    description: "Bensinstation",
  }, { sourceType: "OpenStreetMap", externalId: "fuel" });
  mergeImportedPlace(database, {
    id: "mixed",
    name: "Besöksmål med äldre servicekategori",
    category: "service",
    categories: ["service", "mat"],
    lat: 57.6,
    lng: 18.6,
    description: "Restaurang",
  }, { sourceType: "OpenStreetMap", externalId: "mixed" });

  assert.equal(getPlace(database, "fuel"), null);
  assert.deepEqual(listPlaces(database).map((place) => place.id), ["mixed"]);
  assert.equal(getPlace(database, "mixed").category, "mat");
  assert.deepEqual(getPlace(database, "mixed").categories, ["mat"]);
  database.close();
});

test("rich imports add categories and OSM fields without clearing manual enrichment", () => {
  const database = openDatabase(":memory:");
  savePlace(database, {
    id: "utflykten",
    name: "Utflykten",
    category: "natur",
    lat: 57.5,
    lng: 18.5,
    description: "Naturplats",
    openingHours: { note: "Kontrollera säsongsöppet före besöket" },
  }, { create: true });

  mergeImportedPlace(database, {
    id: "utflykten",
    name: "Utflykten",
    category: "smultronstallen",
    categories: ["smultronstallen", "natur"],
    lat: 57.5,
    lng: 18.5,
    description: "Utsiktsplats",
    address: { locality: "Ljugarn" },
    contacts: { websites: [{ value: "https://example.test" }] },
    openingHours: { raw: "24/7" },
  }, {
    sourceType: "OpenStreetMap",
    sourceUrl: "https://www.openstreetmap.org/node/1",
    externalId: "utflykten",
    lastVerifiedAt: "2026-07-14",
  });

  const place = getPlace(database, "utflykten");
  assert.deepEqual(place.categories, ["smultronstallen", "natur"]);
  assert.equal(place.address.locality, "Ljugarn");
  assert.equal(place.website, "https://example.test");
  assert.equal(place.openingHours.raw, "24/7");
  assert.equal(place.openingHours.note, "Kontrollera säsongsöppet före besöket");
  database.close();
});

test("a new source snapshot hides stale imports without deleting their enrichment", () => {
  const database = openDatabase(":memory:");
  const source = {
    sourceType: "OpenStreetMap",
    externalId: "stale-n1",
    lastVerifiedAt: "2026-07-14",
  };
  mergeImportedPlace(database, {
    id: "stale-n1",
    name: "Tidigare plats",
    category: "aktivitet",
    categories: ["aktivitet"],
    lat: 57.5,
    lng: 18.5,
    description: "Aktivitet",
  }, source);
  savePlace(database, {
    id: "stale-n1",
    openingHours: { note: "Manuellt kontrollerad" },
  });

  assert.equal(deactivateSourcePlaces(database, "OpenStreetMap"), 1);
  assert.equal(getPlace(database, "stale-n1"), null);
  assert.equal(database.prepare("SELECT COUNT(*) count FROM places WHERE id = 'stale-n1'").get().count, 1);
  assert.equal(
    database.prepare("SELECT opening_hours_note note FROM place_details WHERE place_id = 'stale-n1'").get().note,
    "Manuellt kontrollerad"
  );
  database.close();
});

test("source categories are synchronized while manual supplemental categories remain", () => {
  const database = openDatabase(":memory:");
  const source = {
    sourceType: "OpenStreetMap",
    externalId: "kallplats-n1",
    lastVerifiedAt: "2026-07-14",
  };
  const core = {
    id: "kallplats-n1",
    name: "Källplats",
    category: "sevardhet",
    categories: ["sevardhet", "natur"],
    lat: 57.5,
    lng: 18.5,
    description: "Besöksmål",
  };
  mergeImportedPlace(database, core, source);
  database.prepare(`
    INSERT INTO place_categories (place_id, category_id, is_primary, source_type)
    VALUES ('kallplats-n1', 'familj', 0, NULL)
  `).run();

  mergeImportedPlace(database, { ...core, categories: ["sevardhet"] }, source);
  assert.deepEqual(getPlace(database, core.id).categories, ["sevardhet", "familj"]);
  assert.equal(
    database.prepare(`
      SELECT source_type FROM place_categories
      WHERE place_id = 'kallplats-n1' AND category_id = 'sevardhet'
    `).get().source_type,
    "OpenStreetMap"
  );
  database.close();
});
