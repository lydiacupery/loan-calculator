import { GlobalDispatch } from "domain-services";
import { SendEventFunction, SubscribeFunction } from "./types";

export class ActionDispatchEventBus {
  private dispatcher: Pick<GlobalDispatch, "orThrow"> | undefined;

  subscribe: SubscribeFunction = dispatcher => {
    this.dispatcher = dispatcher;
  };

  sendEvent: SendEventFunction = async event => {
    if (!this.dispatcher) {
      throw new Error(
        "Cannot send event.  No dispatcher provided to message bus."
      );
    }

    await this.dispatcher.orThrow(event);
  };
}
