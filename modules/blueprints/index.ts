import { declareBlueprint, Universe } from "atomic-object/blueprints";
import * as Blueprint from "atomic-object/blueprints/blueprint";
import * as DateIso from "core/date-iso";
import { padStart } from "lodash-es";
import * as uuid from "uuid";
import * as DateTimeIso from "core/date-time-iso";
import { LoanRecord } from "records/impl/core";
import { LoanRecordRepositoryPort, UnsavedLoan } from "records/loan";

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
    Blueprint.design<UnsavedLoan>({
      startAt: DateTimeIso.now(),
      principal: 1000.0,
      paymentsPerYear: 12,
      paymentAmount: 100,
    }),
});

export { Universe };
