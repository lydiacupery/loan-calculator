import { GlobalDispatch, GlobalActions } from "domain-services";

export type SubscribeFunction = (
  dispatcher: Pick<GlobalDispatch, "orThrow">
) => void;
export type SendEventFunction = (event: GlobalActions) => Promise<void>;

export type ActionDispatchEventBus = {
  subscribe: SubscribeFunction;
  sendEvent: SendEventFunction;
};
