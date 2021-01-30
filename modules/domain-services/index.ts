import {
  Actions,
  ActionsObjectTypes,
  UnwrapActions,
} from "modules/atomic-object/cqrs/actions";
import { Dispatcher } from "modules/atomic-object/cqrs/dispatch";
import * as PaymentService from "modules/domain-services/payment/event";
import * as Hexagonal from "modules/atomic-object/hexagonal";
import { EventLogRecordRepositoryPort } from "modules/records/event-log";
import { LoanRepositoryPort } from "./loan/repository";

export const ALL_SERVICE_ACTIONS = new Actions().withAll(
  PaymentService.ACTIONS
);

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
