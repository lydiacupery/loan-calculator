import { withContext } from "modules/__tests__/db-helpers";
import * as Blueprints from "modules/blueprints";
import * as DateIso from "modules/core/date-iso";
import { LoanRecordRepositoryPort } from "../loan";
import { PaymentRecordRepositoryPort } from "../payment";

describe("payment record", () => {
  it(
    "withMaxForDateForLoan",

    withContext(async (ctx, { universe }) => {
      const loan1 = await universe.insert(Blueprints.loan);
      const loan2 = await universe.insert(Blueprints.loan);

      const loan1Payment1 = await universe.insert(Blueprints.payment, {
        loanId: loan1.id,
        forDate: DateIso.dateIso`2020-01-01`,
      });

      // 2 records with different max dates for this loan
      const loan2Payment1 = await universe.insert(Blueprints.payment, {
        loanId: loan2.id,
        forDate: DateIso.dateIso`2020-01-01`,
      });
      const loan2Payment2 = await universe.insert(Blueprints.payment, {
        loanId: loan2.id,
        forDate: DateIso.dateIso`2020-01-02`,
      });

      const mostRecentForDatePaymentForLoan2 = await ctx
        .get(PaymentRecordRepositoryPort)
        .withMaxForDateForLoan.load(loan2.id);

        expect(mostRecentForDatePaymentForLoan2?.id).toEqual(loan2Payment2.id)
    })
  );
});
