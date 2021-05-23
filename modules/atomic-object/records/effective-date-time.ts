import { groupBy, keyBy, keys, omit, pick, pickBy } from "lodash-es";
import * as DateTimeIso from "modules/core/date-time-iso";
import { EntityType, ITableHelpers, SavedR, UnsavedR } from "./abstract";
import Knex, { QueryBuilder } from "knex";
import { Context } from "modules/atomic-object/hexagonal/context";
import { KnexPort } from "./knex-port";
import { BaseHelpers } from ".";
import { UUID } from "modules/core";
import { CurrentEffectiveDateTimePort } from "modules/domain-services/current-effective-date-time";
import { batchDataLoaderFunction } from "./utils";
import stringify from "json-stable-stringify";
import { v4 } from "uuid";
import DataLoader from "dataloader";
import { TSTZRange } from "modules/db/tstzrange";
import * as _ from "lodash-es";

type ReadOnlyDataLoader<TKey, TValue> = {
  load: (key: TKey) => Promise<TValue>;
  loadMany: (keys: TKey[]) => Promise<TValue[]>;
};

let columnTypes: { [k: string]: { [col: string]: string } } | undefined;
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

  findAllVersions = new DataLoader<{ id: string }, TSavedR[]>(
    async idRecords => {
      const baseRecords = await this.find.loadMany(idRecords);
      const versionedRecords: TSavedR[] = await this.db
        .table(this.recordType.versionTableName)
        .whereIn(
          "headerId",
          idRecords.map(rec => rec.id)
        );
      const groupedVersioned = groupBy(versionedRecords, "headerId");
      const keyedBase = keyBy(baseRecords, "id");
      return idRecords.map(rec => {
        return groupedVersioned[rec.id].map(versioned => {
          return {
            ...keyedBase[rec.id],
            ...versioned,
          };
        });
      });
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
      const resultsPre = await this.db.select("*").from("LoanVersion");
      await this.versionTable().insert(inputs);
      const results = await this.db.select("*").from("LoanVersion");
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

  prepToUpdateOnMaster(record: TSavedR): { effectiveDateTimeRange: TSTZRange } {
    return {
      ...omit(record, "dataPoolId"),
      effectiveDateTimeRange: record.effectiveDateTimeRange,
    };
  }

  async loadPostgresColumnTypesIfNecessary() {
    if (!columnTypes) {
      const r = await this.db.raw(
        `select table_name, column_name, data_type from information_schema.columns where table_schema = 'public';`
      );
      if (!columnTypes) {
        columnTypes = {};
        for (const row of r.rows) {
          const fields = columnTypes[row.table_name] || {};
          fields[row.column_name] = row.data_type;
          columnTypes[row.table_name] = fields;
        }
      }
    }
  }

  updateDataLoaderFunction = (
    tableType: "header" | "version" | "overlay"
  ) => async (args: Array<{ input: Pick<TSavedR, string>; id: UUID }>) => {
    await this.loadPostgresColumnTypesIfNecessary();

    if (!columnTypes) {
      throw new Error("Update failure - Unable to load column types!!");
    }

    const idColumn = "id";
    const tableName =
      tableType === "header"
        ? this.recordType.tableName
        : this.recordType.versionTableName;

    const fieldsToUpdate = _.uniq(
      _.flatten(_.map(args, arg => _.keys(arg.input)))
    );
    const idsToUpdate = _.uniq(args.map(x => x.id));

    const setStatementsWithBindings = _.map(fieldsToUpdate, fieldToUpdate => {
      const argsWithThisField = _.filter(args, arg =>
        _.has(arg.input, fieldToUpdate)
      );
      const whenStatements = _.map(argsWithThisField, arg => {
        return `WHEN "${idColumn}" = ? THEN ?`;
      });
      const bindings = _.flatten(
        _.map(argsWithThisField, arg => {
          const value = (arg.input as any)[fieldToUpdate];

          let transformedValue;

          if (value === null) {
            transformedValue = null;
          } else {
            const tableColumns = columnTypes![tableName]; // We check for null/undefined above. Because its a "let" it's technically possible it could get set back to null/undefined through, hence the !
            if (!tableColumns) {
              throw new Error(
                `Update failure - Unexpected table name: ${tableName}`
              );
            }
            const columnType = tableColumns[fieldToUpdate];
            if (!columnType) {
              throw new Error(
                `Update failure - Unknown column '${fieldToUpdate}' for table '${tableName}'`
              );
            }

            // Tell postgres how to cast this thing (based on the column type pulled from the schema)
            if (typeof value === "object") {
              // we need to serialize objects to store them as . This is used in report params
              transformedValue = this.db.raw(
                `?::${columnType}`,
                JSON.stringify(value)
              );
            } else {
              transformedValue = this.db.raw(`?::${columnType}`, `${value}`);
            }
          }

          return [arg.id, transformedValue]; // For each case there will be two binding variables: the id and the value to set
        })
      );

      const sqlString = `
      ?? = CASE
        ${whenStatements.join("\n")}
        ELSE ??
      END`;

      return {
        sqlString,
        bindings: [fieldToUpdate, ...bindings, fieldToUpdate],
      };
    });

    const setStatements = setStatementsWithBindings.map(s => s.sqlString);
    const allBindings = [
      tableName,
      ..._.flatten(setStatementsWithBindings.map(s => s.bindings)),
      idsToUpdate,
    ];
    const finalSqlString = `UPDATE ?? SET ${setStatements.join(
      ","
    )} WHERE "${idColumn}" = ANY(?) RETURNING "${idColumn}"`;

    const result = await this.db.raw(finalSqlString, allBindings as any);

    return args.map(arg => {
      if (result.rows.includes(arg.id)) {
        return arg.id;
      } else {
        return undefined;
      }
    });
  };

  private findVersionWithOverlappingRanges = new DataLoader<
    { id: UUID; effectiveDateTimeRange: TSTZRange },
    unknown[]
  >(
    batchDataLoaderFunction(1000, async inputs => {
      const query = this.versionTable();
      for (const input of inputs) {
        void query.orWhere(q => {
          void q
            .where("headerId", input.id)
            .andWhere(
              "effectiveDateTimeRange",
              "&&",
              input.effectiveDateTimeRange as any
            );
        });
      }
      const res = await query;
      const grouped = _.groupBy(res, x => x.headerId);
      return inputs.map(input => grouped[input.id] || []);
    }),
    {
      cacheKeyFn: key =>
        `${key.headerId}${key.effectiveDateTimeRange.toPostgres()}`,
    }
  );

  private deleteVersionConsumedByDateRange = new DataLoader<
    {
      id: UUID;
      effectiveDateTimeRange: TSTZRange;
    },
    unknown
  >(
    batchDataLoaderFunction(1000, async inputs => {
      const query = this.versionTable().delete();
      for (const input of inputs) {
        void query.orWhere(q => {
          void q
            .where("headerId", input.id)
            .andWhere(
              "effectiveDateTimeRange",
              "<@",
              input.effectiveDateTimeRange as any
            );
        });
      }
      await query;
      return inputs;
    }),
    {
      cache: false,
      cacheKeyFn: key => v4(),
    }
  );

  private findVersionToSplit = new DataLoader<
    { id: UUID; aroundDateRange: TSTZRange },
    { id: UUID; effectiveDateTimeRange: TSTZRange } | null
  >(
    batchDataLoaderFunction(1000, async inputs => {
      const query = this.versionTable();
      for (const input of inputs) {
        void query.orWhere(q => {
          void q
            .whereRaw(
              this.db.raw(
                `lower("effectiveDateTimeRange") < '${input.aroundDateRange.start}'`
              )
            )
            .whereRaw(
              this.db.raw(
                `upper("effectiveDateTimeRange") > upper(tstzrange('${input.aroundDateRange.toPostgres()}'))::timestamptz`
              )
            )
            .andWhere("headerId", input.id);
        });
      }
      const res = await query;
      const grouped = _.groupBy(res, r => r.headerId);
      return inputs.map(input => {
        const x = grouped[input.id];
        if (!x) {
          return null;
        }
        return x[0];
      });
    }),
    {
      cacheKeyFn: key => `${key.id}${key.aroundDateRange.toPostgres()}`,
    }
  );

  private updateVersion = new DataLoader<
    { id: UUID; input: Pick<TSavedR, string> },
    unknown
  >(batchDataLoaderFunction(100, this.updateDataLoaderFunction("version")), {
    cache: false,
    cacheKeyFn: () => v4(),
  });

  private splitRecordForRange = async (
    aroundDateRange: TSTZRange,
    db: Knex,
    table: QueryBuilder<any, any[]>,
    foreignKey: "id" | "headerId",
    id: string
  ) => {
    const recToSplit = await this.findVersionToSplit.load({
      id,
      aroundDateRange,
    });
    if (recToSplit) {
      await this.updateVersion.load({
        id: recToSplit.id,
        input: {
          effectiveDateTimeRange: `['${recToSplit.effectiveDateTimeRange.start}', '${aroundDateRange.start}')`,
        } as any,
      });
      await this.insertVersion.load({
        ...recToSplit,
        id: v4(),
        effectiveDateTimeRange: new TSTZRange({
          start: aroundDateRange.end!,
          end: recToSplit.effectiveDateTimeRange.end,
        }),
      } as any);
    }
  };
  private findVersionRecordWithStartDateIntersectingGivenHeaderAndRange = new DataLoader<
    { headerId: UUID; effectiveDateTimeRange: TSTZRange },
    { id: UUID; effectiveDateTimeRange: TSTZRange }
  >(
    batchDataLoaderFunction(1000, async inputs => {
      const base = this.versionTable().select(
        "id",
        "effectiveDateTimeRange",
        "headerId"
      );
      for (const input of inputs) {
        void base.orWhere(q => {
          void q
            .where("headerId", input.headerId)
            .andWhere(
              this.db.raw('lower("effectiveDateTimeRange")'),
              ">=",
              input.effectiveDateTimeRange.start
            )
            .andWhere(
              "effectiveDateTimeRange",
              "&&",
              input.effectiveDateTimeRange as any
            );
        });
      }
      const rawResults = await base;

      const grouped = _.groupBy(rawResults, x => x.headerId);
      return inputs.map(input => {
        const x = grouped[input.headerId];
        if (!x) {
          return null;
        }
        return x[0];
      });
    }),
    {
      cacheKeyFn: key =>
        `${key.headerId}${key.effectiveDateTimeRange.toPostgres()}`,
    }
  );

  private updateStartDateForIntersectingRanges = async (args: {
    id: string;
    record: { effectiveDateTimeRange: TSTZRange };
    db: Knex;
    table: QueryBuilder<any, any[]>;
    foreignKey: "id" | "headerId";
  }) => {
    const { id, record, db, table, foreignKey } = args;

    // Version table
    const res = await this.findVersionRecordWithStartDateIntersectingGivenHeaderAndRange.load(
      {
        headerId: id,
        effectiveDateTimeRange: record.effectiveDateTimeRange,
      }
    );
    if (res) {
      await this.updateVersion.load({
        id: res.id,
        input: {
          effectiveDateTimeRange: `['${record.effectiveDateTimeRange.end}', '${
            _.isNil(res.effectiveDateTimeRange.end)
              ? "infinity"
              : `${res.effectiveDateTimeRange.end}`
          }')`,
        } as any,
      });
    }
  };

  private getDateTimeRangeEndForPostgres = (range: TSTZRange) =>
    `upper(tstzrange('${range.toPostgres()}'))::timestamptz`;

  private updateEffectiveDatesForSurroundingRecords = async (args: {
    id: string;
    record: { effectiveDateTimeRange: TSTZRange };
    db: Knex;
    table: QueryBuilder<any, any[]>;
    foreignKey: "id" | "headerId";
  }) => {
    await Promise.all([
      this.updateStartDateForIntersectingRanges(args),
      this.updateEndDateForIntersectingRanges(args),
    ]);
  };

  private findVersionRecordWithEndDateIntersectingGivenHeaderAndRange = new DataLoader<
    { headerId: UUID; effectiveDateTimeRange: TSTZRange },
    { id: UUID; effectiveDateTimeRange: TSTZRange }
  >(
    batchDataLoaderFunction(1000, async inputs => {
      const base = this.versionTable().select(
        "id",
        "effectiveDateTimeRange",
        "headerId"
      );
      for (const input of inputs) {
        void base.orWhere(q => {
          void q
            .where("headerId", input.headerId)
            .andWhere(
              this.db.raw('upper("effectiveDateTimeRange")'),
              "<=",
              this.db.raw(
                this.getDateTimeRangeEndForPostgres(
                  input.effectiveDateTimeRange
                )
              )
            )
            .andWhere(
              "effectiveDateTimeRange",
              "&&",
              input.effectiveDateTimeRange as any
            );
        });
      }
      const rawResults = await base;

      const grouped = _.groupBy(rawResults, x => x.headerId);
      return inputs.map(input => {
        const x = grouped[input.headerId];
        if (!x) {
          return null;
        }
        return x[0];
      });
    }),
    {
      cacheKeyFn: key =>
        `${key.headerId}${key.effectiveDateTimeRange.toPostgres()}`,
    }
  );

  private updateEndDateForIntersectingRanges = async (args: {
    id: string;
    record: { effectiveDateTimeRange: TSTZRange };
    db: Knex;
    table: QueryBuilder<any, any[]>;
    foreignKey: "id" | "headerId";
  }) => {
    const { id, record, db, table, foreignKey } = args;

    // Version table
    const res = await this.findVersionRecordWithEndDateIntersectingGivenHeaderAndRange.load(
      {
        headerId: id,
        effectiveDateTimeRange: record.effectiveDateTimeRange,
      }
    );
    if (res) {
      await this.updateVersion.load({
        id: res.id,
        input: {
          effectiveDateTimeRange: `['${res.effectiveDateTimeRange.start}', '${record.effectiveDateTimeRange.start}')`,
        } as any,
      });
    }
  };

  private updateConflictingVersions = async (
    id: string,
    record: { effectiveDateTimeRange: TSTZRange },
    db: Knex,
    table: QueryBuilder<any, any[]>,
    foreignKey: "id" | "headerId"
  ) => {
    const overlappingRanges =
      foreignKey === "id"
        ? await table
            .clone()
            .where(foreignKey, id)
            .andWhere(
              "effectiveDateTimeRange",
              "&&",
              record.effectiveDateTimeRange as any
            )
        : await this.findVersionWithOverlappingRanges.load({
            id,
            effectiveDateTimeRange: record.effectiveDateTimeRange,
          });
    if (overlappingRanges.length > 0) {
      // Delete any consummed
      if (foreignKey === "id") {
        await table
          .clone()
          .delete()
          .where(foreignKey, id)
          .andWhere(
            "effectiveDateTimeRange",
            "<@",
            record.effectiveDateTimeRange as any
          );
      } else {
        await this.deleteVersionConsumedByDateRange.load({
          id,
          effectiveDateTimeRange: record.effectiveDateTimeRange,
        });
      }

      // Split the versions if inserting in the middle
      await this.splitRecordForRange(
        record.effectiveDateTimeRange,
        db,
        table,
        foreignKey,
        id
      );

      await this.updateEffectiveDatesForSurroundingRecords({
        id,
        record,
        db,
        table,
        foreignKey,
      });
    }
  };

  private updateHeader = new DataLoader<
    { id: UUID; input: Pick<TSavedR, string> },
    unknown
  >(batchDataLoaderFunction(100, this.updateDataLoaderFunction("header")), {
    cache: false,
    cacheKeyFn: () => v4(),
  });

  private findHeaderById = new DataLoader<UUID, unknown>(async ids => {
    const res = await this.headerTable().whereIn("id", ids);
    const grouped = groupBy(res, x => x.id);
    return ids.map(id => {
      const maybe = grouped[id];
      if (!maybe) {
        throw new Error(`Header Id not found for ${id}`);
      }
      return maybe[0];
    });
  }, {});

  public async update(record: TSavedR): Promise<TSavedR> {
    const masterRecord = this.prepToUpdateOnMaster(record);
    if (!(await this.findHeaderById.load(record.id))) {
      throw new Error("could not find record with matching id");
    }
    const headerValues = pick(record, [...this.headerColumns]);
    // TODO: Don't run this if needed, do the check here, not domain
    await this.updateHeader.load({
      id: record.id,
      input: headerValues,
    });
    await this.updateConflictingVersions(
      record.id,
      masterRecord,
      this.db,
      this.versionTable(),
      "headerId"
    );

    await this.insertVersion.load({
      headerId: record.id,
      ...pick(masterRecord, this.versionColumns),
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
    [key in Exclude<keyof SavedR<TRecordInfo>, "id">]: "version" | "header";
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
