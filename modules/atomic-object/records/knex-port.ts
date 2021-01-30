import * as Hexagonal from "modules/atomic-object/hexagonal";
import { Knex } from "modules/db";

export const KnexPort = Hexagonal.port<Knex, "knex">("knex");
export type KnexPort = typeof KnexPort;
