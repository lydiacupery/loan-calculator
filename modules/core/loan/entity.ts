import * as Opaque from "atomic-object/opaque/dirty_tracking";
import * as Value from "./value";

const _O = Opaque.of<"Loan", Value.LoanData>();

export type Type = SandboxEntity;
export type SandboxEntity = Opaque.OpaqueTypeOf<typeof _O>;
const opaque = Opaque.iso(_O);

// Accessors
// =============================================================================
export const id = Opaque.propLens(_O, "id").get;
export const principal = Opaque.propLens(_O, "principal");
export const startAt = Opaque.propLens(_O, "startAt");
export const paymentsPerYear = Opaque.propLens(_O, "paymentsPerYear");
export const paymentAmount = Opaque.propLens(_O, "paymentAmount");

// Derived values not stored in the database (were in resolvers)
// =============================================================================

// Build functions
// =============================================================================

export function buildLoan(value: Value.LoanData) {
  return opaque.to(value);
}

export const update = Opaque.buildUpdater(buildLoan, opaque.from);
