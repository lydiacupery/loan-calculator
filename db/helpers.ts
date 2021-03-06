import * as Knex from "knex";

type OnDelete =
  | "cascade"
  | "set null"
  | "set default"
  | "restrict"
  | "no action";

type ForeignKeyOpts = {
  /** default: false */
  nullable: boolean;
  foreignKey: string;
  /**
   * Ignored if unique is true.
   * default: true */
  index: boolean;
  /** default: false */
  unique: boolean;
  /** default cascade */
  onDelete?: OnDelete;
  idType: IDType;
};

type IDType = "uuid" | "integer";
/**
 * Create a new foreign key column and constraints
 * @param t the Knex table builder (e.g., from knex.schema.createTable)
 * @param column the name of the column on your table
 * @param foreignTable the foreign table
 * @param options additional options - foreign ID and constraints
 */
export function addForeignKeyColumn(
  t: Knex.CreateTableBuilder,
  column: string,
  foreignTable: string,
  options: Partial<ForeignKeyOpts> = {}
) {
  const opts: ForeignKeyOpts = {
    nullable: false,
    foreignKey: "id",
    index: true,
    unique: false,
    idType: "uuid",
    ...options,
  };
  const col = makeColumn(t, opts.idType, column);
  if (!opts.nullable) {
    col.notNullable();
  }
  t.foreign(column)
    .references(opts.foreignKey)
    .inTable(foreignTable)
    .onDelete(opts.onDelete || "cascade");
  if (opts.unique) {
    t.unique([column]);
  } else if (opts.index) {
    t.index([column]);
  }
}

const makeColumn = (
  table: Knex.CreateTableBuilder,
  idType: IDType,
  column: string
): Knex.ColumnBuilder => {
  switch (idType) {
    case "integer":
      return table.integer(column);
    case "uuid":
      return table.uuid(column);
  }
};
