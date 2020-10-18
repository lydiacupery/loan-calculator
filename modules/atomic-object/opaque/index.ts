import { ILens, Isomorphism, Lens } from "atomic-object/lenses";
import { identity } from "lodash-es";
import { produce } from "immer";

export class Opaque<Brand extends string = any, TClear = unknown> {
  _type!: TClear;
  _brand!: Brand;
}
export function of<Brand extends string, TClear>(): Opaque<Brand, TClear> {
  return new Opaque<Brand, TClear>();
}
const identity2 = (o: any, x: any) => x;

/** Convert to the opaque type from the clear type. */
export const to: <O extends Opaque>(
  o: O,
  value: ClearTypeOf<O>
) => OpaqueTypeOf<O> = identity2;

/** Convert from opaque type to the clear type. */
export const from: <O extends Opaque>(
  o: O,
  value: OpaqueTypeOf<O>
) => ClearTypeOf<O> = identity2;

/** Since the iso is really just a type coersion, we can just use one global iso of identity functions. */
const theIso = { to: identity, from: identity };

/** Returns an isomporphism from the underlying type to the opaque version. */
export const iso = <O extends Opaque>(
  o: O
): Isomorphism<ClearTypeOf<O>, OpaqueTypeOf<O>> => {
  return theIso as any;
};

/** A branded unknown reprsenting a kind of opaque type */
interface OpaqueType<B> {
  _opaque: B;
}
/** Get the opaque type from an Opaque */
export type OpaqueTypeOf<O extends Opaque> = OpaqueType<O["_brand"]>;
/** Get the clear type from an Opaque */
export type ClearTypeOf<O extends Opaque> = O["_type"];

// function unmapLens<T, U, V>(
//   iso: Isomorphism<T, U>,
//   lens: ILens<U, V>
// ): Lens<T, V> {
//   return Lens.of<T, V>({
//     get: opaque => lens.get(iso.to(opaque)),
//     set: (opaque, value) => iso.from(lens.set(iso.to(opaque), value)),
//   });
// }

/** Create a lens defined in terms of the clear type that operates on the opaque type */
export function lens<O extends Opaque, T>(
  o: O,
  spec: ILens<ClearTypeOf<O>, T>
): Lens<OpaqueTypeOf<O>, T> {
  return Lens.unmap(Isomorphism.flip(iso(o)), spec);
}

/** Create a lens that gets/sets a prop in the underlying clear type */
export function propLens<O extends Opaque, K extends keyof ClearTypeOf<O>>(
  o: O,
  prop: K
): Lens<OpaqueTypeOf<O>, ClearTypeOf<O>[K]> {
  return lens<O, ClearTypeOf<O>[K]>(o, {
    get: clear => clear[prop],
    // The produce below was added to appease TypeScript 3.7
    set: (clear, v) => produce(clear, draft => void (draft[prop] = v as any)),
  });
}
