import { QueryResolvers } from "graphql-api/server-types.gen";
import * as faker from "faker";
import { keyBy } from "lodash-es";
import {
  LoanRecordRepositoryAdapter,
  LoanRecordRepositoryPort,
} from "records/loan";
import { LoanRepositoryPort } from "domain-services/loan/repository";
import { CurrentEffectiveDateTimePort } from "domain-services/current-effective-date-time";

const getLoans: QueryResolvers.GetLoansResolver = async (parent, args, ctx) => {
  console.log("---about to get the loans");
  const loans = await ctx.get(LoanRepositoryPort).all();
  console.log("got the loans....", { loans });
  return loans;
};

const getLoan: QueryResolvers.GetLoanResolver = async (parent, args, ctx) => {
  // set effective date time on ctx
  const effectiveDateTimePort = ctx.get(CurrentEffectiveDateTimePort);
  if (effectiveDateTimePort) {
    console.log("setting effective date time", args.effectiveDateTime);
    effectiveDateTimePort.setCurrentEffectiveDateTime(args.effectiveDateTime);
  }

  const loan = await ctx.get(LoanRepositoryPort).find({ id: args.loanId });
  return loan;
};

export default {
  getLoans,
  getLoan,
};
