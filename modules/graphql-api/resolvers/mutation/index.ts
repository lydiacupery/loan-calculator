import { ActionDispatchEventBusPort } from "modules/atomic-object/cqrs/event-bus/port";
import { LoanRepositoryPort } from "modules/domain-services/loan/repository";
import { makePaymentToLoanEventType } from "modules/domain-services/payment/event";
import { PaymentRepositoryPort } from "modules/domain-services/payment/repository";
import { MutationResolvers } from "modules/graphql-api/server-types.gen";
import { LoanRecordRepositoryPort } from "modules/records/loan";
import * as Payment from "modules/core/payment/entity";

const makePayment: MutationResolvers.MakePaymentResolver = async (
  parent,
  args,
  ctx
) => {
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
    throw new Error(`Could not find loan for id ${args.loanId}`);
  }
  return loan;
};

const deletePayment: MutationResolvers.DeletePaymentResolver = async (
  parent,
  args,
  ctx
) => {
  // lookup loan id
  const payment = await ctx
    .get(PaymentRepositoryPort)
    .find({ id: args.paymentId });

  if (!payment) {
    throw new Error(`Could not find payment for id ${args.paymentId}`);
  }

  await ctx.get(PaymentRepositoryPort).delete({ id: args.paymentId });
  console.log("deleted that paymetn!!");

  const loan = await ctx
    .get(LoanRepositoryPort)
    .find({ id: Payment.loanId(payment) });
  if (!loan) {
    throw new Error(`Could not find loan for id ${Payment.loanId(payment)}`);
  }
  return loan;
};

export default { makePayment, deletePayment };
