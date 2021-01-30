import * as LoanEventTypes from "domain-services/loan/events";
import { ActionDispatchEventBus } from "..";

describe("Action Dispatch Event Bus", () => {
  it("forwards messages to the dispatcher that it's subscribed to", async () => {
    const eventBus = new ActionDispatchEventBus();
    const mockOrThrow = jest.fn();

    eventBus.subscribe({
      orThrow: mockOrThrow,
    });
    await eventBus.sendEvent({
      type: LoanEventTypes.makePaymentToLoanEvent,
      payload: { loanId: "asdf" },
    });

    expect(mockOrThrow).toBeCalledTimes(1);
    expect(mockOrThrow).toBeCalledWith({
      type: LoanEventTypes.makePaymentToLoanEvent,
      payload: { loanId: "asdf" },
    });
  });

  it("throws an error if a message is sent before subscribing to a dispatcher", async () => {
    const eventBus = new ActionDispatchEventBus();

    await expect(
      eventBus.sendEvent({
        type: LoanEventTypes.makePaymentToLoanEvent,
        payload: { loanId: "asdf" },
      })
    ).rejects.toThrow();
  });
});
