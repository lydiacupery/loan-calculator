import { IAbstractInsertRepository } from "modules/atomic-object/records/abstract";

export interface DomainEntityType<
  TObjectType = any,
  TIdKeys extends object = any
> {
  _objectType: TObjectType;
  _idKeys: TIdKeys;
  idOf: (rec: TObjectType) => TIdKeys;
}
export type ObjectType<T extends { _objectType: any }> = T["_objectType"];
export type IdKeys<T extends DomainEntityType> = T["_idKeys"];

export interface IAbstractDomainRepository<
  TRecordInfo extends DomainEntityType
>
  extends IAbstractInsertRepository<
    ObjectType<TRecordInfo>,
    ObjectType<TRecordInfo>
  > {
  // insert(object: ObjectType<TRecordInfo>): Promise<ObjectType<TRecordInfo>>;
  insertMany(
    objects: ObjectType<TRecordInfo>[]
  ): Promise<ObjectType<TRecordInfo>[]>;
  update(object: ObjectType<TRecordInfo>): Promise<ObjectType<TRecordInfo>>;
  delete(...ids: IdKeys<TRecordInfo>[]): Promise<void>;

  find(id: IdKeys<TRecordInfo>): Promise<ObjectType<TRecordInfo> | null>;
  findMany(
    ids: IdKeys<TRecordInfo>[]
  ): Promise<(ObjectType<TRecordInfo> | null)[]>;
}
