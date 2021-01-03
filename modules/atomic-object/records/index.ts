import * as DataLoader from "dataloader";
import stringify from "json-stable-stringify";
import knex from "knex";
import { at, compact, groupBy, keyBy, pick } from "lodash-es";
import { Context } from "atomic-object/hexagonal/context";
import { EntityType, KeyType, SavedR, UnsavedR } from "./abstract";
import { buildLoaderTableWithDefaults } from "./utils";
import { KnexPort } from "./knex-port";
// import { UUID } from 'modules/core';

type MinimalContext = Context<KnexPort>;

export interface BaseHelpers<
  SavedDestType extends IdKeyT,
  IdKeyT extends object
> {
  table: () => knex.QueryBuilder;
  db: Knex;
  recordType: KnexRecordInfo<any, SavedDestType, IdKeyT>;
  find: DataLoader<
    KeyType<KnexRecordInfo<any, SavedDestType, any>>,
    SavedDestType | null
  >;
}

export type Knex = knex;

/** Terminology used and borrowed from PostgreSQL, see
 * <https://www.postgresql.org/docs/current/transaction-iso.html> for info */
export type IsolationLevel =
  | "READ UNCOMMITTED"
  | "READ COMMITTED"
  | "REPEATABLE READ"
  | "SERIALIZABLE";

export interface KnexRecordInfo<
  Unsaved = any,
  Saved extends Unsaved & IdType = any,
  IdType extends object = any
> extends EntityType<Unsaved, Saved, IdType> {
  tableName: string;
  idKeys: (keyof Saved)[];
}

export type ReadOnlyDataLoader<TKey, TValue> = {
  load: (key: TKey) => Promise<TValue>;
  loadMany: (keys: TKey[]) => Promise<TValue[]>;
};

/** Extract the runtime key name from a recordInfo */
export function idKeysOf<RI extends KnexRecordInfo>(
  recordInfoWithIdKey: RI
): string[] {
  return recordInfoWithIdKey.idKeys as any;
}

/** Turns a record type with possibly more fields than "id" into an array */
export function collectIdValues<RecordT extends KnexRecordInfo>(
  idObj: KeyType<RecordT>,
  knexRecordType: RecordT
): string[] {
  return at(idObj, idKeysOf(knexRecordType));
}

function castToRecordInfo(
  runtimeData: Omit<KnexRecordInfo, "_idKeys" | "_saved" | "_unsaved">
): KnexRecordInfo {
  return runtimeData as KnexRecordInfo;
}

/** Creates a record descriptor that captures the table name, primary key name, unsaved type, and saved type of a database record type. Assumes "id" as the primary key name */
export function recordInfo<Unsaved, Saved extends Unsaved & { id: any }>(
  tableName: string
): KnexRecordInfo<Unsaved, Saved, Pick<Saved, "id">>;

export function recordInfo<Type extends { id: string }>(
  tableName: string
): KnexRecordInfo<Type, Type, Pick<Type, "id">>;

/** Creates a record descriptor that captures the table name, primary key name, unsaved type, and saved type of a database record type. */
export function recordInfo<
  Unsaved,
  Saved extends Unsaved,
  Id extends keyof Saved
>(
  tableName: string,
  idKey: Id[]
): KnexRecordInfo<Unsaved, Saved, Pick<Saved, Id>>;

/** Don't use this signature – be sure to provide unsaved and saved types. */
export function recordInfo(tableName: string, idKeys?: string[]) {
  idKeys = idKeys || ["id"];
  return castToRecordInfo({
    tableName,
    idKeys,
    idOf: rec => pick(rec, idKeys as any),
  });
}

// declare class Rec

export function recordType<TUnsaved, TSaved extends TUnsaved = TUnsaved>(
  tableName: string
): {
  withCompositeKeys<TKeys extends keyof TSaved>(
    keys: TKeys[]
  ): KnexRecordInfo<TUnsaved, TSaved, Pick<TSaved, TKeys>>;
} {
  return {
    withCompositeKeys(keys) {
      return castToRecordInfo({
        tableName,
        idKeys: keys,
        idOf: rec => pick(rec, keys),
      });
    },
  };
}

/**
 * Returns a factory object that can create useful DataLoaders specific to a records repository.
 *
 * TODO: Some outstanding issues:
 * ==============================
 *
 * DataLoader reuse could be improved between pairs of data loaders that find
 * One or Many (e.g., findOneByColumns vs findManyByColumns). Either have
 * findOneByColumns be more efficient and not fetch all records from the
 * database (e.g., use distinct at the SQL level), or have findOneByColumns use
 * the data provided by findManyByColumns.
 *
 * Most of the record types that are generic by a `SourceId` that extends
 * `object` on KnexRecordInfo are actually mostly just `{ id: string }`. The
 * SQL and query parsing could be more efficient if more loaders took advantage
 * of that.
 */
export class LoaderFactory<
  SavedDestType extends DestId,
  DestId extends object
> {
  constructor(public readonly repo: ITableHelpers<SavedDestType, DestId>) {}
  findOneBy<K extends keyof SavedDestType>(targetKey: K) {
    return new DataLoader<SavedDestType[K], SavedDestType | null>(
      async (keyValues: any) => {
        const entries: SavedDestType[] = await this._primeAll(
          await this.repo.table().whereIn(targetKey as any, keyValues)
        );
        const table = keyBy(entries, targetKey);
        return keyValues.map((val: any) => table[val.toString()] || null);
      }
    );
  }

  findOneByColumns<K extends keyof SavedDestType>(targetKeys: K[]) {
    type InputKeyType = { [k in K]: SavedDestType[k] };
    return new DataLoader<InputKeyType, SavedDestType | null>(
      async keyValues => {
        const entries: SavedDestType[] = await this._primeAll(
          await this.repo
            .table()
            .whereIn(
              targetKeys as any[],
              keyValues.map(vals => targetKeys.map(k => vals[k])) as any[][]
            )
        );
        const table = keyBy(entries, r => targetKeys.map(k => r[k]).join("-"));
        return keyValues.map(
          vals => table[targetKeys.map(k => vals[k]).join("-")] || null
        );
      },
      { cacheKeyFn: (key: InputKeyType) => stringify(at(key, targetKeys)) }
    );
  }

  findOneByWithDefault<
    K extends keyof SavedDestType & (string | number),
    KeyValue extends SavedDestType[K] & (string | number),
    T extends Partial<SavedDestType>
  >(
    targetKey: K,
    findOneByLoader: DataLoader<KeyValue, SavedDestType | null>,
    buildDefault: (keyValues: KeyValue[]) => T[]
  ) {
    return new DataLoader<KeyValue, SavedDestType | T>(async keyValues => {
      const foundEntries = compact(await findOneByLoader.loadMany(keyValues));

      const entriesTable = buildLoaderTableWithDefaults(
        buildDefault,
        targetKey,
        keyValues,
        foundEntries
      );
      return keyValues.map((val: any) => entriesTable[val.toString()] || null);
    });
  }

  findManyByColumns<K extends keyof SavedDestType>(targetKeys: K[]) {
    type InputKeyType = { [k in K]: SavedDestType[K] };
    return new DataLoader<InputKeyType, SavedDestType[]>(
      async keyValues => {
        const entries: SavedDestType[] = await this._primeAll(
          await this.repo
            .table()
            .whereIn(
              targetKeys as any[],
              keyValues.map(vals => targetKeys.map(k => vals[k])) as any[][]
            )
        );
        const table = groupBy<SavedDestType>(entries, r =>
          targetKeys.map(k => r[k]).join("-")
        );
        return keyValues.map(
          vals => table[targetKeys.map(k => vals[k]).join("-")] || []
        );
      },
      { cacheKeyFn: (key: InputKeyType) => stringify(at(key, targetKeys)) }
    );
  }

  findManyBy<K extends keyof SavedDestType>(targetKey: K) {
    type InputKeyType = { [k in K]: SavedDestType[K] };
    return new DataLoader<SavedDestType[K], SavedDestType[]>(
      async (keyValues: any) => {
        const entries: SavedDestType[] = await this._primeAll(
          await this.repo.table().whereIn(targetKey as any, keyValues)
        );
        const table = groupBy<SavedDestType>(entries, targetKey);
        const ordered = keyValues.map(
          (keyValue: any) => table[keyValue.toString()] || []
        );
        return ordered;
      }
    );
  }

  /** Analogous to has_many in Rails */
  allBelongingTo<
    UnsavedSourceT,
    SavedSourceT extends UnsavedSourceT & SourceId,
    SourceId extends object,
    ForeignKey extends keyof SavedDestType
  >(
    record: KnexRecordInfo<UnsavedSourceT, SavedSourceT, SourceId>,
    foreignKey: ForeignKey
  ) {
    type IdType = KeyType<typeof record>;
    if (record.idKeys.length > 1) {
      throw new Error("allBelongingTo doen't support compound primary keys");
    }

    // Decide which cache function to use based on the record's idKeys
    const cacheKeyFn =
      idKeysOf(record).length === 1 && idKeysOf(record)[0] === "id"
        ? (key: { id: any }) => key.id // fast case - 97% faster, even with the check.
        : (key: IdType) => stringify(collectIdValues(key, record));

    return new DataLoader<IdType, SavedDestType[]>(
      async args => {
        const ids: IdType[] = args.map(arg => (arg as any)[record.idKeys[0]]);
        console.log("looking up for", { foreignKey, ids });
        const records = await this._primeAll(
          await this.repo.table().whereIn(foreignKey as any, ids as any[])
        );
        console.log("records...", records);

        const table = groupBy<SavedDestType>(records, foreignKey);
        console.log({ table });
        const ordered = ids.map(id => {
          console.log("find id...", id);
          return table[(id as any).toString()] || [];
        });
        console.log({ ordered });
        return ordered;
      },
      { cacheKeyFn }
    );
  }

  /** Analogous to has_one in Rails */
  oneBelongingTo<
    UnsavedSourceT,
    SavedSourceT extends UnsavedSourceT & SourceId,
    SourceId extends object,
    ForeignKey extends keyof SavedDestType
  >(
    record: KnexRecordInfo<UnsavedSourceT, SavedSourceT, SourceId>,
    foreignKey: ForeignKey
  ) {
    type IdType = KeyType<typeof record>;
    if (record.idKeys.length > 1) {
      throw new Error("oneBelongingTo doen't support compound primary keys");
    }

    // Decide which cache function to use based on the record's idKeys
    const cacheKeyFn =
      idKeysOf(record).length === 1 && idKeysOf(record)[0] === "id"
        ? (key: { id: any }) => key.id // fast case - 97% faster, even with the check.
        : (key: IdType) => stringify(collectIdValues(key, record));

    return new DataLoader<IdType, SavedDestType>(
      async args => {
        const ids: IdType[] = args.map(arg => (arg as any)[record.idKeys[0]]);
        const records = await this._primeAll(
          await this.repo.table().whereIn(foreignKey as any, ids as any[])
        );

        const table = keyBy<SavedDestType>(records, foreignKey);
        const ordered = ids.map(id => table[(id as any).toString()] || []);
        return ordered;
      },
      { cacheKeyFn }
    );
  }

  /** Creates a loader that use a foreign key on a provided sourceRecord type
   * to load a SavedDestType from `this` repository.
   *
   * The returned loader can take either
   * 1) a source record object that has the Foreign Key or
   * 2) an "id" (string) that is used to look up the source record object in
   * the database
   *
   * An example would be on `ProductRecordRepository` - `forProductVariant`
   * uses the "productId" field on `ProductVariantRecord` to get an "id" for
   * the Product table. The returned loader can take either the object
   * {productId: id} or the whole ProductVariantRecord object.
   *
   * TODO: To translate SourceIdType into a SavedSource record, `owning` needs
   * to make a data loader on the sourceRecordInfo that replicates the
   * operation and data cache of the source record repository's `findById`
   * (that uses `find`) loader. We could avoid those objects being fetched
   * twice (which does cause a non-trivial amount of duplicate data to be
   * fetched), if we could supply the source record's repository's `find`
   * DataLoader to this function, or obtain it when this function runs.
   *
   * One idea for this would be to have a small layer between the Records Repos
   * and KnexPort that held only the `find` DataLoaders for all the record
   * repositories, possibly using the commented out `_repoLookupMap`.
   */
  owning<
    UnsavedSource,
    DestKey extends DestId[keyof DestId],
    SavedSource extends Record<ForeignKey, DestKey> &
      SourceIdType &
      UnsavedSource,
    ForeignKey extends string,
    SourceIdType extends object
  >(
    sourceRecordInfo: KnexRecordInfo<UnsavedSource, SavedSource, SourceIdType>,
    sourceKey: ForeignKey
  ) {
    if (sourceRecordInfo.idKeys.length > 1) {
      throw new Error("owning doen't support compound primary keys");
    }
    type FkType = SavedSource[ForeignKey];
    type Filter<T, U> = T extends U ? T : never;

    // TODO: Determine if this is the right way to find the type of the cache key
    type InputKeyType =
      | Pick<SavedSource, ForeignKey>
      | (SourceIdType[keyof SourceIdType] & string);

    // Result is nullable if the foreign key is nullable or undefined. Else
    // non-nullable.
    type ResultType = Filter<FkType, null | undefined> extends never
      ? SavedDestType
      : null | SavedDestType;

    // Since there's no way to get source record's `find` DataLoader, we have to make one here.
    const sourceFindByIdDataLoader = new DataLoader<
      SourceIdType[keyof SourceIdType] & string,
      SavedSource
    >(async ids => {
      const idField = idKeysOf(sourceRecordInfo)[0];
      const rows: SavedSource[] = await this.repo.db
        .table(sourceRecordInfo.tableName)
        .whereIn(idField as any, ids as any);
      if (ids.length !== rows.length) {
        // We currently assume we'll always find a source record by id, which should be fine if we only use ids in the database.
        throw new Error(
          "In `owning` dataloader, a sourceFindByIdDataLoader id lookup couldn't find all records."
        );
      }
      const byId = keyBy(rows, (r: any) => r[idField] as string);
      return ids.map(id => byId[id]);
    });

    function hasSourceId(
      key: Pick<SavedSource, ForeignKey> | SourceIdType[keyof SourceIdType]
    ): key is Pick<SavedSource, ForeignKey> {
      return key && typeof key === "object" && sourceKey in key;
    }

    return new DataLoader<InputKeyType, ResultType>(
      async sourceIdOrSourceRecords => {
        const sourceRecordsWithForeignKey = await Promise.all(
          sourceIdOrSourceRecords.map(async r =>
            hasSourceId(r) ? r : await sourceFindByIdDataLoader.load(r)!
          )
        );

        const records: ResultType[] = await Promise.all(
          sourceRecordsWithForeignKey.map(
            async r => {
              const destId: DestKey = r && r[sourceKey];
              return (
                destId &&
                ((await this.repo.findById.load(destId)) as ResultType)
              );
            } // Because this is a foreign key, we're asserting this is not null if FK is not null.
          )
        );

        return records;
      },
      {
        cacheKeyFn: (key: InputKeyType) =>
          hasSourceId(key) ? key[sourceKey] : key,
      }
    );
  }

  /** Given a set of records for this repo type, prime all of them into the
   * findById dataloader and return whichever records it stores. (Prime doesn't
   * replace existing entries, so we want what's in there)
   * */
  private async _primeAll(rows: SavedDestType[]): Promise<SavedDestType[]> {
    for (const row of rows) {
      console.log("priming table...", this.repo.table());
      console.log("row id", this.repo.recordType.idOf(row));
      this.repo.find.prime(this.repo.recordType.idOf(row), row);
    }
    const ids = rows.map(row => this.repo.recordType.idOf(row));

    // Return the actual objects from the findById loader
    // instead of caching multiple copies of the same record

    // "as" cast: we just primed find, so we know that none of these are null
    return (await this.repo.find.loadMany(ids)) as SavedDestType[];
  }
}

/** Factory to construct a DataLoader for associations returning the destination type handled by the passed in repostory */
export function loaderOf<
  TContext extends MinimalContext,
  TRecInfo extends KnexRecordInfo
>(repo: KnexRepositoryBase<TContext, TRecInfo>) {
  return new LoaderFactory<SavedR<TRecInfo>, KeyType<TRecInfo>>(repo as any);
}

export interface ITableHelpers<
  SavedDestType extends IdKeyT,
  IdKeyT extends object
> extends BaseHelpers<SavedDestType, IdKeyT> {
  findById: ReadOnlyDataLoader<IdKeyT[keyof IdKeyT], SavedDestType | null>;
}

export interface DateTimeHelpers<SavedDestType extends { id: string }>
  extends BaseHelpers<SavedDestType, { id: string }> {
  findById: ReadOnlyDataLoader<string, SavedDestType | null>;
}

export abstract class TableHelpers<
  TContext extends MinimalContext,
  TUnsavedR,
  TSavedR extends TUnsavedR & IdKeyT,
  IdKeyT extends object
> implements BaseHelpers<TSavedR, IdKeyT> {
  abstract recordType: KnexRecordInfo<TUnsavedR, TSavedR, IdKeyT>;
  public abstract db: Knex;

  // TODO: Data Pool Updates
  //  - Make this return either the actual table if pointing at master
  //    or the Lens view if pointing at non-master data pool.
  table() {
    return this.db.table(this.recordType.tableName);
  }

  // TODO: Data Pool Updates
  //  - Add in the Sandbox Id and move the original table's primary key
  //    column(s) to where they live on the Overlay table if non-master.
  prepToCreate(unsaved: TUnsavedR): Partial<TSavedR> {
    return unsaved as any;
  }

  // TODO: Data Pool Updates
  //  - Map the returned data back into the expected Record format if
  //    this was inserted into an Overlay table.
  async insert(unsaved: TUnsavedR): Promise<TSavedR> {
    const idKeys = idKeysOf(this.recordType as any);
    const ids = await this.table().insert(this.prepToCreate(unsaved), idKeys);
    return { ...unsaved, id: ids[0][idKeys[0]] } as any;
  }

  async insertMany(unsavedRecords: TUnsavedR[]): Promise<TSavedR[]> {
    const prep = this.prepToCreate.bind(this);
    const ids = await this.table().insert(
      unsavedRecords.map(prep),
      idKeysOf(this.recordType as any)
    );
    const saved = unsavedRecords.map((unsaved, index) => ({
      ...unsaved,
      ...ids,
    }));
    return saved as any;
  }

  async update(attrs: TSavedR): Promise<TSavedR> {
    let records: TSavedR[];
    try {
      const idConstraint = this.recordType.idOf(attrs);
      records = await this.table()
        .where(idConstraint)
        .update(attrs, "*");
    } catch (err) {
      throw new Error(err.message);
    }
    const updatedRecord = records[0];
    if (updatedRecord) {
      return updatedRecord;
    } else {
      throw new Error("Could not find record");
    }
  }

  async delete(...ids: KeyType<KnexRecordInfo<TUnsavedR, TSavedR, IdKeyT>>[]) {
    try {
      await this.table()
        .whereIn(idKeysOf(this.recordType as any), ids as any)
        .delete();
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async all(): Promise<TSavedR[]> {
    return await this.table();
  }

  async first(): Promise<TSavedR | null> {
    return (await this.table().limit(1))[0] || null;
  }

  async count(): Promise<number> {
    return parseInt(String((await this.table().count())[0].count), 10);
  }

  /** The `find` data loader takes an object that has at the id fields on it */
  find = new DataLoader<
    KeyType<KnexRecordInfo<TUnsavedR, TSavedR, IdKeyT>>,
    TSavedR | null
  >(
    async ids => {
      const idKeys = idKeysOf(this.recordType);
      const rows: TSavedR[] = await this.table().whereIn(
        idKeys as any,
        ids.map(id => collectIdValues(id, this.recordType)) as any
      );
      const toKey = (row: any) => stringify(at(row, idKeys));
      const byId = keyBy(rows, toKey);
      return ids.map(id => byId[toKey(id)]);
    },
    {
      cacheKeyFn: key =>
        idKeysOf(this.recordType).length === 1 &&
        idKeysOf(this.recordType)[0] === "id"
          ? key.id // fast case - 97% faster, even with the check.
          : stringify(collectIdValues(key, this.recordType)),
    }
  );
}

export abstract class TableHelpersWithFindById<
  TContext extends MinimalContext,
  TUnsavedR,
  TSavedR extends TUnsavedR & IdKeyT,
  IdKeyT extends object
> extends TableHelpers<TContext, TUnsavedR, TSavedR, IdKeyT>
  implements ITableHelpers<TSavedR, IdKeyT> {
  findById: ReadOnlyDataLoader<IdKeyT[keyof IdKeyT], TSavedR | null> = {
    load: async (id: IdKeyT[keyof IdKeyT]): Promise<TSavedR | null> => {
      return this.find.load({ id } as IdKeyT);
    },
    loadMany: async (
      ids: IdKeyT[keyof IdKeyT][]
    ): Promise<(TSavedR | null)[]> => {
      return this.find.loadMany(ids.map(id => ({ id } as IdKeyT)));
    },
  };
}

export abstract class RepositoriesBase {
  constructor(protected ctx: MinimalContext) {}

  // private _repoLookupMap: null | Map<
  //   KnexRecordInfo<any, any, any>,
  //   KnexRepositoryBase<any, any>
  // > = null;

  transaction(
    func: (repos: this, transaction: knex.Transaction) => Promise<any>,
    isolationLevel: IsolationLevel = "READ COMMITTED"
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.ctx
        .get(KnexPort)
        .transaction(async trx => {
          if (isolationLevel !== "READ COMMITTED") {
            await trx.raw(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
          }
          return await func(
            new (this as any).constructor(
              this.ctx.clone(b => b.add(KnexPort, () => trx))
            ),
            trx
          );
        })
        .then(resolve, reject);
    });
  }
}

export interface KnexRepositoryBase<
  TContext extends MinimalContext,
  TRecordInfo extends KnexRecordInfo
>
  extends TableHelpersWithFindById<
    TContext,
    UnsavedR<TRecordInfo>,
    SavedR<TRecordInfo>,
    KeyType<TRecordInfo>
  > {
  _recordType: TRecordInfo;
}

export type RepoRecordType<
  Repo extends KnexRepositoryBase<any, any>
> = Repo extends KnexRepositoryBase<any, infer Rec> ? Rec : never;

export function UnboundRepositoryBase<
  TRecordInfo extends KnexRecordInfo,
  TContext extends MinimalContext = MinimalContext
>(aRecordType: TRecordInfo) {
  return class Repository
    extends TableHelpersWithFindById<
      TContext,
      UnsavedR<TRecordInfo>,
      SavedR<TRecordInfo>,
      KeyType<TRecordInfo>
    >
    implements KnexRepositoryBase<TContext, TRecordInfo> {
    _recordType!: TRecordInfo;
    static readonly recordType = aRecordType;
    static readonly tableName = aRecordType.tableName;
    public readonly recordType = aRecordType;

    constructor(protected ctx: TContext) {
      super();
    }

    get db() {
      return this.ctx.get(KnexPort);
    }
  };
}
