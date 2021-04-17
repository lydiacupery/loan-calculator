import { ActionDispatchEventBusPort } from "modules/atomic-object/cqrs/event-bus/port";
import { LoanRepositoryPort } from "modules/domain-services/loan/repository";
import { makePaymentToLoanEventType } from "modules/domain-services/payment/event";
import { MutationResolvers } from "modules/graphql-api/server-types.gen";
import { LoanRecordRepositoryPort } from "modules/records/loan";

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
      paymentAmount: args.paymentAmount,
    },
  });

  const loan = await ctx.get(LoanRepositoryPort).find({ id: args.loanId });

  if (!loan) {
    throw new Error("😱 no loan");
  }

  // do the mutation

  // return the loan
  return loan;
};

export default { makePayment };
