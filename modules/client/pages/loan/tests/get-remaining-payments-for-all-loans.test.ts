import { withContext } from "modules/__tests__/db-helpers";
import * as Blueprints from "modules/blueprints";
import * as DateTiemIso from "modules/core/date-time-iso";
import * as DateTimeIso from "modules/core/date-time-iso";
import { GetLoan } from "modules/client/graphql/types.gen";
import { GetRemainingPaymentsForAllLoans } from "modules/client/graphql/types.gen";

describe("Get remaining payments for all loans", () => {
  it(
    "Gets remaining payments for 2 different loans",
    withContext(async (ctx, { universe }) => {
      console.log("hi....");
      // const loan1Start = DateTiemIso.toIsoDateTime(new Date(2019, 0, 1));
      // // loan
      // const loan1 = await universe.insert(Blueprints.loan, {
      //   paymentAmount: 100,
      //   paymentsPerYear: 12,
      //   principal: 1200,
      //   rate: 0.04,
      //   startAt: loan1Start,
      //   extraPayment: 0,
      // });

      // // completed payments, 2 payments completed
      // const firstPaymentDate = DateTiemIso.toIsoDateTime(new Date(2019, 1, 10));
      // await universe.insert(Blueprints.payment, {
      //   loanId: loan1.id,
      //   interestPayment: 4,
      //   principalPayment: 96,
      //   paidAt: firstPaymentDate,
      // });
      // const secondPaymentDate = DateTiemIso.toIsoDateTime(
      //   new Date(2019, 2, 10)
      // );
      // await universe.insert(Blueprints.payment, {
      //   loanId: loan1.id,
      //   interestPayment: 4,
      //   principalPayment: 96,
      //   paidAt: secondPaymentDate,
      // });

      // loan 2 start 2 months after
      const loan2Start = DateTiemIso.toIsoDateTime(new Date(2019, 2, 1));
      // loan
      const loan2 = await universe.insert(Blueprints.loan, {
        paymentAmount: 100,
        paymentsPerYear: 12,
        principal: 1200,
        rate: 0.04,
        startAt: loan2Start,
        extraPayment: 0,
      });

      // has no payments yet

      // it is March now, what are the remaining payments?

      const remainingPaymentsForAllLoansResult = await ctx.apolloClient.query<
        GetRemainingPaymentsForAllLoans.Query
      >({
        query: GetRemainingPaymentsForAllLoans.Document,
      });

      console.log(
        "remaining....",
        remainingPaymentsForAllLoansResult.data.getRemainingPaymentsForAllLoans
      );
    })
  );
});
