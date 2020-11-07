import { UnboundRepositoryBase } from "atomic-object/records";
import { SavedR, KnexRecordInfo } from "atomic-object/records/abstract";
import {
  EffectiveDateTimeKnexRecordInfo,
  EffectiveDateTimeUnboundRepositoryBase,
} from "atomic-object/records/effective-date-time";

export function RepositoryBase<Rec extends KnexRecordInfo>(recordType: Rec) {
  return UnboundRepositoryBase<Rec>(recordType);
}

export function EffectiveDateTimeRepositoryBase<Saved extends { id: string }>(
  recordType: EffectiveDateTimeKnexRecordInfo<Saved>,
  columnInfo: { [key in Exclude<keyof Saved, "id">]: "version" | "header" }
) {
  return EffectiveDateTimeUnboundRepositoryBase<
    EffectiveDateTimeKnexRecordInfo<Saved>
  >(recordType, columnInfo);
}
