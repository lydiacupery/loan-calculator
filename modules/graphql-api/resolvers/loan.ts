import { LoanResolvers } from "graphql-api/server-types.gen";
import { SavedLoan } from "records/loan";
import { PaymentRecordRepositoryPort } from "records/payment";
import * as Loan from "core/loan/entity";
import { LoanDomainGraphManagerPort } from "domain-services/domain-graph-managers/loan-domain-graph-manager";

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
  // return [];
  const loanDomainGraphManager = await ctx.get(LoanDomainGraphManagerPort);
  return loanDomainGraphManager.getRemainingPaymentsForLoan(Loan.id(parent));
};

export default {
  completedPayments,
  remainingPayments,
};
