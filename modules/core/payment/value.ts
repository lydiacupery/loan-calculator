import { UUID } from "modules/core";
import * as DateTimeIso from "modules/core/date-time-iso";
import { LoanId } from "modules/core/loan/value";
import { Flavor } from "modules/helpers";

export type PaymentId = Flavor<UUID, "Payment Id">;

export interface PaymentData {
  id: PaymentId;
  principalPayment: number;
  interestPayment: number;
  paidAt: DateTimeIso.Type;
  loanId: LoanId;
}
