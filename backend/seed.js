const fs = require("fs");
const path = require("path");
const { db } = require("./db");
const { upsertCorePlace } = require("./place-repository");

const seedPath = path.join(__dirname, "seed-data.json");
const places = JSON.parse(fs.readFileSync(seedPath, "utf8"));
const importRun = db.prepare(`
  INSERT INTO import_runs (source_type, status, records_seen)
  VALUES ('OpenStreetMap', 'running', ?)
`).run(places.length);

try {
  db.transaction((rows) => {
    for (const place of rows) {
      upsertCorePlace(db, place, {
        sourceType: "OpenStreetMap",
        externalId: place.id,
        lastVerifiedAt: "2026-07-14",
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
