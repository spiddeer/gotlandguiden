const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");
const { createVerifiedBackup } = require("../backup");

test("online backup includes committed WAL data and can be restored", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "gutafinn-backup-"));
  const sourcePath = path.join(directory, "places.db");
  const backupPath = path.join(directory, "places-backup.db");
  try {
    const source = new Database(sourcePath);
    source.pragma("journal_mode = WAL");
    source.exec("CREATE TABLE entries (id INTEGER PRIMARY KEY, value TEXT NOT NULL)");
    const insert = source.prepare("INSERT INTO entries (value) VALUES (?)");
    for (let index = 0; index < 100; index += 1) insert.run(`entry-${index}`);

    await createVerifiedBackup(sourcePath, backupPath);
    source.close();

    const restored = new Database(backupPath, { readonly: true });
    assert.equal(restored.prepare("SELECT COUNT(*) count FROM entries").get().count, 100);
    assert.equal(restored.pragma("quick_check", { simple: true }), "ok");
    restored.close();
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
