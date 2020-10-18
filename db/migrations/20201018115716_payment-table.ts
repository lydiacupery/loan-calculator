import * as Knex from "knex";
import { addForeignKeyColumn } from "../helpers";

export async function up(knex: Knex): Promise<any> {
  await knex.schema.createTable("Payment", async t => {
    t.uuid("id")
      .primary()
      .defaultTo(knex.raw("uuid_generate_v4()"));
    addForeignKeyColumn(t, "loanId", "Loan");
    t.string("paidAt").notNullable();
    t.decimal("principalPayment").notNullable();
    t.decimal("interestPayment").notNullable();
  });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.dropTable("Payment");
}
