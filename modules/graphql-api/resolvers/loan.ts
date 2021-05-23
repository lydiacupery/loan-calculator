import { LoanResolvers } from "modules/graphql-api/server-types.gen";
import { SavedLoan } from "modules/records/loan";
import { PaymentRecordRepositoryPort } from "modules/records/payment";
import * as Loan from "modules/core/loan/entity";
import { LoanDomainGraphManagerPort } from "modules/domain-services/domain-graph-managers/loan-domain-graph-manager";
import { CurrentEffectiveDateTimePort } from "modules/domain-services/current-effective-date-time";
import * as DateTimeIso from "modules/core/date-time-iso";
import { sortBy } from "lodash-es";
import { LoanRepositoryPort } from "modules/domain-services/loan/repository";
import * as DateIso from "modules/core/date-iso";

export type MinimalLoan = Loan.Type;

const completedPayments: LoanResolvers.CompletedPaymentsResolver = async (
  parent,
  args,
  ctx
) => {
  const loan = await ctx.get(LoanRepositoryPort).find({ id: Loan.id(parent) });
  if (!loan) {
    throw new Error(
      `could not find loan corresponding to id ${Loan.id(parent)}`
    );
  }
  const res = await ctx
    .get(PaymentRecordRepositoryPort)
    .forLoan.load({ id: Loan.id(parent) });

  type CompletedPayment = {
    principalPayment: number;
    interestPayment: number;
    date: DateIso.Type;
    remainingPrincipal: number;
  };

  const sorted = sortBy(res, "paidAt");
  return sorted.reduce((acc, curr, i) => {
    return [
      ...acc,
      {
        id: curr.id,
        principalPayment: curr.principalPayment,
        interestPayment: curr.interestPayment,
        totalPayment: curr.principalPayment + curr.interestPayment,
        date: DateIso.toIsoDate(curr.paidAt),
        remainingPrincipal: Math.max(
          (acc[i - 1] ? acc[i - 1].remainingPrincipal : Loan.principal(loan)) -
            curr.principalPayment,
          0
        ),
      },
    ];
  }, [] as CompletedPayment[]);
};

const remainingPayments: LoanResolvers.CompletedPaymentsResolver = async (
  parent,
  args,
  ctx
) => {
  const effectiveDateTimePort = ctx.get(CurrentEffectiveDateTimePort);

  const effectiveDateTime = effectiveDateTimePort
    ? effectiveDateTimePort.getCurrentEffectiveDateTime()
    : DateTimeIso.now();
  const loanDomainGraphManager = await ctx.get(LoanDomainGraphManagerPort);
  return loanDomainGraphManager.getRemainingPaymentsForLoan(
    Loan.id(parent),
    effectiveDateTime
  );
};

const effectiveDateTimeRange: LoanResolvers.EffectiveDateTimeRangeResolver = async (
  parent,
  args,
  ctx
) => {
  return {
    start: Loan.effectiveDateTimeRange(parent).start,
    end: Loan.effectiveDateTimeRange(parent).end,
  };
};

const rate: LoanResolvers.RateResolver = async (parent, args, ctx) => {
  return Loan.rate(parent);
};

export default {
  completedPayments,
  remainingPayments,
  rate,
  effectiveDateTimeRange,
};
