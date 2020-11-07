import { UUID } from "core";
import * as DateTimeIso from "core/date-time-iso";
import { LoanId } from "core/loan/value";
import { Flavor } from "helpers";

export type PaymentId = Flavor<UUID, "Payment Id">;

export interface PaymentData {
  id: PaymentId;
  principalPayment: number;
  interestPayment: number;
  paidAt: DateTimeIso.Type;
  loanId: LoanId;
}
