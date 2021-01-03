import * as Knex from "knex";
import { addForeignKeyColumn } from "../helpers";
import { loanLensOpsV1 } from "./effective-date-time-helpers/lens-definitions";

export async function up(knex: Knex): Promise<any> {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  await knex.schema.createTable("Loan", async t => {
    t.uuid("id")
      .primary()
      .defaultTo(knex.raw("uuid_generate_v4()"));
    t.dateTime("startAt").notNullable();
    t.integer("paymentsPerYear").notNullable();
    t.decimal("paymentAmount").notNullable();
    t.decimal("principal").notNullable();
    t.string("name").notNullable();
  });

  await knex.schema.createTable("LoanVersion", t => {
    t.uuid("id")
      .primary()
      .defaultTo(knex.raw("uuid_generate_v4()"));
    t.decimal("extraPayment");
    t.decimal("rate");

    t.specificType("effectiveDateTimeRange", "tstzrange").notNullable();
    addForeignKeyColumn(t, "headerId", "Loan");
  });
  await loanLensOpsV1.on(knex);
}

export async function down(knex: Knex): Promise<any> {
  await loanLensOpsV1.off(knex);
  await knex.schema.dropTable("LoanVersion");
  await knex.schema.dropTable("Loan");
}
