import { keyBy, keys, pick, pickBy } from "lodash-es";
import * as DateTimeIso from "core/date-time-iso";
import { EntityType, ITableHelpers, SavedR, UnsavedR } from "./abstract";
import Knex from "knex";
import { Context } from "atomic-object/hexagonal/context";
import { KnexPort } from "./knex-port";
import { BaseHelpers } from ".";
import { UUID } from "core";
import { CurrentEffectiveDateTimePort } from "domain-services/current-effective-date-time";
import { batchDataLoaderFunction } from "./utils";
import stringify from "json-stable-stringify";
import { v4 } from "uuid";
import DataLoader from "dataloader";

type ReadOnlyDataLoader<TKey, TValue> = {
  load: (key: TKey) => Promise<TValue>;
  loadMany: (keys: TKey[]) => Promise<TValue[]>;
};

export interface EffectiveDateTimeKnexRecordInfo<
  Saved extends { id: string } = any
> extends EntityType<Saved, Saved, { id: string }> {
  versionTableName: string;
  tableName: string;
  lensViewName: string;
  idKeys: ["id"];
}

function castToEffectiveDateTimeRecordInfo(
  runtimeData: Omit<
    EffectiveDateTimeKnexRecordInfo,
    "_idKeys" | "_saved" | "_unsaved"
  >
): EffectiveDateTimeKnexRecordInfo {
  return runtimeData as EffectiveDateTimeKnexRecordInfo;
}

export function effectiveDateTimeRecordInfo<Saved extends { id: string } = any>(
  versionTableName: string,
  tableName: string,
  lensViewName: string
): EffectiveDateTimeKnexRecordInfo<Saved>;
// creates the record which the repo operates on
export function effectiveDateTimeRecordInfo(
  versionTableName: string,
  tableName: string,
  lensViewName: string
) {
  return castToEffectiveDateTimeRecordInfo({
    idOf: rec => pick(rec, "id"),
    versionTableName,
    tableName,
    lensViewName,
    idKeys: ["id"],
  });
}

export interface DateTimeHelpers<
  SavedDestType extends IdKeyT,
  IdKeyT extends { id: string }
> extends BaseHelpers<SavedDestType, IdKeyT> {
  findById: ReadOnlyDataLoader<IdKeyT[keyof IdKeyT], SavedDestType | null>;
}

type MinimalContext = Context<KnexPort | CurrentEffectiveDateTimePort>;
export abstract class EffectiveDateTimeDataPoolTableHelper<
  TContext extends MinimalContext,
  TSavedR extends Record<string, any> & { id: string }
> implements DateTimeHelpers<TSavedR, { id: string }> {
  abstract recordType: EffectiveDateTimeKnexRecordInfo<TSavedR>;

  public abstract db: Knex;
  protected abstract ctx: TContext;
  public abstract versionColumns: string[];
  public abstract headerColumns: string[];
  /** The `find` data loader takes an object that has at the id fields on it */
  find = new DataLoader<
    {
      id: string;
    },
    TSavedR | null
  >(
    async idRecords => {
      const rows: TSavedR[] = await this.table().whereIn(
        "id",
        idRecords.map(rec => rec.id)
      );
      const byId = keyBy(rows, "id");
      return idRecords.map(rec => byId[rec.id]);
    },
    {
      cacheKeyFn: input => input.id + this.getCurrentEffectiveDateTime(),
    }
  );

  table() {
    const effectiveDateTimeRange = this.getCurrentEffectiveDateTime();
    return this.db
      .table(
        this.db.raw(
          `:lensName:(:effectiveDateTimeRange::timestamptz) as :tableName:`,
          {
            lensName: this.recordType.lensViewName,
            effectiveDateTimeRange,
            tableName: this.recordType.tableName,
          }
        )
      )
      .clone();
  }

  getCurrentEffectiveDateTime() {
    const currentEffectiveDateTime = this.ctx.get(CurrentEffectiveDateTimePort);
    if (currentEffectiveDateTime) {
      return currentEffectiveDateTime.getCurrentEffectiveDateTime();
    } else {
      throw new Error(
        "Must have a current effective date time to use a data pool / effective date time repository"
      );
    }
  }

  versionTable() {
    return this.db.table(this.recordType.versionTableName);
  }

  headerTable() {
    return this.db.table(this.recordType.tableName).clone();
  }

  private insertHeader = new DataLoader<object, unknown>(
    batchDataLoaderFunction(100, async inputs => {
      await this.headerTable().insert(inputs);
      return inputs;
    }),
    {
      cache: false,
      cacheKeyFn: stringify,
    }
  );

  private insertVersion = new DataLoader<object, unknown>(
    batchDataLoaderFunction(100, async inputs => {
      await this.versionTable().insert(inputs);
      return inputs;
    }),
    {
      cache: false,
      cacheKeyFn: () => v4(),
    }
  );

  async insert(record: TSavedR): Promise<TSavedR> {
    const headerValues = pick(record, [...this.headerColumns]);

    const versionValues = pick(record, this.versionColumns);

    await this.insertHeader.load({ ...headerValues, id: record.id });
    await this.insertVersion.load({
      headerId: record.id,
      ...versionValues,
    });

    return record;
  }

  async all(): Promise<TSavedR[]> {
    const result = await this.table();
    return result;
  }

  findById: ReadOnlyDataLoader<UUID, TSavedR | null> = {
    load: async (id): Promise<TSavedR | null> => {
      return this.find.load({ id });
    },
    loadMany: async (inputs): Promise<(TSavedR | null)[]> => {
      return this.find.loadMany(inputs.map(id => ({ id })));
    },
  };
}

export interface EffectiveDateKnexRepositoryBase<
  TContext extends MinimalContext,
  TRecordInfo extends EffectiveDateTimeKnexRecordInfo
> extends EffectiveDateTimeDataPoolTableHelper<TContext, SavedR<TRecordInfo>> {
  _recordType: TRecordInfo;
}

// a function that takes context and record info and returns class repository implementing effective date knex repository base
export function EffectiveDateTimeUnboundRepositoryBase<
  TRecordInfo extends EffectiveDateTimeKnexRecordInfo,
  TContext extends MinimalContext = MinimalContext
>(
  aRecordType: TRecordInfo,
  columnInfo: {
    [key in Exclude<keyof SavedR<TRecordInfo>, "id">]: "version" | "header"
  }
) {
  return class Repository
    extends EffectiveDateTimeDataPoolTableHelper<TContext, SavedR<TRecordInfo>>
    implements EffectiveDateKnexRepositoryBase<TContext, TRecordInfo> {
    _recordType!: TRecordInfo;
    static readonly recordType = aRecordType;
    public readonly recordType = aRecordType;

    constructor(protected ctx: TContext) {
      super();
    }

    get db() {
      return this.ctx.get(KnexPort);
    }

    get versionColumns() {
      return keys(pickBy(columnInfo, x => x === "version"));
    }

    get headerColumns() {
      return keys(pickBy(columnInfo, x => x === "header"));
    }
  };
}
