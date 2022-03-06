import { Flavor } from "modules/helpers";
import { loaderOf, Knex } from "modules/atomic-object/records";
import { RepositoryBase } from "modules/records/impl/base";
import * as DateTimeIso from "modules/core/date-time-iso";
import * as DateIso from "modules/core/date-iso";
import { LoanRecord, PaymentRecord } from "./impl/core";
import { buildRepositoryPortAndAdapter } from "./helpers";
import { LoanId } from "modules/core/loan/value";
import { PaymentId } from "modules/core/payment/value";
import DataLoader from "dataloader";
import { keyBy } from "lodash-es";

export interface UnsavedPayment {
  principalPayment: number;
  interestPayment: number;
  paidAt: DateTimeIso.Type;
  forDate: DateIso.Type;
  loanId: LoanId;
}
export interface SavedPayment extends UnsavedPayment {
  id: PaymentId;
}

export class PaymentRecordRepository extends RepositoryBase(PaymentRecord) {
  forLoan = loaderOf(this).allBelongingTo(LoanRecord, "loanId");

  withMaxForDateForLoan = new DataLoader<LoanId, SavedPayment | null>(
    async loanIds => {
      const result = await this.table()
        .whereIn("loanId", loanIds)
        .joinRaw(
          `join (SELECT "loanId" as "maxLoanId", MAX("forDate") as "maxForDate" FROM "Payment" GROUP BY "loanId") max_loan on max_loan."maxLoanId" = "loanId" AND max_loan."maxForDate" = "forDate"`
        );

      const loanIdTable = keyBy(result, "loanId");
      return loanIds.map(loanId => loanIdTable[loanId] || null);
    }
  );
}

export const [
  PaymentRecordRepositoryPort,
  PaymentRecordRepositoryAdapter,
] = buildRepositoryPortAndAdapter(
  "PaymentRecordRepository",
  PaymentRecordRepository
);

export type PaymentRecordRepositoryPort = typeof PaymentRecordRepositoryPort;
