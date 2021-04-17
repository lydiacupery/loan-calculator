// Update with your config settings.
const config = require("config");
// import config from config;

module.exports = {
  test: {
    client: "pg",
    connection: process.env.TEST_DATABASE_URL,
    migrations: {
      directory: __dirname + "/db/migrations",
    },
    seeds: {
      directory: __dirname + "/db/seeds/test",
    },
  },
  development: {
    client: "pg",
    connection: process.env.DEV_DATABASE_URL,
    migrations: {
      directory: __dirname + "/db/migrations",
    },
    seeds: {
      directory: __dirname + "/db/seeds/development",
    },
  },
  production: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: __dirname + "/db/migrations",
    },
    seeds: {
      directory: __dirname + "/db/seeds/production",
    },
  },
};
