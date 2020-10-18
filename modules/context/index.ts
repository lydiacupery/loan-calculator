import {
  apolloClientAdapter,
  ApolloClientStatePort,
} from "atomic-object/apollo-client";
import { ApolloClientPort } from "atomic-object/apollo-client/ports";
import * as Hexagonal from "atomic-object/hexagonal";
import * as Recipe from "atomic-object/hexagonal/recipe";
import { KnexPort } from "atomic-object/records/knex-port";
import { ClientState } from "client/graphql/state-link";
import {
  LoanRepository,
  LoanRepositoryAdapter,
  LoanRepositoryPort,
} from "domain-services/loan/repository";
import {
  PaymentRepositoryAdapter,
  PaymentRepositoryPort,
} from "domain-services/payment/repository";
import { userSessionRepositoryAdapter } from "domain-services/user-session/adapter";
import { UserSessionRepositoryPort } from "domain-services/user-session/ports";
import { UserSession } from "domain-services/user-session/types";
import { GraphQLSchema } from "graphql";
import { executableSchema } from "graphql-api";
import {
  LoanRecordRepositoryAdapter,
  LoanRecordRepositoryPort,
} from "records/loan";
import {
  PaymentRecordRepositoryAdapter,
  PaymentRecordRepositoryPort,
} from "records/payment";
import * as db from "../db";
import { UserSessionPort } from "./ports";

export function buildLocalApollo(schema: GraphQLSchema = executableSchema) {
  return new Context().apolloClient;
}

export type ContextOpts = {
  db?: db.Knex;
  initialState?: ClientState;
  portDefaults?: Recipe.Recipeable<any>;
  userSession?: UserSession;
};

// Note: The order of these `add` calls matters. You must ensure that
// all dependencies are added above the Port that depends on them.
const ContextBase = Hexagonal.contextClass(c =>
  c
    .add(KnexPort, () => db.getConnection())
    .add(UserSessionPort, () => null)
    .add(UserSessionRepositoryPort, userSessionRepositoryAdapter)
    .add(ApolloClientStatePort, () => {})
    .add(ApolloClientPort, apolloClientAdapter)
    .add(LoanRecordRepositoryPort, LoanRecordRepositoryAdapter)
    .add(LoanRepositoryPort, LoanRepositoryAdapter)
    .add(PaymentRecordRepositoryPort, PaymentRecordRepositoryAdapter)
    .add(PaymentRepositoryPort, PaymentRepositoryAdapter)
);

/** The graphql context type for this app.  */
export class Context extends ContextBase {
  constructor(opts: ContextOpts = {}) {
    super({
      portDefaults:
        (opts.portDefaults as any) ||
        (x =>
          x
            .add(KnexPort, () => opts.db)
            .add(ApolloClientStatePort, () => opts.initialState || undefined)),
    });
  }

  get apolloClient() {
    return this.get(ApolloClientPort);
  }

  async destroy() {
    // currently a noop
  }
}

export class ApiContext extends Context {}
