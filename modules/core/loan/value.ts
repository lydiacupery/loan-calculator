import { UUID } from "core";
import * as DateTimeIso from "core/date-time-iso";
import { Flavor } from "helpers";

export type LoanId = Flavor<UUID, "Loan Id">;

export interface LoanData {
  id: LoanId;
  principal: number;
  startAt: DateTimeIso.Type;
  paymentsPerYear: number;
  paymentAmount: number;
}
