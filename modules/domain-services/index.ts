import {
  Actions,
  ActionsObjectTypes,
  UnwrapActions,
} from "atomic-object/cqrs/actions";
import { Dispatcher } from "atomic-object/cqrs/dispatch";
import * as LoanService from "domain-services/loan/events";
import * as Hexagonal from "atomic-object/hexagonal";
import { EventLogRecordRepositoryPort } from "records/event-log";
import { LoanRepositoryPort } from "./loan/repository";

export const ALL_SERVICE_ACTIONS = new Actions().withAll(LoanService.ACTIONS);

export type GlobalActions = ActionsObjectTypes<typeof ALL_SERVICE_ACTIONS>;
export type GlobalDispatch = Dispatcher<
  UnwrapActions<typeof ALL_SERVICE_ACTIONS>
>;

export const EventDispatchPort = Hexagonal.port<
  GlobalDispatch,
  "event dispatcher"
>("event dispatcher");

export type EventDispatchPort = typeof EventDispatchPort;

export const eventDispatchAdapter = Hexagonal.adapter({
  port: EventDispatchPort,
  requires: [LoanRepositoryPort, EventLogRecordRepositoryPort],
  build: ctx => {
    return new Dispatcher(ctx, ALL_SERVICE_ACTIONS);
  },
});
