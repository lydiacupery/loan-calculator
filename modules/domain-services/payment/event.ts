import { Actions, declareAction } from "modules/atomic-object/cqrs/actions";
import { AddPaymentToLoan } from "./add-payment-to-loan.gen";

import * as Hexagonal from "modules/atomic-object/hexagonal";
import { IsoDateTime } from "modules/client/graphql/types.gen";
import { LoanId } from "modules/core/loan/value";
import { LoanRepositoryPort } from "modules/domain-services/loan/repository";
import { PaymentRepositoryPort } from "modules/domain-services/payment/repository";
import * as Payment from "modules/core/payment/entity";
import * as Loan from "modules/core/loan/entity";
import * as DateTimeIso from "modules/core/date-time-iso";
import * as DateIso from "modules/core/date-iso";
import * as Finance from "modules/core/finance";
import { CurrentEffectiveDateTimePort } from "../current-effective-date-time";
import { v4 as uuidv4, v4 } from "uuid";
import { createTextChangeRange } from "typescript";

export const makePaymentToLoanEventType = "domain-event/make-payment-to-loan";

const makePaymentToLoan = declareAction({
  type: makePaymentToLoanEventType,
  schema: require("./add-payment-to-loan.schema.json"),
  handler: async (payload: AddPaymentToLoan, { context }) => {
    const loan = await context
      .get(LoanRepositoryPort)
      .find({ id: payload.loanId });
    if (!loan) {
      throw new Error(`could not find loan with id ${payload.loanId}`);
    }

    const completedPayments = await context.get(PaymentRepositoryPort).all();
    const totalPrincipalPayments = completedPayments.reduce(
      (prev, curr) => prev + Payment.principalPayment(curr),
      0
    );

    const remainingPrincipal = Loan.principal(loan) - totalPrincipalPayments;
    const {
      interestPayment,
      principalPayment,
    } = Finance.getInterestAndPrincipalPortionsOfPayment({
      interestRate: Loan.rate(loan) / Loan.paymentsPerYear(loan),
      payment: payload.paymentAmount,
      principal: remainingPrincipal,
    });

    // get the last payment, consolidate this logic (also exists in loan domain graph manager)

    const maxForDateForPayemnt = await context
      .get(PaymentRepositoryPort)
      .withMaxForDateForLoan(Loan.id(loan));

    const maxForDateForLoan = maxForDateForPayemnt
      ? Payment.forDate(maxForDateForPayemnt)
      : DateIso.toIsoDate(Loan.startAt(loan));

    const nextDate =
      DateIso.getMonthDayFromIsoDate(maxForDateForLoan) >= 10
        ? // next month the tenth
          DateIso.toDateWithMonthDay(
            DateIso.addMonths(maxForDateForLoan, 1),
            10
          )
        : // this month the tenth
          DateIso.toDateWithMonthDay(maxForDateForLoan, 10);

    const paymentToInsert = Payment.buildPayment({
      interestPayment,
      principalPayment,
      loanId: Loan.id(loan),
      paidAt:
        context
          .get(CurrentEffectiveDateTimePort)
          ?.getCurrentEffectiveDateTime() || DateTimeIso.now(), // todo, move this to mutation level
      id: v4(),
      forDate: nextDate,
    });

    await context.get(PaymentRepositoryPort).insert(paymentToInsert);
  },
});

export const ACTIONS = new Actions().with(makePaymentToLoan);
