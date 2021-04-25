import {
  DomainEntityType,
  IAbstractDomainRepository,
} from "modules/domain-services/types";
import * as Payment from "modules/core/payment/entity";
import { PaymentData, PaymentId } from "modules/core/payment/value";
import * as Hexagonal from "modules/atomic-object/hexagonal";
import {
  PaymentRecordRepositoryPort,
  SavedPayment,
} from "modules/records/payment";
import { KnexPort } from "modules/atomic-object/records/knex-port";
import {
  OpaqueTypeOf,
  Opaque,
} from "modules/atomic-object/opaque/dirty_tracking";
import { Flavor } from "modules/helpers";
import { Isomorphism } from "@atomic-object/lenses";
import * as Result from "modules/atomic-object/result";
import { LoanId } from "modules/core/loan/value";
import { PaymentRecord } from "modules/records/impl/core";

type ServiceContext = Hexagonal.Context<KnexPort | PaymentRecordRepositoryPort>;

const domainToDat: Isomorphism<Payment.Type, SavedPayment> = {
  to(domainPayment) {
    const sandboxRecord: SavedPayment = {
      id: Payment.id(domainPayment),
      interestPayment: Payment.interestPayment(domainPayment),
      principalPayment: Payment.principalPayment(domainPayment),
      loanId: Payment.loanId(domainPayment),
      paidAt: Payment.paidAt(domainPayment),
      forDate: Payment.forDate(domainPayment),
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
  async insertMany(unsavedRecords: Payment.Type[]): Promise<Payment.Type[]> {
    await this.ctx
      .get(PaymentRecordRepositoryPort)
      .insertMany(unsavedRecords.map(domainToDat.to));
    return unsavedRecords;
  }
  update(
    object: OpaqueTypeOf<Opaque<"Payment", PaymentData>>
  ): Promise<OpaqueTypeOf<Opaque<"Payment", PaymentData>>> {
    throw new Error("Method not implemented.");
  }
  findMany(
    ids: { id: Flavor<Flavor<string, "A UUID">, "Payment Id"> }[]
  ): Promise<(OpaqueTypeOf<Opaque<"Payment", PaymentData>> | null)[]> {
    throw new Error("Method not implemented.");
  }
  async insert(
    unsavedRecord: OpaqueTypeOf<Opaque<"Payment", PaymentData>>
  ): Promise<OpaqueTypeOf<Opaque<"Payment", PaymentData>>> {
    const inserted = await this.ctx
      .get(PaymentRecordRepositoryPort)
      .insert(domainToDat.to(unsavedRecord));
    return domainToDat.from(inserted);
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

  async withMaxForDateForLoan(loanId: LoanId) {
    const paymentForLoan = await this.ctx
      .get(PaymentRecordRepositoryPort)
      .withMaxForDateForLoan.load(loanId);
    return paymentForLoan ? domainToDat.from(paymentForLoan) : null;
  }

  async delete(
    ...ids: { id: Flavor<Flavor<string, "A UUID">, "Payment Id"> }[]
  ): Promise<void> {
    // todo, could be better grouped up by taking an array of ids to delete at the record level
    await Promise.all(
      ids.map(id => this.ctx.get(PaymentRecordRepositoryPort).delete(id))
    );
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
