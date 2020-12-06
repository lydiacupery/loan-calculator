import * as Hexagonal from "atomic-object/hexagonal";
import { IsoDateTime } from "client/graphql/types.gen";
import { LoanId } from "core/loan/value";
import { LoanRepositoryPort } from "domain-services/loan/repository";
import { PaymentRepositoryPort } from "domain-services/payment/repository";
import * as Payment from "core/payment/entity";
import * as Loan from "core/loan/entity";
import * as DateTimeIso from "core/date-time-iso";
import * as DateIso from "core/date-iso";

export type ServiceContext = Hexagonal.Context<
  LoanRepositoryPort | PaymentRepositoryPort
>;

export class LoanDomainGraphManager {
  constructor(private readonly ctx: ServiceContext) {}

  async getRemainingPaymentsForLoan(
    loanId: LoanId
    // effectiveDate: IsoDateTime
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

    // for now, making the (maybe incorrect) assumption that there are always 12 payments per year - on the 10th of each month

    const startDate =
      DateIso.getMonthDayFromIsoDate(DateIso.today()) > 10
        ? // next month the tenth
          DateIso.toDateWithMonthDay(DateIso.addMonths(DateIso.today(), 1), 10)
        : // this month the tenth
          DateIso.toDateWithMonthDay(DateIso.today(), 10);

    const payments = this.generatePaymentsStartingFromDate({
      totalPayment: remainingPrincipal,
      paymentAmount: Loan.paymentAmount(loan),
      startDate,
      interestRate: Loan.rate(loan),
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
    const remainingPaymentCount = Math.ceil(totalPayment / paymentAmount);

    // need to make 'count' number of payments starting on startDate

    // todo, should probably actually be looking up the loan interest rate separetely for each date
    return Array.from({ length: remainingPaymentCount }).map((_, i) => {
      const interestPayment = (totalPayment - i * paymentAmount) * interestRate;
      return {
        dateTime: DateIso.addMonths(startDate, i),
        interestPayment,
        principalPayment: paymentAmount - interestPayment,
        paymentAmount,
      };
    });
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
