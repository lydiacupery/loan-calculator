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
import { length } from "../../../__mocks__/fileMock";
import { date } from "yup";

export type ServiceContext = Hexagonal.Context<
  LoanRepositoryPort | PaymentRepositoryPort
>;

export class LoanDomainGraphManager {
  constructor(private readonly ctx: ServiceContext) {}

  async getRemainingPaymentsForLoan(
    loanId: LoanId,
    currentDateTime: DateTimeIso.Type
  ) {
    const loan = await this.ctx.get(LoanRepositoryPort).find({ id: loanId });
    if (!loan) {
      throw new Error(`could not find loan with id ${loanId}`);
    }

    const completedPayments = await this.ctx.get(PaymentRepositoryPort).all();
    const totalPrincipalPayments = completedPayments.reduce(
      (prev, curr) => prev + Payment.principalPayment(curr),
      0
    );

    const remainingPrincipal = Loan.principal(loan) - totalPrincipalPayments;

    // for now, making the (probably incorrect) assumption that there are always 12 payments per year - on the 10th of each month

    // const currentDate = DateTimeIso.dateFromTimestamp(currentDateTime);
    // if no max for date, use date on loan
    const maxForDateForPayemnt = await this.ctx
      .get(PaymentRepositoryPort)
      .withMaxForDateForLoan(loanId);

    const maxForDateForLoan = maxForDateForPayemnt
      ? Payment.forDate(maxForDateForPayemnt)
      : DateIso.toIsoDate(Loan.startAt(loan));

    console.log("max date for loan", maxForDateForLoan);

    const startDate =
      DateIso.getMonthDayFromIsoDate(maxForDateForLoan) >= 10
        ? // next month the tenth
          DateIso.toDateWithMonthDay(
            DateIso.addMonths(maxForDateForLoan, 1),
            10
          )
        : // this month the tenth
          DateIso.toDateWithMonthDay(maxForDateForLoan, 10);

    const payments = this.generatePaymentsStartingFromDate({
      totalPayment: remainingPrincipal,
      paymentAmount: Loan.paymentAmount(loan) + Loan.extraPayment(loan),
      startDate,
      interestRate: Loan.rate(loan) / 12, // again, making the assumption of 12 payment periods
    });
    return payments;
  }

  async generatePaymentsStartingFromDate(args: {
    totalPayment: number;
    paymentAmount: number;
    interestRate: number;
    startDate: DateIso.Type;
  }) {
    const { totalPayment, paymentAmount, startDate, interestRate } = args;
    const remainingPaymentCount = Math.ceil(
      Finance.numberOfPayments(interestRate / 12, -paymentAmount, totalPayment)
    );

    console.log("remaining count", remainingPaymentCount);

    // need to make 'count' number of payments starting on startDate

    // todo, should probably actually be looking up the loan interest rate separetely for each date
    // return Array.from({ length: remainingPaymentCount }).map((_, i) => {
    //   const interestPayment = (totalPayment - i * paymentAmount) * interestRate;
    //   return {
    //     dateTime: DateIso.addMonths(startDate, i),
    //     interestPayment,
    //     principalPayment: paymentAmount - interestPayment,
    //     paymentAmount,
    //   };
    // });

    const reducedArray = Array.from({
      length: remainingPaymentCount - 1,
    }).reduce(
      (
        acc: {
          date: DateIso.Type;
          interestPayment: number;
          principalPayment: number;
          totalPayment: number;
          remainingPrincipal: number;
        }[],
        curr
      ) => {
        const prev = acc[acc.length - 1];
        const {
          interestPayment,
          principalPayment,
        } = Finance.getInterestAndPrincipalPortionsOfPayment({
          payment: paymentAmount,
          principal: prev.remainingPrincipal,
          interestRate,
        });
        const date = DateIso.addMonths(prev.date, 1);
        return [
          ...acc,
          {
            date,
            interestPayment,
            principalPayment,
            remainingPrincipal: prev.remainingPrincipal - principalPayment,
            totalPayment: paymentAmount,
            id: date.toString(),
          },
        ];
      },
      [
        {
          date: startDate,
          id: startDate.toString(),
          interestPayment: totalPayment * interestRate,
          principalPayment: paymentAmount - totalPayment * interestRate,
          totalPayment: paymentAmount,
          remainingPrincipal:
            totalPayment - (paymentAmount - totalPayment * interestRate),
        },
      ]
    );

    return reducedArray;
  }
}

export const LoanDomainGraphManagerPort = Hexagonal.port<
  LoanDomainGraphManager,
  "LoanDomainGraphManager"
>("LoanDomainGraphManager");

export type LoanDomainGraphManagerPort = typeof LoanDomainGraphManagerPort;

export const LoanDomainGraphManagerAdapter = Hexagonal.adapter({
  port: LoanDomainGraphManagerPort,
  requires: [LoanRepositoryPort, PaymentRepositoryPort],
  build: ctx => new LoanDomainGraphManager(ctx),
});
