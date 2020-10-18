import {
  DomainEntityType,
  IAbstractDomainRepository,
} from "domain-services/types";
import * as Payment from "core/payment/entity";
import { PaymentData, PaymentId } from "core/payment/value";
import * as Hexagonal from "atomic-object/hexagonal";
import { PaymentRecordRepositoryPort, SavedPayment } from "records/payment";
import { KnexPort } from "atomic-object/records/knex-port";
import { OpaqueTypeOf, Opaque } from "atomic-object/opaque/dirty_tracking";
import { Flavor } from "helpers";
import { Isomorphism } from "@atomic-object/lenses";
import * as Result from "atomic-object/result";
import { LoanId } from "core/loan/value";

type ServiceContext = Hexagonal.Context<KnexPort | PaymentRecordRepositoryPort>;

const domainToDat: Isomorphism<Payment.Type, SavedPayment> = {
  to(domainPayment) {
    const sandboxRecord: SavedPayment = {
      id: Payment.id(domainPayment),
      amountForInterest: Payment.amountForInterest(domainPayment),
      amountForPrincipal: Payment.amountForPrincipal(domainPayment),
      loanId: Payment.loanId(domainPayment),
      paidAt: Payment.paidAt(domainPayment),
    };

    return sandboxRecord;
  },

  from(dats) {
    return Result.toException(Payment.buildPayment(dats));
  },
};

export class PaymentRepository
  implements IAbstractDomainRepository<typeof PaymentDomainEntityInfo> {
  constructor(private readonly ctx: ServiceContext) {}
  insertMany(
    objects: OpaqueTypeOf<Opaque<"Loan", PaymentData>>[]
  ): Promise<OpaqueTypeOf<Opaque<"Loan", PaymentData>>[]> {
    throw new Error("Method not implemented.");
  }
  update(
    object: OpaqueTypeOf<Opaque<"Loan", PaymentData>>
  ): Promise<OpaqueTypeOf<Opaque<"Loan", PaymentData>>> {
    throw new Error("Method not implemented.");
  }
  findMany(
    ids: { id: Flavor<Flavor<string, "A UUID">, "Payment Id"> }[]
  ): Promise<(OpaqueTypeOf<Opaque<"Loan", PaymentData>> | null)[]> {
    throw new Error("Method not implemented.");
  }
  insert(
    unsavedRecord: OpaqueTypeOf<Opaque<"Loan", PaymentData>>
  ): Promise<OpaqueTypeOf<Opaque<"Loan", PaymentData>>> {
    throw new Error("Method not implemented.");
  }

  async forLoan(loanId: LoanId) {
    const paymentsForLoan = await this.ctx
      .get(PaymentRecordRepositoryPort)
      .forLoan.load({ id: loanId });
    return paymentsForLoan.map(payment => domainToDat.from(payment));
  }

  async all(): Promise<Payment.Type[]> {
    const dats = await this.ctx.get(PaymentRecordRepositoryPort).all();
    return Promise.all(dats.map(s => domainToDat.from(s)));
  }

  delete(
    ...ids: { id: Flavor<Flavor<string, "A UUID">, "Payment Id"> }[]
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async find(id: { id: PaymentId }): Promise<Payment.Type | null> {
    const payment = await this.ctx
      .get(PaymentRecordRepositoryPort)
      .find.load(id);
    if (!payment) {
      return null;
    }
    return domainToDat.from(payment);
  }
}

export const PaymentDomainEntityInfo: DomainEntityType<
  Payment.Type,
  { id: PaymentId }
> = {
  idOf: (payment: Payment.Type) => ({
    id: Payment.id(payment),
  }),
} as any;

export const PaymentRepositoryPort = Hexagonal.port<
  PaymentRepository,
  "PaymentRepository"
>("PaymentRepository");
export type PaymentRepositoryPort = typeof PaymentRepositoryPort;
export const PaymentRepositoryAdapter = Hexagonal.adapter({
  port: PaymentRepositoryPort,
  requires: [KnexPort, PaymentRecordRepositoryPort],
  build: ctx => new PaymentRepository(ctx),
});
