import * as Hexagonal from "atomic-object/hexagonal";
import { Knex } from "db";

export const KnexPort = Hexagonal.port<Knex, "knex">("knex");
export type KnexPort = typeof KnexPort;
