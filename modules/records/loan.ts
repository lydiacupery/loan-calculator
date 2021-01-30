import { Flavor } from "modules/helpers";
import { loaderOf, Knex } from "modules/atomic-object/records";
import {
  EffectiveDateTimeRepositoryBase,
  RepositoryBase,
} from "modules/records/impl/base";
import * as DateTimeIso from "modules/core/date-time-iso";
import { LoanRecord } from "./impl/core";
import { buildRepositoryPortAndAdapter } from "./helpers";
import { LoanId } from "modules/core/loan/value";
import { EffectiveDateTimeDataPoolTableHelper } from "modules/atomic-object/records/effective-date-time";
import { TSTZRange } from "modules/db/tstzrange";

export interface UnsavedLoan {
  principal: number;
  name: string;
  startAt: DateTimeIso.Type;
  paymentsPerYear: number;
  paymentAmount: number;
  rate: number;
  extraPayment: number;
  effectiveDateTimeRange: TSTZRange;
}
export interface SavedLoan extends UnsavedLoan {
  id: LoanId;
}

const columnInfo = {
  principal: "header",
  startAt: "header",
  paymentsPerYear: "header",
  paymentAmount: "header",
  name: "header",
  rate: "version",
  extraPayment: "version",
  effectiveDateTimeRange: "version",
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
