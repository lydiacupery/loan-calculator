import * as Opaque from "modules/atomic-object/opaque/dirty_tracking";
import * as Value from "./value";

const _O = Opaque.of<"Payment", Value.PaymentData>();

export type Type = SandboxEntity;
export type SandboxEntity = Opaque.OpaqueTypeOf<typeof _O>;
const opaque = Opaque.iso(_O);

// Accessors
// =============================================================================
export const id = Opaque.propLens(_O, "id").get;
export const principalPayment = Opaque.propLens(_O, "principalPayment").get;
export const interestPayment = Opaque.propLens(_O, "interestPayment").get;
export const paidAt = Opaque.propLens(_O, "paidAt").get;
export const loanId = Opaque.propLens(_O, "loanId").get;
export const forDate = Opaque.propLens(_O, "forDate").get;

// Derived values not stored in the database (were in resolvers)
// =============================================================================

// Build functions
// =============================================================================

export function buildPayment(value: Value.PaymentData) {
  return opaque.to(value);
}

export const update = Opaque.buildUpdater(buildPayment, opaque.from);
