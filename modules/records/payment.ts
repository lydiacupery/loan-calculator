import { Flavor } from "helpers";
import { loaderOf, Knex } from "atomic-object/records";
import { RepositoryBase } from "records/impl/base";
import * as DateTimeIso from "core/date-time-iso";
import { LoanRecord, PaymentRecord } from "./impl/core";
import { buildRepositoryPortAndAdapter } from "./helpers";
import { LoanId } from "core/loan/value";
import { PaymentId } from "core/payment/value";

export interface UnsavedPayment {
  principalPayment: number;
  interestPayment: number;
  paidAt: DateTimeIso.Type;
  loanId: LoanId;
}
export interface SavedPayment extends UnsavedPayment {
  id: PaymentId;
}

export class PaymentRecordRepository extends RepositoryBase(PaymentRecord) {
  forLoan = loaderOf(this).allBelongingTo(LoanRecord, "loanId");
}

export const [
  PaymentRecordRepositoryPort,
  PaymentRecordRepositoryAdapter,
] = buildRepositoryPortAndAdapter(
  "PaymentRecordRepository",
  PaymentRecordRepository
);

export type PaymentRecordRepositoryPort = typeof PaymentRecordRepositoryPort;
