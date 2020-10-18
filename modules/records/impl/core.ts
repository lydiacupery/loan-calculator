import { recordInfo } from "atomic-object/records";
import { SavedPayment, UnsavedPayment } from "records/payment";
import { SavedLoan, UnsavedLoan } from "../loan";

export const LoanRecord = recordInfo<UnsavedLoan, SavedLoan>("Loan");

export const PaymentRecord = recordInfo<UnsavedPayment, SavedPayment>(
  "Payment"
);
