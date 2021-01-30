import { ILens, Isomorphism, Lens } from "modules/atomic-object/lenses";
import * as Result from "modules/atomic-object/result";
import deepEqual from "fast-deep-equal";
import { produce } from "immer";

export class Opaque<Brand extends string = any, TClear = unknown> {
  _type!: TClear;
  _brand!: Brand;
}
export function of<Brand extends string, TClear>(): Opaque<Brand, TClear> {
  return new Opaque<Brand, TClear>();
}
const toOpaque = (x: any) => {
  if (x) {
    return produce(x, (draft: any) => {
      draft._dirtyFields = x._dirtyFields ? x._dirtyFields : [];
    });
  }
  return x;
};
const fromOpaque = (x: any) => {
  return x;
};
const toOpaque2 = (o: any, x: any) => {
  return toOpaque(x);
};
const fromOpaque2 = (o: any, x: any) => {
  return fromOpaque(x);
};

/** Convert to the opaque type from the clear type. */
export const to: <O extends Opaque>(
  o: O,
  value: ClearTypeOf<O>
) => OpaqueTypeOf<O> = toOpaque2;

/** Convert from opaque type to the clear type. */
export const from: <O extends Opaque>(
  o: O,
  value: OpaqueTypeOf<O>
) => ClearTypeOf<O> = fromOpaque2;

/** Since the iso is really just a type coersion, we can just use one global iso of identity functions. */
const theIso = { to: toOpaque, from: fromOpaque };

/** Returns an isomporphism from the underlying type to the opaque version. */
export const iso = <O extends Opaque>(
  o: O
): Isomorphism<ClearTypeOf<O>, OpaqueTypeOf<O>> => {
  return theIso as any;
};

/** A branded unknown reprsenting a kind of opaque type */
interface OpaqueType<B> {
  _opaque: B;
  _dirtyFields: (keyof B)[];
}
/** Get the opaque type from an Opaque */
export type OpaqueTypeOf<O extends Opaque> = OpaqueType<O["_brand"]>;
/** Get the clear type from an Opaque */
export type ClearTypeOf<O extends Opaque> = O["_type"] & {
  _dirtyFields?: (keyof O["_type"])[];
};

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
    set: (clear, v) =>
      produce(clear, draft => {
        const didChange = clear[prop] !== v;
        draft[prop] = v as any;
        if (didChange) {
          if (!draft._dirtyFields) {
            draft._dirtyFields = [];
          }
          if (!draft._dirtyFields.includes(prop as any)) {
            draft._dirtyFields.push(prop as any);
          }
        }
      }),
  });
}

export function isDirty<O extends Opaque>(o: OpaqueTypeOf<O>): boolean {
  return o._dirtyFields.length > 0;
}

export function getDirtyFields<O extends Opaque>(
  o: OpaqueTypeOf<O>
): (keyof ClearTypeOf<O>)[] {
  return o._dirtyFields;
}

export function buildUpdater<T, O>(
  toOpaqueArg: (args: T) => Result.Type<O>,
  fromOpaqueArg: (args: O) => T
) {
  return function update(
    opaqueObject: O,
    updater: (
      data: T & {
        _dirtyFields?: (keyof T)[];
      }
    ) => Result.Type<
      T & {
        _dirtyFields?: (keyof T)[];
      }
    >
  ): Result.Type<O> {
    const original = fromOpaqueArg(opaqueObject);
    const snapshotOfOriginal = { ...original };

    const updated = updater(original);
    if (Result.isError(updated)) {
      return updated;
    }
    const ignoredFields = ["lastModifiedBy", "lastModifiedAt"];
    const updatedWithDirtyState = produce(updated, draft => {
      for (const prop in snapshotOfOriginal) {
        if (ignoredFields.includes(prop)) {
          continue;
        }
        if (!deepEqual(snapshotOfOriginal[prop], updated[prop])) {
          if (draft._dirtyFields && !draft._dirtyFields.includes(prop as any)) {
            draft._dirtyFields.push(prop as any);
          }
        }
      }
    });
    return toOpaqueArg(updatedWithDirtyState);
  };
}
