import { QueryResolvers } from "modules/graphql-api/server-types.gen";
import * as faker from "faker";
import { keyBy, sortBy } from "lodash-es";
import { LoanRepositoryPort } from "modules/domain-services/loan/repository";
import { CurrentEffectiveDateTimePort } from "modules/domain-services/current-effective-date-time";
import * as Loan from "modules/core/loan/entity";
import * as DateTimeIso from "modules/core/date-time-iso";
import { LoanDomainGraphManagerPort } from "modules/domain-services/domain-graph-managers/loan-domain-graph-manager";

const getLoans: QueryResolvers.GetLoansResolver = async (parent, args, ctx) => {
  const loans = await ctx.get(LoanRepositoryPort).all();
  return loans;
};

const getLoan: QueryResolvers.GetLoanResolver = async (parent, args, ctx) => {
  // set effective date time on ctx
  const effectiveDateTimePort = ctx.get(CurrentEffectiveDateTimePort);
  if (effectiveDateTimePort) {
    effectiveDateTimePort.setCurrentEffectiveDateTime(args.effectiveDateTime);
  }

  const loan = await ctx.get(LoanRepositoryPort).find({ id: args.loanId });
  return loan;
};

const getLoanVersions: QueryResolvers.GetLoanVersionsResolver = async (
  parent,
  args,
  ctx
) => {
  // want to be able to find all versions for a loan
  const loandWithVersionInfo = await ctx
    .get(LoanRepositoryPort)
    .versions({ id: args.loanId });
  console.log("got loan versions", loandWithVersionInfo);
  console.log(
    "verions",
    loandWithVersionInfo,
    "sorted...",
    sortBy(loandWithVersionInfo, "effectiveDateTimeRange")
  );
  return sortBy(
    loandWithVersionInfo,
    l => Loan.effectiveDateTimeRange(l).start
  );
};

const getRemainingPaymentsForAllLoans: QueryResolvers.GetRemainingPaymentsForAllLoansResolver = async (
  parent,
  args,
  ctx
) => {
  const effectiveDateTimePort = ctx.get(CurrentEffectiveDateTimePort);

  const effectiveDateTime = effectiveDateTimePort
    ? effectiveDateTimePort.getCurrentEffectiveDateTime()
    : DateTimeIso.now();
  const loanDomainGraphManager = await ctx.get(LoanDomainGraphManagerPort);
  const rems = await loanDomainGraphManager.getAllRemaningPaymentsForLoan(
    effectiveDateTime
  );
  console.log("---rems", rems);
  return rems;
};

export default {
  getLoans,
  getLoan,
  getLoanVersions,
  getRemainingPaymentsForAllLoans,
};
