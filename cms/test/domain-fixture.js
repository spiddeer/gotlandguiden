import { DatabaseSync } from 'node:sqlite';

export function initializeDomainDatabase(databasePath) {
  const db = new DatabaseSync(databasePath);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE categories (
      id TEXT PRIMARY KEY, label TEXT NOT NULL, color TEXT NOT NULL,
      emoji TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE places (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL,
      lat REAL NOT NULL, lng REAL NOT NULL, description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
    );
    CREATE TABLE place_details (
      place_id TEXT PRIMARY KEY REFERENCES places(id) ON DELETE CASCADE,
      street_address TEXT, postal_code TEXT, locality TEXT, municipality TEXT,
      accessibility TEXT, price_level INTEGER CHECK (price_level BETWEEN 1 AND 4),
      opening_hours_raw TEXT, opening_hours_note TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE place_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('website', 'phone', 'email')),
      value TEXT NOT NULL, label TEXT, UNIQUE (place_id, type, value)
    );
    CREATE TABLE place_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      url TEXT NOT NULL, alt_text TEXT, source_url TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0, UNIQUE (place_id, url)
    );
    CREATE TABLE place_categories (
      place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
      source_type TEXT, PRIMARY KEY (place_id, category_id)
    );
    CREATE TABLE visitor_corrections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      issue_type TEXT NOT NULL CHECK (issue_type IN ('hours','contact','location','accessibility','closed','other')),
      message TEXT NOT NULL CHECK (length(message) BETWEEN 10 AND 1000),
      contact_email TEXT,
      status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','resolved','dismissed')),
      resolution_note TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TEXT,
      reviewed_by TEXT
    );
    CREATE TABLE collections (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL CHECK (length(title) BETWEEN 2 AND 80),
      description TEXT NOT NULL CHECK (length(description) BETWEEN 10 AND 500),
      is_published INTEGER NOT NULL DEFAULT 0 CHECK (is_published IN (0, 1)),
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE collection_places (
      collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (collection_id, place_id),
      UNIQUE (collection_id, sort_order)
    );
    INSERT INTO categories (id, label, color, emoji, sort_order) VALUES
      ('mat', 'Mat & dryck', '#c0603f', '🍽️', 10),
      ('sevardhet', 'Sevärdheter', '#e0a458', '🏛️', 20),
      ('strand', 'Bad', '#3f9bc0', '🏖️', 30),
      ('smultronstallen', 'Smultronställen', '#60a074', '🌿', 40),
      ('natur', 'Natur & utflykter', '#4f8661', '🌲', 50),
      ('aktivitet', 'Aktiviteter', '#d1764f', '🚲', 60),
      ('familj', 'För familjen', '#bd7f2f', '🧸', 70),
      ('shopping', 'Lokalt & gårdsbutiker', '#aa6c84', '🛍️', 80);
  `);
  db.close();
}
