const fs = require("fs");
const path = require("path");
const { db } = require("./db");
const { deactivateSourcePlaces, mergeImportedPlace } = require("./place-repository");

const seedPath = path.join(__dirname, "seed-data.json");
const places = JSON.parse(fs.readFileSync(seedPath, "utf8"));
const importRun = db.prepare(`
  INSERT INTO import_runs (source_type, status, records_seen)
  VALUES ('OpenStreetMap', 'running', ?)
`).run(places.length);

try {
  db.transaction((rows) => {
    deactivateSourcePlaces(db, "OpenStreetMap");
    for (const place of rows) {
      mergeImportedPlace(db, place, {
        sourceType: "OpenStreetMap",
        sourceUrl: place.source?.sourceUrl || null,
        externalId: place.source?.externalId || place.id,
        lastVerifiedAt: place.source?.lastVerifiedAt || null,
      });
    }
  })(places);

  db.prepare(`
    UPDATE import_runs
    SET status = 'completed', completed_at = CURRENT_TIMESTAMP,
        records_written = ?, message = ?
    WHERE id = ?
  `).run(places.length, "Seed data upserted without replacing enrichment.", importRun.lastInsertRowid);
  console.log(`Upserted ${places.length} places.`);
} catch (error) {
  db.prepare(`
    UPDATE import_runs
    SET status = 'failed', completed_at = CURRENT_TIMESTAMP, message = ?
    WHERE id = ?
  `).run(error.message, importRun.lastInsertRowid);
  throw error;
}
