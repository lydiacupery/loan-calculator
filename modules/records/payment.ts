import { Flavor } from "modules/helpers";
import { loaderOf, Knex } from "modules/atomic-object/records";
import { RepositoryBase } from "modules/records/impl/base";
import * as DateTimeIso from "modules/core/date-time-iso";
import { LoanRecord, PaymentRecord } from "./impl/core";
import { buildRepositoryPortAndAdapter } from "./helpers";
import { LoanId } from "modules/core/loan/value";
import { PaymentId } from "modules/core/payment/value";

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
