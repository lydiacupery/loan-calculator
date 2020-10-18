import * as Hexagonal from "atomic-object/hexagonal";
import { LoanRepositoryPort } from "domain-services/loan/repository";
import { PaymentRepositoryPort } from "domain-services/payment/repository";

export type ServiceContext = Hexagonal.Context<
  LoanRepositoryPort | PaymentRepositoryPort
>;

export class LoanDomainGraphManager {
  constructor(private readonly ctx: ServiceContext) {}
}
