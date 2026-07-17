const path = require("path");
const Database = require("better-sqlite3");

async function createVerifiedBackup(sourcePath, targetPath) {
  if (!sourcePath || !targetPath) throw new Error("Source and backup paths are required");
  if (path.resolve(sourcePath) === path.resolve(targetPath)) {
    throw new Error("Backup path must differ from the live database path");
  }

  const source = new Database(sourcePath, { readonly: true, fileMustExist: true });
  try {
    await source.backup(targetPath);
  } finally {
    source.close();
  }

  const backup = new Database(targetPath, { readonly: true, fileMustExist: true });
  try {
    const result = backup.pragma("quick_check", { simple: true });
    if (result !== "ok") throw new Error(`SQLite backup verification failed: ${result}`);
  } finally {
    backup.close();
  }
}

if (require.main === module) {
  const sourcePath = process.env.DB_PATH || "/data/places.db";
  const targetPath = process.env.BACKUP_PATH;
  createVerifiedBackup(sourcePath, targetPath)
    .then(() => console.log(`Verified SQLite backup: ${targetPath}`))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}

module.exports = { createVerifiedBackup };
