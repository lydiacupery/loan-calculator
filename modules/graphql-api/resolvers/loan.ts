import { LoanResolvers } from "graphql-api/server-types.gen";
import { SavedLoan } from "records/loan";
import { PaymentRecordRepositoryPort } from "records/payment";
import * as Loan from "core/loan/entity";
import { LoanDomainGraphManagerPort } from "domain-services/domain-graph-managers/loan-domain-graph-manager";
import { CurrentEffectiveDateTimePort } from "domain-services/current-effective-date-time";
import * as DateTimeIso from "core/date-time-iso";
import { sortBy } from "lodash-es";

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
  return sortBy(
    res.map(res => ({
      principalPayment: res.principalPayment,
      interestPayment: res.interestPayment,
      dateTime: res.paidAt,
    })),
    "dateTime"
  );
};

const remainingPayments: LoanResolvers.CompletedPaymentsResolver = async (
  parent,
  args,
  ctx
) => {
  // return [];
  const effectiveDateTimePort = ctx.get(CurrentEffectiveDateTimePort);

  const effectiveDateTime = effectiveDateTimePort
    ? effectiveDateTimePort.getCurrentEffectiveDateTime()
    : DateTimeIso.now();
  console.log("effective date time...", effectiveDateTime);
  const loanDomainGraphManager = await ctx.get(LoanDomainGraphManagerPort);
  return loanDomainGraphManager.getRemainingPaymentsForLoan(
    Loan.id(parent),
    effectiveDateTime
  );
};

export default {
  completedPayments,
  remainingPayments,
};
