import * as Hexagonal from "atomic-object/hexagonal";
import { IsoDateTime } from "client/graphql/types.gen";
import { LoanId } from "core/loan/value";
import { LoanRepositoryPort } from "domain-services/loan/repository";
import { PaymentRepositoryPort } from "domain-services/payment/repository";

export type ServiceContext = Hexagonal.Context<
  LoanRepositoryPort | PaymentRepositoryPort
>;

export class LoanDomainGraphManager {
  constructor(private readonly ctx: ServiceContext) {}

  async getRemainingPaymentsForLoan(
    loanId: LoanId,
    effectiveDate: IsoDateTime
  ) {
    const loan = await this.ctx.get(LoanRepositoryPort).find({ id: loanId });
  }
}
