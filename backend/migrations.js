const MIGRATIONS = [
  {
    version: 1,
    name: "create_places",
    up(db) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS places (
          id          TEXT PRIMARY KEY,
          name        TEXT NOT NULL,
          category    TEXT NOT NULL,
          lat         REAL NOT NULL,
          lng         REAL NOT NULL,
          description TEXT
        );
      `);
    },
  },
  {
    version: 2,
    name: "add_rich_place_data",
    up(db) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
          id         TEXT PRIMARY KEY,
          label      TEXT NOT NULL,
          color      TEXT NOT NULL,
          emoji      TEXT NOT NULL,
          sort_order INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS place_categories (
          place_id   TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
          category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
          is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
          PRIMARY KEY (place_id, category_id)
        );

        CREATE TABLE IF NOT EXISTS place_details (
          place_id          TEXT PRIMARY KEY REFERENCES places(id) ON DELETE CASCADE,
          street_address    TEXT,
          postal_code       TEXT,
          locality          TEXT,
          municipality      TEXT,
          accessibility     TEXT,
          price_level       INTEGER CHECK (price_level BETWEEN 1 AND 4),
          opening_hours_raw TEXT,
          opening_hours_note TEXT,
          updated_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS place_contacts (
          id       INTEGER PRIMARY KEY AUTOINCREMENT,
          place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
          type     TEXT NOT NULL CHECK (type IN ('website', 'phone', 'email')),
          value    TEXT NOT NULL,
          label    TEXT,
          UNIQUE (place_id, type, value)
        );

        CREATE TABLE IF NOT EXISTS opening_hours (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          place_id   TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
          day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
          opens_at   TEXT,
          closes_at  TEXT,
          valid_from TEXT,
          valid_to   TEXT,
          note       TEXT
        );

        CREATE TABLE IF NOT EXISTS opening_hour_exceptions (
          id        INTEGER PRIMARY KEY AUTOINCREMENT,
          place_id  TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
          date      TEXT NOT NULL,
          is_closed INTEGER NOT NULL DEFAULT 1 CHECK (is_closed IN (0, 1)),
          opens_at  TEXT,
          closes_at TEXT,
          note      TEXT,
          UNIQUE (place_id, date)
        );

        CREATE TABLE IF NOT EXISTS place_images (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          place_id   TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
          url        TEXT NOT NULL,
          alt_text   TEXT,
          source_url TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          UNIQUE (place_id, url)
        );

        CREATE TABLE IF NOT EXISTS place_sources (
          id               INTEGER PRIMARY KEY AUTOINCREMENT,
          place_id         TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
          source_type      TEXT NOT NULL,
          source_url       TEXT,
          external_id      TEXT,
          last_verified_at TEXT,
          UNIQUE (place_id, source_type, external_id)
        );

        CREATE TABLE IF NOT EXISTS import_runs (
          id              INTEGER PRIMARY KEY AUTOINCREMENT,
          source_type     TEXT NOT NULL,
          status          TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
          started_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          completed_at    TEXT,
          records_seen    INTEGER NOT NULL DEFAULT 0,
          records_written INTEGER NOT NULL DEFAULT 0,
          message         TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
        CREATE INDEX IF NOT EXISTS idx_place_categories_category ON place_categories(category_id);
        CREATE INDEX IF NOT EXISTS idx_place_contacts_place ON place_contacts(place_id);
        CREATE INDEX IF NOT EXISTS idx_opening_hours_place_day ON opening_hours(place_id, day_of_week);
        CREATE INDEX IF NOT EXISTS idx_place_sources_place ON place_sources(place_id);
      `);
    },
  },
  {
    version: 3,
    name: "add_place_activity_state",
    up(db) {
      db.exec(`
        ALTER TABLE places ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1
          CHECK (is_active IN (0, 1));
        CREATE INDEX IF NOT EXISTS idx_places_active_category
          ON places(is_active, category);
      `);
    },
  },
  {
    version: 4,
    name: "track_category_source",
    up(db) {
      db.exec(`
        ALTER TABLE place_categories ADD COLUMN source_type TEXT;
        UPDATE place_categories
        SET source_type = 'OpenStreetMap'
        WHERE place_id IN (
          SELECT place_id FROM place_sources WHERE source_type = 'OpenStreetMap'
        );
        CREATE INDEX IF NOT EXISTS idx_place_categories_source
          ON place_categories(source_type, place_id);
      `);
    },
  },
];

function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY,
      name       TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const applied = new Set(
    db.prepare("SELECT version FROM schema_migrations").all().map((row) => row.version)
  );
  const record = db.prepare(
    "INSERT INTO schema_migrations (version, name) VALUES (?, ?)"
  );

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.version)) continue;
    db.transaction(() => {
      migration.up(db);
      record.run(migration.version, migration.name);
    })();
  }
}

module.exports = { MIGRATIONS, runMigrations };
