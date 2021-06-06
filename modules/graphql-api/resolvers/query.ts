import { QueryResolvers } from "modules/graphql-api/server-types.gen";
import * as faker from "faker";
import { keyBy } from "lodash-es";
import { LoanRepositoryPort } from "modules/domain-services/loan/repository";
import { CurrentEffectiveDateTimePort } from "modules/domain-services/current-effective-date-time";

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
  return loandWithVersionInfo;
};

export default {
  getLoans,
  getLoan,
  getLoanVersions,
};
