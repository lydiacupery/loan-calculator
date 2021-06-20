import { ActionDispatchEventBusPort } from "modules/atomic-object/cqrs/event-bus/port";
import * as Result from "modules/atomic-object/result";
import * as Loan from "modules/core/loan/entity";
import * as Payment from "modules/core/payment/entity";
import { TSTZRange } from "modules/db/tstzrange";
import { LoanRepositoryPort } from "modules/domain-services/loan/repository";
import { makePaymentToLoanEventType } from "modules/domain-services/payment/event";
import { PaymentRepositoryPort } from "modules/domain-services/payment/repository";
import { MutationResolvers } from "modules/graphql-api/server-types.gen";

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
  const payment = await ctx
    .get(PaymentRepositoryPort)
    .find({ id: args.paymentId });

  if (!payment) {
    throw new Error(`Could not find payment for id ${args.paymentId}`);
  }

  await ctx.get(PaymentRepositoryPort).delete({ id: args.paymentId });

  const loan = await ctx
    .get(LoanRepositoryPort)
    .find({ id: Payment.loanId(payment) });
  if (!loan) {
    throw new Error(`Could not find loan for id ${Payment.loanId(payment)}`);
  }
  return loan;
};

const updateInterestRateForLoanBetween: MutationResolvers.UpdateInterestRateForLoanBetweenResolver = async (
  parent,
  args,
  ctx
) => {
  const loan = await ctx.get(LoanRepositoryPort).find({ id: args.loanId });
  if (!loan) {
    throw new Error(`Could not find loan for id ${args.loanId}`);
  }
  const updatedLoan = Loan.update(loan, l => {
    return {
      ...l,
      rate: args.rate,
      effectiveDateTimeRange: new TSTZRange({
        start: args.effectiveStarting,
        end: null,
      }),
    };
  });

  if (Result.isError(updatedLoan)) {
    throw new Error(
      `Error updating the rate on loan ${args.loanId} for effective date time ${args.effectiveStarting}`
    );
  }

  const loanUpdateResult = await ctx
    .get(LoanRepositoryPort)
    .update(updatedLoan);

  return loanUpdateResult;
};

export default { makePayment, deletePayment, updateInterestRateForLoanBetween };
