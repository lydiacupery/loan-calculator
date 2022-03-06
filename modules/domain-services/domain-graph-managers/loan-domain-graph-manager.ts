import * as Hexagonal from "modules/atomic-object/hexagonal";
import { IsoDateTime } from "modules/client/graphql/types.gen";
import { LoanId } from "modules/core/loan/value";
import { LoanRepositoryPort } from "modules/domain-services/loan/repository";
import { PaymentRepositoryPort } from "modules/domain-services/payment/repository";
import * as Payment from "modules/core/payment/entity";
import * as Loan from "modules/core/loan/entity";
import * as R from "ramda";
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

  async getAllRemaningPaymentsForLoan(currentDateTime: DateTimeIso.Type) {
    const loans = await this.ctx.get(LoanRepositoryPort).all();
    const payments = await Promise.all(
      loans.map(
        async l =>
          await this.getRemainingPaymentsForLoan(Loan.id(l), currentDateTime)
      )
    );
    console.log("---got some payments", payments);
    return R.sortBy(p => p.date, R.flatten(payments));
  }

  async getRemainingPaymentsForLoan(
    loanId: LoanId,
    currentDateTime: DateTimeIso.Type
  ): Promise<
    {
      date: DateIso.Type;
      interestPayment: number;
      principalPayment: number;
      totalPayment: number;
      remainingPrincipal: number;
    }[]
  > {
    const loan = await this.ctx.get(LoanRepositoryPort).find({ id: loanId });
    if (!loan) {
      throw new Error(`could not find loan with id ${loanId}`);
    }

    const completedPayments = await this.ctx
      .get(PaymentRepositoryPort)
      .forLoan(loanId);
    const totalPrincipalPayments = completedPayments.reduce(
      (prev, curr) => prev + Payment.principalPayment(curr),
      0
    );

    const remainingPrincipal = Loan.principal(loan) - totalPrincipalPayments;
    console.log("remaining principal!!", remainingPrincipal);

    // for now, making the (probably incorrect) assumption that there are always 12 payments per year - on the 10th of each month

    // const currentDate = DateTimeIso.dateFromTimestamp(currentDateTime);
    // if no max for date, use date on loan
    const maxForDateForPayemnt = await this.ctx
      .get(PaymentRepositoryPort)
      .withMaxForDateForLoan(loanId);

    const maxForDateForLoan = maxForDateForPayemnt
      ? Payment.forDate(maxForDateForPayemnt)
      : DateIso.toIsoDate(Loan.startAt(loan));

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
      interestRate: Loan.rate(loan), // again, making the assumption of 12 payment periods
      loanId: Loan.id(loan),
    });
    return payments;
  }

  async generatePaymentsStartingFromDate(args: {
    totalPayment: number;
    paymentAmount: number;
    interestRate: number;
    startDate: DateIso.Type;
    loanId: LoanId;
  }) {
    const {
      totalPayment,
      paymentAmount,
      startDate,
      interestRate,
      loanId,
    } = args;
    console.log({ interestRate, paymentAmount, totalPayment });
    const monthlyInterestRate = interestRate / 12;
    const remainingPaymentCount = Math.ceil(
      Finance.numberOfPayments(
        monthlyInterestRate,
        -paymentAmount,
        totalPayment
      )
    );
    console.log({ remainingPaymentCount });

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
          interestRate: monthlyInterestRate,
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
          id: startDate.toString() + loanId,
          interestPayment: totalPayment * monthlyInterestRate,
          principalPayment: paymentAmount - totalPayment * monthlyInterestRate,
          totalPayment: paymentAmount,
          remainingPrincipal:
            totalPayment - (paymentAmount - totalPayment * monthlyInterestRate),
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
