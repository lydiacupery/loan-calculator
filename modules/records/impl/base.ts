import { UnboundRepositoryBase } from "atomic-object/records";
import { SavedR, KnexRecordInfo } from "atomic-object/records/abstract";

export function RepositoryBase<Rec extends KnexRecordInfo>(recordType: Rec) {
  return UnboundRepositoryBase<Rec>(recordType);
}
