import { Flavor } from "helpers";
import { loaderOf, Knex } from "atomic-object/records";
import {
  EffectiveDateTimeRepositoryBase,
  RepositoryBase,
} from "records/impl/base";
import * as DateTimeIso from "core/date-time-iso";
import { LoanRecord } from "./impl/core";
import { buildRepositoryPortAndAdapter } from "./helpers";
import { LoanId } from "core/loan/value";
import { EffectiveDateTimeDataPoolTableHelper } from "atomic-object/records/effective-date-time";

export interface UnsavedLoan {
  principal: number;
  startAt: DateTimeIso.Type;
  paymentsPerYear: number;
  paymentAmount: number;
}
export interface SavedLoan extends UnsavedLoan {
  id: LoanId;
}

const columnInfo = {
  principal: "version",
  startAt: "version",
  paymentsPerYear: "version",
  paymentAmount: "version",
} as const;

export class LoanRecordRepository extends EffectiveDateTimeRepositoryBase(
  LoanRecord,
  columnInfo
) {}

export const [
  LoanRecordRepositoryPort,
  LoanRecordRepositoryAdapter,
] = buildRepositoryPortAndAdapter("LoanRecordRepository", LoanRecordRepository);

export type LoanRecordRepositoryPort = typeof LoanRecordRepositoryPort;
