import { withContext } from "modules/__tests__/db-helpers";
import * as Blueprints from "modules/blueprints";
import * as DateTiemIso from "modules/core/date-time-iso";
import * as DateTimeIso from "modules/core/date-time-iso";
import { GetLoan, MakePayment } from "modules/client/graphql/types.gen";

describe("Make payment mutation", () => {
  it(
    "Makes payment for loan",
    withContext(async (ctx, { universe }) => {
      const loanStart = DateTiemIso.toIsoDateTime(new Date(2019, 0, 1));

      // loan
      const loan = await universe.insert(Blueprints.loan, {
        paymentAmount: 100,
        paymentsPerYear: 12,
        principal: 1200,
        rate: 0.04,
        startAt: loanStart,
        extraPayment: 0,
      });

      // completed payments, 2 payments completed
      const firstPaymentDate = DateTiemIso.toIsoDateTime(new Date(2019, 1, 10));
      const existingPayment = await universe.insert(Blueprints.payment, {
        loanId: loan.id,
        interestPayment: 4,
        principalPayment: 96,
        paidAt: firstPaymentDate,
      });

      const updatedLoan = await ctx.apolloClient.mutate<MakePayment.Mutation>({
        mutation: MakePayment.Document,
        variables: {
          loanId: loan.id,
          effectiveDateTime: DateTimeIso.toIsoDateTime(new Date(2019, 2, 10)),
          paymentAmount: 200,
        },
      });
      console.log("res", updatedLoan.data?.makePayment?.id)

      expect(updatedLoan.data?.makePayment?.id).toBeDefined()
    })
  );
});
