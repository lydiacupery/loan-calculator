import { withContext } from "modules/__tests__/db-helpers";
import * as Blueprints from "modules/blueprints";
import * as DateIso from "modules/core/date-iso";
import * as DateTimeIso from "modules/core/date-time-iso";
import { LoanRecordRepositoryPort } from "../loan";
import { PaymentRecordRepositoryPort } from "../payment";
import { TSTZRange } from "modules/db/tstzrange";
import { CurrentEffectiveDateTimePort } from "modules/domain-services/current-effective-date-time";

describe("loan record", () => {
  it(
    "testing the update function",

    withContext(async (ctx, { universe }) => {
      const start = DateTimeIso.toIsoDateTime(new Date(2019, 0, 1));
      const startPlus5 = DateTimeIso.addDays(start, 5);
      const startPlus10 = DateTimeIso.addDays(start, 10);
      const startPlus8 = DateTimeIso.addDays(start, 8);
      const startPlus9 = DateTimeIso.addDays(start, 9);

      const loan = await universe.insert(Blueprints.loan, {
        rate: 0.04,
      });

      // insert v2
      const loanV2 = await ctx.get(LoanRecordRepositoryPort).update({
        ...loan,
        effectiveDateTimeRange: new TSTZRange({
          start: startPlus5,
          end: startPlus10,
        }),
        rate: 0.035,
        extraPayment: 1000,
      });

      // insert v3
      const loanV3 = await ctx.get(LoanRecordRepositoryPort).update({
        ...loan,
        effectiveDateTimeRange: new TSTZRange({
          start: startPlus8,
          end: startPlus9,
        }),
        rate: 0.05,
        extraPayment: 1000,
      });

      // // should still be .04 at start
      ctx.get(CurrentEffectiveDateTimePort)?.setCurrentEffectiveDateTime(start);
      const loanForStart = await ctx
        .get(LoanRecordRepositoryPort)
        .find.load({ id: loan.id });
      expect(loanForStart!.rate).toEqual(0.04);

      ctx
        .get(CurrentEffectiveDateTimePort)
        ?.setCurrentEffectiveDateTime(startPlus5);
      const loanForStartPlusFive = await ctx
        .get(LoanRecordRepositoryPort)
        .find.load({ id: loan.id });
      expect(loanForStartPlusFive!.rate).toEqual(0.035);

      ctx
        .get(CurrentEffectiveDateTimePort)
        ?.setCurrentEffectiveDateTime(startPlus8);
      const loanForStartPlusEight = await ctx
        .get(LoanRecordRepositoryPort)
        .find.load({ id: loan.id });
      expect(loanForStartPlusEight!.rate).toEqual(0.05);

      ctx
        .get(CurrentEffectiveDateTimePort)
        ?.setCurrentEffectiveDateTime(startPlus10);
      const loanForStartPlus10 = await ctx
        .get(LoanRecordRepositoryPort)
        .find.load({ id: loan.id });
      expect(loanForStartPlus10!.rate).toEqual(0.04);
    })
  );
});
