import { withContext } from "modules/__tests__/db-helpers";
import * as Blueprints from "modules/blueprints";
import * as DateTiemIso from "modules/core/date-time-iso";
import * as DateTimeIso from "modules/core/date-time-iso";
import {
  GetLoan,
  MakePayment,
  UpdateInterestRateForLoanBetween,
} from "modules/client/graphql/types.gen";
import { CurrentEffectiveDateTimePort } from "modules/domain-services/current-effective-date-time";

describe("Update interest rate for loan between dates test", () => {
  it(
    "Update interest rate for loan between dates",
    withContext(async (ctx, { universe }) => {
      const start = DateTimeIso.toIsoDateTime(new Date(2019, 0, 1));
      const startPlus5 = DateTimeIso.addDays(start, 5);
      const startPlus10 = DateTimeIso.addDays(start, 10);
      const startPlus8 = DateTimeIso.addDays(start, 8);
      const startPlus9 = DateTimeIso.addDays(start, 9);

      const loan = await universe.insert(Blueprints.loan, {
        rate: 0.04,
      });

      const updatedLoan = await ctx.apolloClient.mutate<
        UpdateInterestRateForLoanBetween.Mutation
      >({
        mutation: UpdateInterestRateForLoanBetween.Document,
        variables: {
          loanId: loan.id,
          rate: 0.05,
          updateForRange: {
            start: startPlus5,
            end: startPlus10,
          },
        },
      });

      // when query in the ctx of start, should get old rate

      const loanResultForStart = await ctx.apolloClient.query<GetLoan.Query>({
        query: GetLoan.Document,
        variables: {
          loanId: loan.id,
          effectiveDateTime: start,
        },
      });
      console.log(
        "loan res for start",
        loanResultForStart.data.getLoan?.remainingPayments
      );
      expect(loanResultForStart?.data?.getLoan?.rate).toEqual(0.04);

      // when query in the ctx of start + 5, should get new rate
      const loanResultForStartPlus5 = await ctx.apolloClient.query<
        GetLoan.Query
      >({
        query: GetLoan.Document,
        variables: {
          loanId: loan.id,
          effectiveDateTime: startPlus5,
        },
      });
      console.log(
        "loan res for start + 5",
        loanResultForStartPlus5.data.getLoan?.remainingPayments
      );
      expect(loanResultForStartPlus5?.data?.getLoan?.rate).toEqual(0.05);
    })
  );
});
