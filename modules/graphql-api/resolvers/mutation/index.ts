import { ActionDispatchEventBusPort } from "atomic-object/cqrs/event-bus/port";
import { makePaymentToLoanEventType } from "domain-services/loan/events";
import { MutationResolvers } from "graphql-api/server-types.gen";

const makePayment: MutationResolvers.MakePaymentResolver = async (
  parent,
  args,
  ctx
) => {
  console.log("hi");

  // make payment on the loan
  await ctx.get(ActionDispatchEventBusPort).sendEvent({
    type: makePaymentToLoanEventType,
    payload: {
      loanId: args.loanId,
    },
  });

  // return the loan
};

export default { makePayment };
