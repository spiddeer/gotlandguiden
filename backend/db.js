const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const { runMigrations } = require("./migrations");
const { ensureCategories } = require("./place-repository");

const DEFAULT_DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", "places.db");

function openDatabase(dbPath = DEFAULT_DB_PATH) {
  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const database = new Database(dbPath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  runMigrations(database);
  ensureCategories(database);
  return database;
}

const db = openDatabase();

module.exports = { db, openDatabase };
