import { buildLoan } from "core/loan/entity";
import { LoanRepositoryPort } from "domain-services/loan/repository";
import { buildContext } from "server/context";
import * as uuid from "uuid";
import * as DateTimeIso from "core/date-time-iso";
import {
  NodeScript,
  run,
  scriptFailure,
  scriptSuccess,
} from "helpers/scripting";
import { TSTZRange } from "db/tstzrange";

const main: NodeScript = async () => {
  const context = buildContext();

  try {
    await context.get(LoanRepositoryPort).insert(
      buildLoan({
        id: uuid(),
        paymentAmount: 1035.56,
        paymentsPerYear: 12,
        principal: 140000.0,
        rate: 0.03,
        startAt: DateTimeIso.toIsoDateTime(new Date(2018, 9, 10)),
        extraPayment: 1000.0,
        name: "Lydia's Loan",
        effectiveDateTimeRange: new TSTZRange({
          start: DateTimeIso.dateTimeIso`1970-01-01T00:00:00-00:00`,
          end: null,
        }),
      })
    );

    await context.destroy();
    return scriptSuccess();
  } catch (e) {
    await context.destroy();
    return scriptFailure({
      name: "insert-lydia-loan",
      baseError: e,
      message: "lydia loan insert failed 😭",
    });
  }
};

run(main);
