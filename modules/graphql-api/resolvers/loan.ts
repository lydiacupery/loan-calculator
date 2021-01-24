import { LoanResolvers } from "graphql-api/server-types.gen";
import { SavedLoan } from "records/loan";
import { PaymentRecordRepositoryPort } from "records/payment";
import * as Loan from "core/loan/entity";
import { LoanDomainGraphManagerPort } from "domain-services/domain-graph-managers/loan-domain-graph-manager";
import { CurrentEffectiveDateTimePort } from "domain-services/current-effective-date-time";
import * as DateTimeIso from "core/date-time-iso";
import { sortBy } from "lodash-es";
import { LoanRepositoryPort } from "domain-services/loan/repository";

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
    dateTime: DateTimeIso.Type;
    remainingPrincipal: number;
  };

  const sorted = sortBy(res, "paidAt");
  return sorted.reduce(
    (acc, curr, i) => {
      return [
        ...acc,
        {
          principalPayment: curr.principalPayment,
          interestPayment: curr.interestPayment,
          totalPayment: curr.principalPayment + curr.interestPayment,
          dateTime: curr.paidAt,
          remainingPrincipal: Math.max(
            (acc[i - 1]
              ? acc[i - 1].remainingPrincipal
              : Loan.principal(loan)) - curr.principalPayment,
            0
          ),
        },
      ];
    },
    [] as CompletedPayment[]
  );
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
