import { UUID } from "modules/core";
import * as DateTimeIso from "modules/core/date-time-iso";
import { TSTZRange } from "modules/db/tstzrange";
import { Flavor } from "modules/helpers";

export type LoanId = Flavor<UUID, "Loan Id">;

export interface LoanData {
  id: LoanId;
  principal: number;
  startAt: DateTimeIso.Type;
  paymentsPerYear: number;
  paymentAmount: number;
  rate: number;
  extraPayment: number;
  name: string;
  effectiveDateTimeRange: TSTZRange;
}
