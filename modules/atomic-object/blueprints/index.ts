import {
  EntityType,
  IAbstractInsertRepository,
  SavedR,
  UnsavedR,
} from "modules/atomic-object/records/abstract";
import { Context } from "context";
import * as Factory from "factory.ts"; /* eslint-disable-line */
import { DomainEntityType, ObjectType } from "modules/domain-servicestypes";
import * as Blueprint from "./blueprint";
import { BlueprintCanvas } from "./canvas";

type RequiredHooks<Unsaved, Saved> = {
  afterBuild: <T extends Unsaved>(
    universe: ProxyUniverse,
    record: T
  ) => Promise<T>;
  afterCreate: <T extends Saved>(
    universe: ProxyUniverse,
    record: T
  ) => Promise<void>;
};
type OptionalHooks<Unsaved, Saved> = Partial<RequiredHooks<Unsaved, Saved>>;

export type BlueprintInput<TRec extends EntityType, TInput = UnsavedR<TRec>> = {
  entityType: TRec;
  buildBlueprint: (
    universe: ProxyUniverse
  ) => Blueprint.Blueprint<UnsavedR<TRec>, TInput>;
  getRepo: (
    ctx: Context
  ) => IAbstractInsertRepository<UnsavedR<TRec>, SavedR<TRec>>;
} & OptionalHooks<UnsavedR<TRec>, SavedR<TRec>>;

export type BlueprintDomainInput<
  TRec extends DomainEntityType,
  TInput = ObjectType<TRec>
> = {
  entityType: TRec;
  buildBlueprint: (
    universe: ProxyUniverse
  ) => Blueprint.Blueprint<ObjectType<TRec>, TInput>;
  getRepo: (
    ctx: Context
  ) => IAbstractInsertRepository<ObjectType<TRec>, ObjectType<TRec>>;
} & OptionalHooks<ObjectType<TRec>, ObjectType<TRec>>;

export type RecordBlueprint<TRec extends EntityType = any, TInput = any> = {
  recordInfo: TRec;
  buildBlueprint: (
    universe: ProxyUniverse
  ) => Blueprint.Blueprint<UnsavedR<TRec>, TInput>;
  getRepo: (
    ctx: Context
  ) => IAbstractInsertRepository<UnsavedR<TRec>, SavedR<TRec>>;
} & RequiredHooks<UnsavedR<TRec>, SavedR<TRec>>;

export enum PickPolicy {
  InsertOrPick,
  Insert,
  Pick,
}

export function declareBlueprint<TRecInfo extends EntityType, TInput>(
  blueprint: BlueprintInput<TRecInfo, TInput>
): RecordBlueprint<TRecInfo, TInput> {
  return {
    afterBuild: (universe: ProxyUniverse, r: UnsavedR<TRecInfo>) => r,
    afterCreate: (universe: ProxyUniverse, r: SavedR<TRecInfo>) => r,
    ...blueprint,
  } as any;
}

export function declareDomainBlueprint<
  TRecInfo extends DomainEntityType,
  TInput
>(
  blueprint: BlueprintDomainInput<TRecInfo, TInput>
): RecordBlueprint<
  EntityType<
    ObjectType<TRecInfo>,
    ObjectType<TRecInfo>,
    Extract<ObjectType<TRecInfo>, TInput>
  >,
  TInput
> {
  return {
    afterBuild: (universe: ProxyUniverse, r: ObjectType<TRecInfo>) => r,
    afterCreate: (universe: ProxyUniverse, r: ObjectType<TRecInfo>) => r,
    ...blueprint,
  } as any;
}

export class PickPolicySpec {
  default: PickPolicy;
  specializations: Map<RecordBlueprint, PickPolicy> = new Map();

  constructor(
    defaultPolicy: PickPolicy,
    newSpecializations?: Map<RecordBlueprint, PickPolicy>
  ) {
    this.default = defaultPolicy;
    if (newSpecializations) {
      newSpecializations.forEach((v: PickPolicy, k) =>
        this.specializations.set(k, v)
      );
    }
  }

  specializePickPolicy(
    blueprint: RecordBlueprint,
    policy: PickPolicy
  ): PickPolicySpec {
    return new PickPolicySpec(
      this.default,
      new Map(this.specializations).set(blueprint, policy)
    );
  }
}

const PickPolicyDefault: PickPolicySpec = new PickPolicySpec(
  PickPolicy.InsertOrPick
);

type BlueprintSequence = {
  counter: number;
};
type BlueprintUniverseState = {
  sequences: Map<BlueprintInput<any>, BlueprintSequence>;
  policy: PickPolicySpec;
};

type BlueprintUniverseWithCanvasState = BlueprintUniverseState & {
  blueprints: Map<RecordBlueprint<any>, Blueprint.Blueprint<any>>;
  canvas: BlueprintCanvas;
};

export class ProxyUniverse {
  _state: BlueprintUniverseWithCanvasState;

  constructor(
    public readonly context: Context,
    public readonly state: BlueprintUniverseWithCanvasState
  ) {
    this._state = state;
  }

  canvas = async <T>(
    u: (c: ProxyUniverse, canvas: BlueprintCanvas) => Promise<T>,
    policy?: PickPolicySpec
  ): Promise<BlueprintCanvas<T>> => {
    const canvas = BlueprintCanvas.create(this._state.canvas);
    const proxy = new ProxyUniverse(this.context, {
      blueprints: new Map(),
      sequences: this._state.sequences,
      policy: policy || this._state.policy,
      canvas,
    });
    await u(proxy, canvas);
    return canvas;
  };

  specializePickPolicy<TRecInfo extends EntityType>(
    blueprint: RecordBlueprint<TRecInfo>,
    policy: PickPolicy
  ): PickPolicySpec {
    return this._state.policy.specializePickPolicy(blueprint, policy);
  }

  _lookupBlueprint<TRecInfo extends EntityType>(
    recordBlueprint: RecordBlueprint<TRecInfo>
  ): Blueprint.Blueprint<UnsavedR<TRecInfo>> {
    const existing = this.state.blueprints.get(recordBlueprint);
    if (existing) {
      return existing;
    } else {
      const blueprint = recordBlueprint.buildBlueprint(this);
      this.state.blueprints.set(recordBlueprint, blueprint);
      return blueprint;
    }
  }

  _lookupSequence<TRecInfo extends EntityType>(
    recordBlueprint: BlueprintInput<TRecInfo>
  ): BlueprintSequence {
    const existing = this.state.sequences.get(recordBlueprint);
    if (existing) {
      return existing;
    } else {
      const sequence = { counter: 0 };
      this.state.sequences.set(recordBlueprint, sequence);
      return sequence;
    }
  }

  _insert = async <TRecInfo extends EntityType, TInput>(
    recordBlueprint: RecordBlueprint<TRecInfo, TInput>,
    data?: Factory.RecPartial<TInput>
  ): Promise<SavedR<TRecInfo>> => {
    const blueprint = this._lookupBlueprint(recordBlueprint);
    let built = await blueprint.build(data);
    built = await recordBlueprint.afterBuild(this, built);

    const savedRecord: SavedR<TRecInfo> = await recordBlueprint
      .getRepo(this.context)
      .insert(built);

    await recordBlueprint.afterCreate(this, savedRecord);

    BlueprintCanvas.put(this._state.canvas, recordBlueprint, savedRecord);

    return savedRecord;
  };

  pick = <TRecInfo extends EntityType>(
    recordBlueprint: RecordBlueprint<TRecInfo>,
    data?: Factory.RecPartial<UnsavedR<TRecInfo>>
  ): Promise<SavedR<TRecInfo>> => {
    const result = BlueprintCanvas.pick(this._state.canvas, recordBlueprint)!;
    if (!result) {
      throw new Error(`Error: Could not find any records in canvas`);
    }
    return result;
  };

  insertOrPick = <TRecInfo extends EntityType>(
    recordBlueprint: RecordBlueprint<TRecInfo>,
    data?: Factory.RecPartial<UnsavedR<TRecInfo>>
  ): Promise<SavedR<TRecInfo>> => {
    const pick = BlueprintCanvas.pick(this._state.canvas, recordBlueprint);
    return pick || this._insert(recordBlueprint, data);
  };

  getPolicy = <TRecInfo extends EntityType>(
    recordBlueprint: RecordBlueprint<TRecInfo>
  ): PickPolicy => {
    return (
      this.state.policy.specializations.get(recordBlueprint) ||
      this._state.policy.default
    );
  };

  insert = async <TRecInfo extends EntityType, TInput>(
    recordBlueprint: RecordBlueprint<TRecInfo, TInput>,
    data?: Factory.RecPartial<TInput>,
    policy?: PickPolicy
  ): Promise<SavedR<TRecInfo>> => {
    let result: any = null;
    switch (policy || this.getPolicy(recordBlueprint)) {
      case PickPolicy.Insert:
        result = await this._insert(recordBlueprint, data);
        break;
      case PickPolicy.InsertOrPick:
        result = await this.insertOrPick(recordBlueprint, data);
        break;
      case PickPolicy.Pick:
        result = this.pick(recordBlueprint, data);
        break;
    }
    return result as SavedR<TRecInfo>;
  };
}

export class Universe {
  _state: BlueprintUniverseState;

  constructor(public readonly context: Context) {
    this._state = {
      sequences: new Map(),
      policy: PickPolicyDefault,
    };
  }

  insert = async <TRecInfo extends EntityType, TInput>(
    recordBlueprint: RecordBlueprint<TRecInfo, TInput>,
    data?: Factory.RecPartial<TInput>
  ): Promise<SavedR<TRecInfo>> => {
    const canvas = await this.canvas(async universe => {
      await universe.insert(recordBlueprint, data);
    }, this._state.policy);

    return BlueprintCanvas.last(canvas, recordBlueprint)!;
  };

  canvas = async <T>(
    u: (c: ProxyUniverse, canvas: BlueprintCanvas) => Promise<T>,
    policy?: PickPolicySpec
  ): Promise<BlueprintCanvas<T>> => {
    const canvas = BlueprintCanvas.create();
    const proxy = new ProxyUniverse(this.context, {
      blueprints: new Map(),
      sequences: this._state.sequences,
      policy: policy || PickPolicyDefault,
      canvas,
    });
    const results = await u(proxy, canvas);
    if (results) {
      return {
        ...canvas,
        results,
      };
    }
    return canvas;
  };
}
