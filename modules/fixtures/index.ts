import { Knex } from "modules/db";
import * as defaultScenario from "modules/fixtures/scenarios/default";

export async function seedScenarios(knex: Knex): Promise<null> {
  return await defaultScenario.seed(knex);
}
