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
  name: string;
  // todo, eventually move these out to a versioned object
  extraPayment: number;
  rate: number;
  effectiveDateTimeRange: TSTZRange;
}

export interface VersionedLoanData {
  id: string;
  extraPayment: number;
  rate: number;
  effectiveDateTimeRange: TSTZRange;
}
