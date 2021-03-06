const spawn = require("cross-spawn");
import * as fixtures from "modules/fixtures";
import * as db from "modules/db";

export const migrateAndSeed = async () => {
  if (process.env.USE_FAKE_DATA) {
    // && process.env.NODE_ENV == "production") {
    const knex = db.getConnection();
    try {
      console.log("Truncating tables");
      await db.truncateAll(knex);
    } catch (e) {
      console.log("Error truncating tables", e);
      await db.destroyConnection();
    }
  }

  spawn.sync("yarn", ["run", "db:migrate:latest"], { stdio: "inherit" });

  if (process.env.USE_FAKE_DATA) {
    // && process.env.NODE_ENV == "production") {
    try {
      await fixtures.seedScenarios(db.getConnection());
    } catch (e) {
      console.log("Error generating data", e);
    } finally {
      await db.destroyConnection();
    }
  }
};
