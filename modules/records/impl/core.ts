import { recordInfo } from "atomic-object/records";
import { effectiveDateTimeRecordInfo } from "atomic-object/records/effective-date-time";
import { SavedPayment, UnsavedPayment } from "records/payment";
import { SavedLoan, UnsavedLoan } from "../loan";

export const LoanRecord = effectiveDateTimeRecordInfo<SavedLoan>(
  "LoanVersion",
  "Loan",
  "Loan_DPLens"
);

export const PaymentRecord = recordInfo<UnsavedPayment, SavedPayment>(
  "Payment"
);
