import { Flavor } from "helpers";
import { loaderOf, Knex } from "atomic-object/records";
import { RepositoryBase } from "records/impl/base";
import * as DateTimeIso from "core/date-time-iso";
import { LoanRecord } from "./impl/core";
import { buildRepositoryPortAndAdapter } from "./helpers";
import { LoanId } from "core/loan/value";

export interface UnsavedLoan {
  principal: number;
  startAt: DateTimeIso.Type;
  paymentsPerYear: number;
  paymentAmount: number;
}
export interface SavedLoan extends UnsavedLoan {
  id: LoanId;
}

export class LoanRecordRepository extends RepositoryBase(LoanRecord) {}

export const [
  LoanRecordRepositoryPort,
  LoanRecordRepositoryAdapter,
] = buildRepositoryPortAndAdapter("LoanRecordRepository", LoanRecordRepository);

export type LoanRecordRepositoryPort = typeof LoanRecordRepositoryPort;
