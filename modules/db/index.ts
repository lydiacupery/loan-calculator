import config from "config";
import * as DateTimeIso from "modules/core/date-time-iso";
const env = config.get<string>("environment");

const knexConfig: any = require("../../knexfile")[env];

import knexModule from "knex";

export type Knex = knexModule;
const knex: typeof knexModule = require("knex");

/** The currently open connection. Set by getConnection and destroyConnection */
let $connection: knexModule | undefined = undefined;

export async function destroyConnection() {
  if ($connection) {
    await $connection.destroy();
    $connection = undefined;
  }
}

// https://github.com/WhoopInc/node-pg-range/blob/master/lib/parser.js
const oids = {
  BigInt: 20,
  Numeric: 1700,
  Integer: 23,
  Int4Range: 3904,
  Int8Range: 3926,
  NumRange: 3906,
  TimestampRange: 3908,
  TimestampWithTimezoneRange: 3910,
  DateRange: 3912,
  Date: 1082,
  TimestampWithTimezone: 1184,
};

export function getConnection() {
  if (!$connection) {
    /*
        Node types for Postgres types

        - When the postgres driver encounters a *datetime*, it creates a JavaScript Date. Cool!
        - When the postgres driver encounters a *time*, it creates a JavaScript string. Cool.
        - When the postgres driver encounters a *date* (not implying a time of day), it creates a JavaScript Date. Boo!

        This customizes the behavior to pass it through as a string, reducing the risk of time zone drift, etc.

        https://stackoverflow.com/a/50717046/202907

     */
    var pgTypes = require("pg").types;
    pgTypes.setTypeParser(oids.Date, (val: string) => val);
    pgTypes.setTypeParser(oids.Numeric, parseFloat);
    pgTypes.setTypeParser(oids.BigInt, parseFloat);
    pgTypes.setTypeParser(
      oids.TimestampWithTimezone,
      DateTimeIso.toIsoDateTime
    );

    $connection = knex(knexConfig);
  }
  return <knexModule>$connection;
}

export function _setConnection(knex: Knex) {
  $connection = knex;
}

export async function truncateAll(knex: Knex) {
  const result = await knex.raw(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema='public'
      AND table_type='BASE TABLE';
   `);
  const tables: string[] = result.rows.map((r: any) => r.table_name);
  const recordTables = tables.filter(t => !t.includes("knex"));
  const escapedTableNameList = recordTables.map(n => `"${n}"`).join(", ");
  await knex.raw(`TRUNCATE ${escapedTableNameList} CASCADE`);
}
