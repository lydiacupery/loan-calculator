import * as Hexagonal from "atomic-object/hexagonal";
import { IsoDateTime } from "client/graphql/types.gen";
import { LoanId } from "core/loan/value";
import { LoanRepositoryPort } from "domain-services/loan/repository";
import { PaymentRepositoryPort } from "domain-services/payment/repository";
import * as Payment from "core/payment/entity";
import * as Loan from "core/loan/entity";
import * as DateTimeIso from "core/date-time-iso";
import * as DateIso from "core/date-iso";
import * as Finance from "core/finance";
import { length } from "../../../__mocks__/fileMock";

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

    const currentDate = DateTimeIso.dateFromTimestamp(currentDateTime);

    const startDate =
      DateIso.getMonthDayFromIsoDate(currentDate) > 10
        ? // next month the tenth
          DateIso.toDateWithMonthDay(DateIso.addMonths(currentDate, 1), 10)
        : // this month the tenth
          DateIso.toDateWithMonthDay(currentDate, 10);

    const payments = this.generatePaymentsStartingFromDate({
      totalPayment: remainingPrincipal,
      paymentAmount: Loan.paymentAmount(loan),
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
          dateTime: DateIso.Type;
          interestPayment: number;
          principalPayment: number;
          remainingPrincipal: number;
          paymentAmount: number;
        }[],
        curr
      ) => {
        const prev = acc[acc.length - 1];
        const interestPayment = prev.remainingPrincipal * interestRate;
        const principalPayment = Math.min(
          paymentAmount - interestPayment,
          prev.remainingPrincipal
        );
        return [
          ...acc,
          {
            dateTime: DateIso.addMonths(prev.dateTime, 1),
            interestPayment,
            principalPayment,
            remainingPrincipal: prev.remainingPrincipal - principalPayment,
            paymentAmount,
          },
        ];
      },
      [
        {
          dateTime: startDate,
          interestPayment: totalPayment * interestRate,
          principalPayment: paymentAmount - totalPayment * interestRate,
          paymentAmount,
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
