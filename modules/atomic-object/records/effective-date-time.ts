import DataLoader from "dataloader";
import { keyBy, keys, pick, pickBy } from "lodash-es";
import * as DateTimeIso from "core/date-time-iso";
import { EntityType, ITableHelpers, UnsavedR } from "./abstract";
import Knex from "knex";
import { Context } from "atomic-object/hexagonal/context";
import { KnexPort } from "./knex-port";

type ReadOnlyDataLoader<TKey, TValue> = {
  load: (key: TKey) => Promise<TValue>;
  loadMany: (keys: TKey[]) => Promise<TValue[]>;
};

export interface EffectiveDateTimeKnexRecordInfo<
  Unsaved = any,
  Saved extends Unsaved & { id: string } = any
> extends EntityType<Unsaved, Saved, { id: string }> {
  versionTableName: string;
  tableName: string;
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

export function effectiveDateTimeRecordInfo<
  Unsaved,
  Saved extends Unsaved & { id: string } = any
>(
  versionTableName: string,
  tableName: string
): EffectiveDateTimeKnexRecordInfo<Unsaved, Saved>;
// creates the record which the repo operates on
export function effectiveDateTimeRecordInfo(
  versionTableName: string,
  tableName: string
) {
  return castToEffectiveDateTimeRecordInfo({
    idOf: rec => rec.id,
    versionTableName,
    tableName,
    idKeys: ["id"],
  });
}

type MinimalContext = Context<KnexPort>;
export abstract class EffectiveDateTimeHelpers<
  TContext extends MinimalContext,
  TUnsavedR extends Record<string, any>
> implements ITableHelpers<TUnsavedR & { id: string }, { id: string }> {
  abstract recordType: EffectiveDateTimeKnexRecordInfo<
    TUnsavedR,
    TUnsavedR & { id: string }
  >;

  public abstract db: Knex;
  public abstract versionColumns: string[];
  public abstract headerColumns: string[];
  /** The `find` data loader takes an object that has at the id fields on it */
  find = new DataLoader<
    {
      dateTime: DateTimeIso.Type;
      headerId: string;
    },
    (TUnsavedR & { id: string; headerId: string }) | null
  >(
    async inputs => {
      const queryIn = inputs.map(_ => "?");
      const result = await this.db.raw<{
        rows: (TUnsavedR & {
          id: string;
          headerId: string;
          dateTime: DateTimeIso.Type;
        })[];
      }>(
        /*  sql */ `
        WITH arguments AS (
          SELECT
            UNNEST(ARRAY[
              ${queryIn}
            ]::uuid[]) AS "headerId",
            UNNEST(ARRAY[
              ${queryIn}
            ]::timestamptz[]) AS "dateTime"
          )
          SELECT
          A.*,
          arguments.*
          FROM
          arguments
          INNER JOIN LATERAL (
            SELECT
              *
            FROM
              ?? ht
              JOIN ?? vt ON vt. "headerId" = ht.id
            WHERE
              ht.id = arguments."headerId"
              AND ( (arguments. "dateTime" >= vt. "effectiveStart" AND arguments."dateTime" < vt. "effectiveEnd") OR 
              (arguments."dateTime" >= vt."effectiveStart" and vt."effectiveEnd" IS NULL))) AS A ON TRUE
        `,
        [
          ...inputs.map(i => i.headerId),
          ...inputs.map(i => i.dateTime),
          this.recordType.tableName,
          this.recordType.versionTableName,
        ]
      );

      const makeKey: (row: {
        headerId: string;
        dateTime: DateTimeIso.Type;
      }) => string = row =>
        `${row.headerId}-${DateTimeIso.toUTC(row.dateTime)}`;
      const lookup = keyBy(result.rows, makeKey);
      return inputs.map(i => lookup[makeKey(i)]);
    },
    {
      cacheKeyFn: key => key.id + key.dateTime,
    }
  );

  table() {
    return this.db.table(this.recordType.tableName);
  }

  versionTable() {
    return this.db.table(this.recordType.versionTableName);
  }

  async insert(
    unsaved: TUnsavedR
  ): Promise<TUnsavedR & { id: string; headerId: string }> {
    const headerValues = pick(unsaved, this.headerColumns);
    let headerRecord = (await this.table().where(headerValues))[0];

    if (!headerRecord) {
      headerRecord = (await this.table().insert(headerValues, [
        ...this.headerColumns,
        "id",
      ]))[0];
    }
    const versionValues = pick(unsaved, this.versionColumns);
    const versinRecordId = (await this.versionTable().insert(
      { headerId: headerRecord.id, ...versionValues },
      "id"
    ))[0];
    return { ...unsaved, headerId: headerRecord.id, id: versinRecordId };
  }

  // Find by ID isn't used for effective date records
  // If we find we want to use it for some reason, the `any` argument to ReadOnlyDataLoader should be updated
  findById: ReadOnlyDataLoader<any, (TUnsavedR & { id: string }) | null> = {
    load: (): Promise<(TUnsavedR & { id: string }) | null> => {
      throw new Error("use find instead");
    },
    loadMany: (): Promise<((TUnsavedR & { id: string }) | null)[]> => {
      throw new Error("use find instead");
    },
  };
}

export interface EffectiveDateKnexRepositoryBase<
  TContext extends MinimalContext,
  TRecordInfo extends EffectiveDateTimeKnexRecordInfo
> extends EffectiveDateTimeHelpers<TContext, UnsavedR<TRecordInfo>> {
  _recordType: TRecordInfo;
}

// a function that takes context and record info and returns class repository implementing effective date knex repository base
export function EffectiveDateTimeUnboundRepositoryBase<
  TRecordInfo extends EffectiveDateTimeKnexRecordInfo,
  TContext extends MinimalContext = MinimalContext
>(
  aRecordType: TRecordInfo,
  columnInfo: { [key in keyof UnsavedR<TRecordInfo>]: "version" | "header" }
) {
  return class Repository
    extends EffectiveDateTimeHelpers<TContext, UnsavedR<TRecordInfo>>
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
