import { declareBlueprint, Universe } from "atomic-object/blueprints";
import * as Blueprint from "atomic-object/blueprints/blueprint";
import * as DateIso from "core/date-iso";
import { padStart } from "lodash-es";
import * as uuid from "uuid";
import * as DateTimeIso from "core/date-time-iso";
import { LoanRecord, PaymentRecord } from "records/impl/core";
import { LoanRecordRepositoryPort, SavedLoan, UnsavedLoan } from "records/loan";
import { v4 } from "uuid";
import { TSTZRange } from "db/tstzrange";
import { PaymentRecordRepositoryPort, SavedPayment } from "records/payment";

const padToTwoDigits = (n: number) => padStart(n.toString(), 2, "0");

let addDays = (d: Date, numDays: number) => {
  const dd = new Date(+d + numDays * 24 * 60 * 60 * 1000);
  return DateIso.toIsoDate(dd);
};

let plusMinus = (n: number) => Math.floor(Math.random() * (n * 2) - n);
let nextWeekPlusOrMinus = (n: number) => addDays(new Date(), 7 + plusMinus(n));

export const loan = declareBlueprint({
  entityType: LoanRecord,
  getRepo: ctx => ctx.get(LoanRecordRepositoryPort),
  buildBlueprint: universe =>
    Blueprint.design<SavedLoan>({
      startAt: DateTimeIso.now(),
      principal: 1000.0,
      paymentsPerYear: 12,
      paymentAmount: 100,
      rate: 0.03,
      id: v4(),
      extraPayment: 500.0,
      name: "test0loan",
      effectiveDateTimeRange: new TSTZRange({
        start: DateTimeIso.dateTimeIso`1970-01-01T00:00:00-00:00`,
        end: null,
      }),
    }),
});

export const payment = declareBlueprint({
  entityType: PaymentRecord,
  getRepo: ctx => ctx.get(PaymentRecordRepositoryPort),
  buildBlueprint: universe =>
    Blueprint.design<SavedPayment>({
      loanId: async () => (await universe.insert(loan)).id,
      principalPayment: 100,
      interestPayment: 10,
      paidAt: DateTimeIso.now(),
      id: v4(),
    }),
});

export { Universe };
