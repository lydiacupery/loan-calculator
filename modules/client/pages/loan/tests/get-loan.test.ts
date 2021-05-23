import { withContext } from "modules/__tests__/db-helpers";
import * as Blueprints from "modules/blueprints";
import * as DateTiemIso from "modules/core/date-time-iso";
import * as DateTimeIso from "modules/core/date-time-iso";
import { GetLoan } from "modules/client/graphql/types.gen";

describe("Get loan query", () => {
  it(
    "Gets future payments for loan",
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
      await universe.insert(Blueprints.payment, {
        loanId: loan.id,
        interestPayment: 4,
        principalPayment: 96,
        paidAt: firstPaymentDate,
      });
      const secondPaymentDate = DateTiemIso.toIsoDateTime(
        new Date(2019, 2, 10)
      );
      await universe.insert(Blueprints.payment, {
        loanId: loan.id,
        interestPayment: 4,
        principalPayment: 96,
        paidAt: secondPaymentDate,
      });

      // what are the future payments?

      const loanResult = await ctx.apolloClient.query<GetLoan.Query>({
        query: GetLoan.Document,
        variables: {
          loanId: loan.id,
          effectiveDateTime: DateTimeIso.toIsoDateTime(new Date(2019, 3, 1)),
        },
      });

      const fetchedLoan = loanResult.data.getLoan;
      if (!fetchedLoan) {
        throw new Error("could not fetch loan");
      }
      expect(fetchedLoan.principal).toEqual(1200);
      expect(fetchedLoan.paymentsPerYear).toEqual(12);
      expect(fetchedLoan.paymentAmount).toEqual(100);
      expect(fetchedLoan.extraPayment).toEqual(0);

      // completed payments
      expect(fetchedLoan.completedPayments).toHaveLength(2);
      expect(fetchedLoan.completedPayments[0]).toEqual(
        expect.objectContaining({
          principalPayment: 96,
          interestPayment: 4,
          totalPayment: 100,
          date: firstPaymentDate,
          remainingPrincipal: 1104,
        })
      );
      expect(fetchedLoan.completedPayments[1]).toEqual(
        expect.objectContaining({
          principalPayment: 96,
          interestPayment: 4,
          totalPayment: 100,
          date: secondPaymentDate,
          remainingPrincipal: 1008,
        })
      );

      expect(fetchedLoan.remainingPayments).toHaveLength(11);

      // first payment
      const firstRemainingPayment = fetchedLoan.remainingPayments[0];
      expect(firstRemainingPayment.date).toEqual("2019-03-10");
      expect(firstRemainingPayment.interestPayment).toBeCloseTo(3.36);
      expect(firstRemainingPayment.principalPayment).toBeCloseTo(96.64);
      expect(firstRemainingPayment.totalPayment).toBeCloseTo(100.0);
      expect(firstRemainingPayment.remainingPrincipal).toBeCloseTo(911.36);

      // middle payment
      const sixthRemainingPayment = fetchedLoan.remainingPayments[5];
      expect(sixthRemainingPayment.date).toEqual("2019-08-10");
      expect(sixthRemainingPayment.interestPayment).toBeCloseTo(1.74);
      expect(sixthRemainingPayment.principalPayment).toBeCloseTo(98.26);
      expect(sixthRemainingPayment.totalPayment).toBeCloseTo(100.0);
      expect(sixthRemainingPayment.remainingPrincipal).toBeCloseTo(423.31);

      const lastPayment = fetchedLoan.remainingPayments[10];
      expect(lastPayment.date).toEqual("2020-01-10");
      expect(lastPayment.interestPayment).toBeCloseTo(0.09);
      expect(lastPayment.principalPayment).toBeCloseTo(26.97);
      expect(lastPayment.totalPayment).toBeCloseTo(100.0);
      expect(lastPayment.remainingPrincipal).toBeCloseTo(0);
    })
  );
});
