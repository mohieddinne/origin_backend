const fs = require("fs");
const path = require("path");
const sqlHelpers = require("-/helpers/sql.helpers");
const db = require("../models");

// Aliases
const { DBVersion } = db;
const tSQL = sqlHelpers.trimSQLString;

const migrationsPath = path.join(__dirname);
const basename = path.basename(__filename);

const files = fs
  .readdirSync(migrationsPath, { withFileTypes: false })
  .filter(isValidJsFile)
  .sort()
  .map(explodeNameToObject);

// create table DBVersion if doesn't exist
module.exports.upgrade = async () => {
  console.log("\n");
  // If there is no migration to execute, return true
  if (!Array.isArray(files) || files.length <= 0) return true;
  // Check current DB version
  await DBVersion.sync();
  const currentVersion = await DBVersion.findOne({
    attributes: ["version"],
    order: [["version", "DESC"]],
    limit: 1,
  });
  const cVersion = currentVersion ? currentVersion.version : null;
  console.log("[DB] DB current version: " + cVersion);
  let i = 0;
  // Check next version
  const lastMigration = files[files.length - 1];
  if (cVersion !== lastMigration.version) {
    const migrations = files.filter((file) => {
      return !cVersion || file.version > cVersion;
    });
    for (const migrationFile of migrations) {
      const t = await db.sequelize.transaction();
      try {
        const migration = require("./" + migrationFile.file);
        if (typeof migration.up === "function") {
          await migration.up();
        } else if (typeof migration.up === "string") {
          await db.sequelize.query(tSQL(migration.up));
        }
        // Insert into DB
        await DBVersion.create({
          version: migrationFile.version,
          label: migrationFile.label,
        });
        console.log(
          "[DB] DB migrated to " +
            migrationFile.version +
            " label: " +
            migrationFile.label
        );
        i++;
        await t.commit();
      } catch (error) {
        await t.rollback();
        Sentry.captureException(error);
        console.error(error);
        throw error;
      }
    }
  }
  if (i) console.log(`[DB] Migration completed, ${i} migration(s) executed.`);
  else console.log(`[DB] No migration needed.`);
  console.log("\n");
  return true;
};

// down To given version
module.exports.downgradeTo = async (gToVersion) => {
  // If there is no migration to execute, return true
  if (!Array.isArray(files) && files.length <= 0) return true;
  // Check current DB version
  const currentVersion = await DBVersion.findOne({
    attributes: ["version"],
    order: [["version", "DESC"]],
    limit: 1,
  });
  if (!currentVersion) return false;
  const cVersion = currentVersion.version;
  if (gToVersion !== cVersion) {
    const migrations = files
      .filter((file) => {
        return file.version > gToVersion;
      })
      .reverse();
    for (const migrationFile of migrations)
      try {
        const migration = require("./" + migrationFile.file);
        if (typeof migration.down === "function") {
          await migration.down();
        } else if (typeof migration.down === "string") {
          await db.sequelize.query(tSQL(migration.down));
        }
        // Insert Into Db
        await DBVersion.destroy({
          where: { version: migrationFile.version },
        });
      } catch (error) {
        console.log(error);
        return false;
      }
  }
  return true;
};

function explodeNameToObject(fileName) {
  if (!fileName) return null;
  const fParts = fileName.split("-");
  return {
    version: fParts[0],
    label: fParts.slice(1).join(" ").replace(".js", ""),
    file: fileName,
  };
}

function isValidJsFile(fileName) {
  return (
    fileName.indexOf(".") !== 0 &&
    fileName.indexOf("index.js") !== 0 &&
    fileName !== basename &&
    fileName.slice(-3) === ".js"
  );
}
