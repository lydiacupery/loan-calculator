import {
  DomainEntityType,
  IAbstractDomainRepository,
} from "domain-services/types";
import * as Loan from "core/loan/entity";
import { LoanData, LoanId } from "core/loan/value";
import * as Hexagonal from "atomic-object/hexagonal";
import { LoanRecordRepositoryPort, SavedLoan } from "records/loan";
import { KnexPort } from "atomic-object/records/knex-port";
import { OpaqueTypeOf, Opaque } from "atomic-object/opaque/dirty_tracking";
import { Flavor } from "helpers";
import { Isomorphism } from "@atomic-object/lenses";
import * as Result from "atomic-object/result";

type ServiceContext = Hexagonal.Context<KnexPort | LoanRecordRepositoryPort>;

const domainToDat: Isomorphism<Loan.Type, SavedLoan> = {
  to(domainLoan) {
    const sandboxRecord: SavedLoan = {
      id: Loan.id(domainLoan),
      paymentAmount: Loan.paymentAmount(domainLoan),
      paymentsPerYear: Loan.paymentsPerYear(domainLoan),
      principal: Loan.principal(domainLoan),
      startAt: Loan.startAt(domainLoan),
      rate: Loan.rate(domainLoan),
    };

    return sandboxRecord;
  },

  from(dats) {
    return Result.toException(Loan.buildLoan(dats));
  },
};

export class LoanRepository
  implements IAbstractDomainRepository<typeof LoanDomainEntityInfo> {
  constructor(private readonly ctx: ServiceContext) {}

  async all(): Promise<Loan.Type[]> {
    const dats = await this.ctx.get(LoanRecordRepositoryPort).all();
    return Promise.all(dats.map(s => domainToDat.from(s)));
  }

  insertMany(
    objects: OpaqueTypeOf<Opaque<"Loan", LoanData>>[]
  ): Promise<OpaqueTypeOf<Opaque<"Loan", LoanData>>[]> {
    throw new Error("Method not implemented.");
  }
  update(
    object: OpaqueTypeOf<Opaque<"Loan", LoanData>>
  ): Promise<OpaqueTypeOf<Opaque<"Loan", LoanData>>> {
    throw new Error("Method not implemented.");
  }
  delete(
    ...ids: { id: Flavor<Flavor<string, "A UUID">, "Loan Id"> }[]
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async find(id: { id: LoanId }): Promise<Loan.Type | null> {
    const loan = await this.ctx.get(LoanRecordRepositoryPort).find.load(id);
    if (!loan) {
      return null;
    }
    return domainToDat.from(loan);
  }
  findMany(
    ids: { id: Flavor<Flavor<string, "A UUID">, "Loan Id"> }[]
  ): Promise<(OpaqueTypeOf<Opaque<"Loan", LoanData>> | null)[]> {
    throw new Error("Method not implemented.");
  }
  insert(
    unsavedRecord: OpaqueTypeOf<Opaque<"Loan", LoanData>>
  ): Promise<OpaqueTypeOf<Opaque<"Loan", LoanData>>> {
    throw new Error("Method not implemented.");
  }
}

export const LoanDomainEntityInfo: DomainEntityType<
  Loan.Type,
  { id: LoanId }
> = {
  idOf: (loan: Loan.Type) => ({
    id: Loan.id(loan),
  }),
} as any;

export const LoanRepositoryPort = Hexagonal.port<
  LoanRepository,
  "LoanRepository"
>("LoanRepository");
export type LoanRepositoryPort = typeof LoanRepositoryPort;
export const LoanRepositoryAdapter = Hexagonal.adapter({
  port: LoanRepositoryPort,
  requires: [KnexPort, LoanRecordRepositoryPort],
  build: ctx => new LoanRepository(ctx),
});
