import * as Hexagonal from "modules/atomic-object/hexagonal";
import * as Types from "./types";

export const ActionDispatchEventBusPort = Hexagonal.port<
  Types.ActionDispatchEventBus,
  "ActionDispatchEventBusPort"
>("ActionDispatchEventBusPort");
export type ActionDispatchEventBusPort = typeof ActionDispatchEventBusPort;
