import {
  apolloClientAdapter,
  ApolloClientStatePort,
} from "modules/atomic-object/apollo-client";
import { ApolloClientPort } from "modules/atomic-object/apollo-client/ports";
import * as Hexagonal from "modules/atomic-object/hexagonal";
import { PortType } from "modules/atomic-object/hexagonal/ports";
import * as Recipe from "modules/atomic-object/hexagonal/recipe";
import { KnexPort } from "modules/atomic-object/records/knex-port";
import { ClientState } from "modules/client/graphql/state-link";
import {
  CurrentEffectiveDateTime,
  CurrentEffectiveDateTimePort,
} from "modules/domain-services/current-effective-date-time";
import {
  LoanRepository,
  LoanRepositoryAdapter,
  LoanRepositoryPort,
} from "modules/domain-services/loan/repository";
import {
  PaymentRepositoryAdapter,
  PaymentRepositoryPort,
} from "modules/domain-services/payment/repository";
import { userSessionRepositoryAdapter } from "modules/domain-services/user-session/adapter";
import { UserSessionRepositoryPort } from "modules/domain-services/user-session/ports";
import { UserSession } from "modules/domain-services/user-session/types";
import { GraphQLSchema } from "graphql";
import { executableSchema } from "modules/graphql-api";
import {
  LoanRecordRepositoryAdapter,
  LoanRecordRepositoryPort,
} from "modules/records/loan";
import {
  PaymentRecordRepositoryAdapter,
  PaymentRecordRepositoryPort,
} from "modules/records/payment";
import * as db from "../db";
import { UserSessionPort } from "./ports";
import * as DateTimeIso from "modules/core/date-time-iso";
import {
  LoanDomainGraphManagerAdapter,
  LoanDomainGraphManagerPort,
} from "modules/domain-services/domain-graph-managers/loan-domain-graph-manager";
import { ActionDispatchEventBusPort } from "modules/atomic-object/cqrs/event-bus/port";
import { MessageBusAdapter } from "modules/atomic-object/cqrs/event-bus/adapter";
import {
  eventDispatchAdapter,
  EventDispatchPort,
} from "modules/domain-services";
import {
  EventLogRecordRepositoryAdapter,
  EventLogRecordRepositoryPort,
} from "modules/records/event-log";

export function buildLocalApollo(schema: GraphQLSchema = executableSchema) {
  return new Context().apolloClient;
}

export type ContextOpts = {
  db?: db.Knex;
  initialState?: ClientState;
  portDefaults?: Recipe.Recipeable<any>;
  userSession?: UserSession;
  currentEffectiveDateTime?: PortType<CurrentEffectiveDateTimePort>;
};

// Note: The order of these `add` calls matters. You must ensure that
// all dependencies are added above the Port that depends on them.
const ContextBase = Hexagonal.contextClass(c =>
  c
    .add(KnexPort, () => db.getConnection())
    .add(UserSessionPort, () => null)
    .add(ActionDispatchEventBusPort, MessageBusAdapter)
    .add(UserSessionRepositoryPort, userSessionRepositoryAdapter)
    .add(ApolloClientStatePort, () => {})
    .add(ApolloClientPort, apolloClientAdapter)
    .add(CurrentEffectiveDateTimePort, () => null)
    .add(LoanRecordRepositoryPort, LoanRecordRepositoryAdapter)
    .add(LoanRepositoryPort, LoanRepositoryAdapter)
    .add(PaymentRecordRepositoryPort, PaymentRecordRepositoryAdapter)
    .add(PaymentRepositoryPort, PaymentRepositoryAdapter)
    .add(LoanDomainGraphManagerPort, LoanDomainGraphManagerAdapter)
    .add(EventLogRecordRepositoryPort, EventLogRecordRepositoryAdapter)
    .add(EventDispatchPort, eventDispatchAdapter)
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
            .add(ApolloClientStatePort, () => opts.initialState || undefined)
            .add(
              CurrentEffectiveDateTimePort,
              () => new CurrentEffectiveDateTime(DateTimeIso.now()) || null
            )),
    });
    this.get(ActionDispatchEventBusPort).subscribe(this.get(EventDispatchPort));
  }

  get apolloClient() {
    return this.get(ApolloClientPort);
  }

  async destroy() {
    // currently a noop
  }
}

export class ApiContext extends Context {}
