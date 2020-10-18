import * as Opaque from "atomic-object/opaque/dirty_tracking";
import * as Value from "./value";

const _O = Opaque.of<"Loan", Value.PaymentData>();

export type Type = SandboxEntity;
export type SandboxEntity = Opaque.OpaqueTypeOf<typeof _O>;
const opaque = Opaque.iso(_O);

// Accessors
// =============================================================================
export const id = Opaque.propLens(_O, "id").get;
export const amountForPrincipal = Opaque.propLens(_O, "amountForPrincipal").get;
export const amountForInterest = Opaque.propLens(_O, "amountForInterest").get;
export const paidAt = Opaque.propLens(_O, "paidAt").get;
export const loanId = Opaque.propLens(_O, "loanId").get;

// Derived values not stored in the database (were in resolvers)
// =============================================================================

// Build functions
// =============================================================================

export function buildPayment(value: Value.PaymentData) {
  return opaque.to(value);
}

export const update = Opaque.buildUpdater(buildPayment, opaque.from);
