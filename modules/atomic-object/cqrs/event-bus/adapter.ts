import * as Hexagonal from "atomic-object/hexagonal";
import { ActionDispatchEventBus } from ".";
import { ActionDispatchEventBusPort } from "./port";

export const MessageBusAdapter = Hexagonal.adapter({
  port: ActionDispatchEventBusPort,
  requires: [],
  build: () => new ActionDispatchEventBus(),
});
