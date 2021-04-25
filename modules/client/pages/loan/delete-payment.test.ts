import { withContext } from "modules/__tests__/db-helpers";
import * as Blueprints from "modules/blueprints";
import * as DateTiemIso from "modules/core/date-time-iso";
import * as DateTimeIso from "modules/core/date-time-iso";
import {
  DeletePayment,
  GetLoan,
  MakePayment,
} from "modules/client/graphql/types.gen";
import { update } from "lodash";

describe("Remove payment mutation", () => {
  it(
    "Remove payment for loan",
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

      const updatedLoan = await ctx.apolloClient.mutate<DeletePayment.Mutation>(
        {
          mutation: DeletePayment.Document,
          variables: {
            paymentId: existingPayment.id,
          },
        }
      );

      console.log("result...", updatedLoan.data?.deletePayment);
      expect(updatedLoan.data?.deletePayment?.completedPayments).toHaveLength(
        0
      );
    })
  );
});
