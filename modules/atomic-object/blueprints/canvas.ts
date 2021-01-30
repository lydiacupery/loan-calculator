import { RecordBlueprint } from "modules/atomic-object/blueprints";
import { EntityType, SavedR } from "modules/atomic-object/records/abstract";
import { first as firstElement, last as lastElement, sample } from "lodash-es";

export type BlueprintCanvas<T = any> = {
  results: T;
  parent: BlueprintCanvas | null;
  currentSet: Map<RecordBlueprint<any>, any[]>;
};

export namespace BlueprintCanvas {
  export function create(parent?: BlueprintCanvas): BlueprintCanvas {
    return {
      results: undefined,
      parent: parent || null,
      currentSet: new Map(),
    };
  }

  export function getAll<TRecInfo extends EntityType>(
    bcs: BlueprintCanvas,
    k: RecordBlueprint<TRecInfo>
  ): SavedR<TRecInfo>[] {
    return bcs.currentSet.get(k) || [];
  }

  export function first<TRecInfo extends EntityType>(
    bcs: BlueprintCanvas,
    k: RecordBlueprint<TRecInfo>
  ): SavedR<TRecInfo> | null {
    return firstElement(getAll(bcs, k)) || null;
  }

  export function last<TRecInfo extends EntityType>(
    bcs: BlueprintCanvas,
    k: RecordBlueprint<TRecInfo>
  ): SavedR<TRecInfo> | null {
    return lastElement(getAll(bcs, k)) || null;
  }

  export function put<TRecInfo extends EntityType>(
    bcs: BlueprintCanvas,
    k: RecordBlueprint<TRecInfo>,
    v: SavedR<TRecInfo>
  ) {
    if (!bcs.currentSet.has(k)) {
      bcs.currentSet.set(k, []);
    }
    const collection = bcs.currentSet.get(k)!;
    collection.push(v);

    if (bcs.parent) {
      put(bcs.parent, k, v);
    }
  }

  export function pick<TRecInfo extends EntityType>(
    bcs: BlueprintCanvas,
    k: RecordBlueprint<TRecInfo>
  ): SavedR<TRecInfo> {
    const rec = sample(getAll(bcs, k));
    return rec;
  }
}
