import { withContext } from "modules/__tests__/db-helpers";
import * as Blueprints from "modules/blueprints";
import * as DateTiemIso from "modules/core/date-time-iso";
import * as DateTimeIso from "modules/core/date-time-iso";
import { GetLoan, GetLoanVersions } from "modules/client/graphql/types.gen";
import { LoanRecordRepositoryPort } from "modules/records/loan";
import { TSTZRange } from "modules/db/tstzrange";
import { KnexPort } from "modules/atomic-object/records/knex-port";

describe("Get loan versions", () => {
  it(
    "Gets all versions for a loan",
    withContext(async (ctx, { universe }) => {
      const loanStart = DateTiemIso.toIsoDateTime(new Date(2019, 0, 1));
      const firstVersionEnd = DateTimeIso.addDays(loanStart, 10);

      // loan
      const loanV1 = await universe.insert(Blueprints.loan, {
        paymentAmount: 100,
        paymentsPerYear: 12,
        principal: 1200,
        rate: 0.04,
        startAt: loanStart,
        extraPayment: 0,
        effectiveDateTimeRange: new TSTZRange({
          start: loanStart,
          end: firstVersionEnd,
        }),
      });

      // insert v2
      const loanV2 = await ctx.get(LoanRecordRepositoryPort).update({
        ...loanV1,
        effectiveDateTimeRange: new TSTZRange({
          start: firstVersionEnd,
          end: null,
        }),
      });

      const results = await ctx
        .get(KnexPort)
        .select("*")
        .from("LoanVersion");

      console.log("versions????", results);

      const allVersions = await ctx
        .get(LoanRecordRepositoryPort)
        .findAllVersions.load({ id: loanV1.id });

      console.log("all vs?", allVersions);

      // are getting the correct versions

      // what are the loan versions?

      const loanVersionsResult = await ctx.apolloClient.query<
        GetLoanVersions.Query
      >({
        query: GetLoanVersions.Document,
        variables: {
          loanId: loanV1.id,
        },
      });

      // const loanVersions = loanVersionsResult.data.getLoanVersions;
      // if (!loanVersions) {
      //   throw new Error("could not fetch loan");
      // }
    })
  );
});
