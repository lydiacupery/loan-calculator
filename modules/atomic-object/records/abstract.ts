import * as DataLoader from "dataloader";
import knex from "knex";

export interface EntityType<
  TUnsaved = any,
  TSaved = any,
  TIds extends object = any
> {
  _saved: TSaved;
  _unsaved: TUnsaved;
  _idKeys: TIds;
  idOf: (rec: TSaved) => TIds;
}

export type UnsavedR<T extends { _unsaved: any }> = T["_unsaved"];
export type SavedR<T extends { _saved: any }> = T["_saved"];
export type KeyType<R extends EntityType> = R["_idKeys"];

export interface IAbstractInsertRepository<TUnsaved, TSaved> {
  insert(unsavedRecord: TUnsaved): Promise<TSaved>;
}
export interface IAbstractRepository<TRecordInfo extends EntityType>
  extends IAbstractInsertRepository<
    UnsavedR<TRecordInfo>,
    SavedR<TRecordInfo>
  > {
  insertMany(
    unsavedRecords: UnsavedR<TRecordInfo>[]
  ): Promise<SavedR<TRecordInfo>[]>;
  update(attrs: SavedR<TRecordInfo>): Promise<SavedR<TRecordInfo>>;
  delete(...ids: KeyType<TRecordInfo>[]): Promise<void>;

  find: DataLoader<KeyType<TRecordInfo>, SavedR<TRecordInfo> | null>;
}

export async function loadOrDie<TRepoType, L, F>(
  repo: TRepoType,
  lookupKey: L,
  loaderLocator: (repo: TRepoType) => { load: (k: L) => Promise<F> }
): Promise<F> {
  const locator = loaderLocator(repo);
  if (!locator) {
    throw new Error(`Couldn't find locator for ${typeof repo}`);
  }
  const found = await locator.load(lookupKey);
  if (!found) {
    throw new Error(
      `${typeof repo} returned null for code "${lookupKey}" and must not!`
    );
  }
  return found;
}

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

export interface ITableHelpers<
  SavedDestType extends IdKeyT,
  IdKeyT extends object
> {
  table: () => knex.QueryBuilder;
  db: knex;
  recordType: KnexRecordInfo<any, SavedDestType, IdKeyT>;
  find: DataLoader<
    KeyType<KnexRecordInfo<any, SavedDestType, any>>,
    SavedDestType | null
  >;
  findById: ReadOnlyDataLoader<IdKeyT[keyof IdKeyT], SavedDestType | null>;
}
