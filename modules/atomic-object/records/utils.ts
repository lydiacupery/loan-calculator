import { keyBy } from "lodash-es";

/** Create a complete lookup table from  buildDefault() to fill a collection of RecordT by calling buildDefault() for missing keys */
export function buildLoaderTableWithDefaults<
  RecordT extends object,
  DefaultT extends Partial<RecordT>,
  K extends keyof RecordT & (string | number),
  KeyValue extends RecordT[K] & (string | number)
>(
  buildDefault: (keyValues: KeyValue[]) => DefaultT[],
  targetKey: K,
  keyValues: KeyValue[],
  loadedEntries: RecordT[]
): { [Key: string]: RecordT | DefaultT } {
  let keyLookupTable = keyBy(loadedEntries, targetKey);
  const missingKeys = keyValues.filter(
    k => Object.prototype.hasOwnProperty.call(keyLookupTable, k) === false
  );
  if (missingKeys.length > 0) {
    const defaultValues = buildDefault(missingKeys);
    const keyedDefaults = keyBy(defaultValues, targetKey);
    keyLookupTable = Object.assign(keyLookupTable, keyedDefaults);
  }
  return keyLookupTable;
}

/* Example:
   {
     10: RecordT,
     11: RecordT,
     ...
   }
 * */
