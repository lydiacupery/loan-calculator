import { Actions, declareAction } from "modules/atomic-object/cqrs/actions";
import { AddPaymentToLoan } from "./add-payment-to-loan.gen";

export const makePaymentToLoanEventType = "domain-event/make-payment-to-loan";

const makePaymentToLoan = declareAction({
  type: makePaymentToLoanEventType,
  schema: require("./add-payment-to-loan.schema.json"),
  handler: async (payload: AddPaymentToLoan, { context }) => {
    console.log("what?????? actually working!");
    // add the payment to the loan
    // return loan?
  },
});

export const ACTIONS = new Actions().with(makePaymentToLoan);
