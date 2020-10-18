import { LoanResolvers } from "graphql-api/server-types.gen";
import { SavedLoan } from "records/loan";
import { PaymentRecordRepositoryPort } from "records/payment";
import * as Loan from "core/loan/entity";

export type MinimalLoan = Loan.Type;

const completedPayments: LoanResolvers.CompletedPaymentsResolver = async (
  parent,
  args,
  ctx
) => {
  const res = await ctx
    .get(PaymentRecordRepositoryPort)
    .forLoan.load({ id: Loan.id(parent) });
  console.log({ res });
  return res;
};

const remainingPayments: LoanResolvers.CompletedPaymentsResolver = async (
  parent,
  args,
  ctx
) => {
  return [];
};

export default {
  completedPayments,
  remainingPayments,
};
