import * as Knex from "knex";

export async function up(knex: Knex): Promise<any> {
  await knex.schema.createTable("EventLog", table => {
    table
      .timestamp("timestamp")
      .defaultTo(knex.raw("NOW()"))
      .notNullable();
    table.specificType("index", "bigserial").notNullable();
    table.text("type").notNullable();
    table.jsonb("payload").notNullable();
    table.jsonb("effect");
    table.primary(["timestamp", "index"]);
    table.index(["payload", "effect"], "eventLogIndex", "GIN");
  });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.dropTable("EventLog");
}
