export const schema = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  emoji TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS place_details (
  place_id TEXT PRIMARY KEY REFERENCES places(id) ON DELETE CASCADE,
  street_address TEXT,
  postal_code TEXT,
  locality TEXT,
  municipality TEXT,
  accessibility TEXT,
  price_level INTEGER CHECK (price_level BETWEEN 1 AND 4),
  opening_hours_raw TEXT,
  opening_hours_note TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS place_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('website', 'phone', 'email')),
  value TEXT NOT NULL,
  label TEXT,
  UNIQUE (place_id, type, value)
);

CREATE TABLE IF NOT EXISTS place_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  source_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (place_id, url)
);

CREATE TABLE IF NOT EXISTS place_categories (
  place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  source_type TEXT,
  PRIMARY KEY (place_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_places_active_category ON places(is_active, category);
CREATE INDEX IF NOT EXISTS idx_place_contacts_place ON place_contacts(place_id);

CREATE TABLE IF NOT EXISTS cms_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL COLLATE NOCASE UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS passkey_credentials (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES cms_users(id) ON DELETE CASCADE,
  public_key BLOB NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT NOT NULL DEFAULT '[]',
  device_type TEXT NOT NULL,
  backed_up INTEGER NOT NULL DEFAULT 0 CHECK (backed_up IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at TEXT
);

CREATE TABLE IF NOT EXISTS webauthn_challenges (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('registration', 'authentication')),
  challenge TEXT NOT NULL,
  username TEXT,
  display_name TEXT,
  user_handle BLOB,
  user_id INTEGER REFERENCES cms_users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_passkey_credentials_user ON passkey_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires ON webauthn_challenges(expires_at);

INSERT OR IGNORE INTO categories (id, label, color, emoji, sort_order) VALUES
  ('strand', 'Stränder', '#3f9bc0', '🏖️', 10),
  ('sevardhet', 'Sevärdheter', '#e0a458', '🏛️', 20),
  ('mat', 'Mat & dryck', '#c0603f', '🍽️', 30),
  ('smultronstallen', 'Smultronställen', '#60a074', '🌿', 40),
  ('boende', 'Boende', '#7667a8', '🛏️', 50),
  ('aktivitet', 'Aktiviteter', '#d1764f', '🚲', 60),
  ('natur', 'Natur & friluftsliv', '#4f8661', '🌲', 70),
  ('shopping', 'Butiker & gårdsbutiker', '#aa6c84', '🛍️', 80),
  ('familj', 'För familjen', '#bd7f2f', '🧸', 90),
  ('service', 'Service', '#607d8b', 'ℹ️', 100);
`;
