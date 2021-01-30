import { ClientState, DEFAULTS } from "modules/client/graphql/state-link";
import * as db from "modules/db";
import { Context } from "../context";

import uuid from "uuid";
import { getRedisConnection } from "modules/db/redis";
import * as Blueprints from "modules/atomic-object/blueprints";
import { UserSession } from "modules/domain-services/user-session/types";

export function withTransactionalConnection(
  fn: (knex: db.Knex) => Promise<any>
) {
  return async () => {
    const knex = db.getConnection();
    try {
      await knex.transaction(async trx => {
        // await trx.raw("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
        db._setConnection(trx);
        // await truncateAll(context);
        await fn(trx);
        throw new Error("abort transaction");
      });
    } catch (e) {
      if (e.message !== "abort transaction") {
        throw e;
      }
    } finally {
      db._setConnection(knex);
    }
  };
}

export function createUserSession(ops?: Partial<UserSession>) {
  const user: UserSession = {
    firstName: "Tupaca",
    lastName: "Shakur",
    provider: "local",
  };
  return user;
}

type ContextFn = (
  context: Context,
  extra: { universe: Blueprints.Universe; user: UserSession | null }
) => void | any;
type WithContextArgs = {
  user?: UserSession | null;
  initialState?: Partial<ClientState>;
  run: ContextFn;
};

export function withContext(
  fnOrObj: WithContextArgs | ContextFn
): () => Promise<any> {
  return withTransactionalConnection(async db => {
    const args: WithContextArgs =
      typeof fnOrObj === "function" ? { run: fnOrObj } : fnOrObj;

    const initialState = args.initialState;
    const fullInitialState = Object.assign({}, DEFAULTS, initialState);

    const redisPrefix = `test:${uuid()}:`;

    let context: Context;
    const userSession = args.user || createUserSession();
    context = new Context({
      db,
      initialState: fullInitialState,
      userSession,
    });

    const universe = new Blueprints.Universe(context);

    try {
      await args.run(context, { universe, user: userSession });
    } finally {
      await context.destroy();
      const redis = getRedisConnection();
      const keys = await redis.keys(`${redisPrefix}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  });
}
