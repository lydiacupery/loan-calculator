import { recordInfo } from "modules/atomic-object/records";
import { effectiveDateTimeRecordInfo } from "modules/atomic-object/records/effective-date-time";
import { SavedPayment, UnsavedPayment } from "modules/records/payment";
import { SavedLoan, UnsavedLoan } from "../loan";

export const LoanRecord = effectiveDateTimeRecordInfo<SavedLoan>(
  "LoanVersion",
  "Loan",
  "Loan_Lens"
);

export const PaymentRecord = recordInfo<UnsavedPayment, SavedPayment>(
  "Payment"
);
