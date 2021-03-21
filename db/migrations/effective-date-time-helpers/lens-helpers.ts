import Knex from "knex";
// tslint:disable-next-line:import-blacklist
import * as _ from "lodash";

const getTypeName = (baseName: string) => `${baseName}_Type`;
const getLensName = (baseName: string) => `${baseName}_Lens`;

export function getDropLensCode(tableName: string) {
  const typeName = getTypeName(tableName);
  const lensName = getLensName(tableName);
  return `
    DROP FUNCTION IF EXISTS "${lensName}";
    DROP TYPE IF EXISTS "${typeName}";
  `;
}

export type Column = {
  name: string;
  type: string;
  nullable?: boolean;
  default?: any;
};

export type LensInfo = {
  lensCode: string;
  lensName: string;
  lensDropCode: string;
};

type AllColumnInfo = Record<string, Knex.ColumnInfo>;

/** Transforms Knex's columnInfo structure into an array of column definitions */
export function columnInfoToDpColumns(
  columnInfo: Record<string, Knex.ColumnInfo>
): Column[] {
  return _.entries(columnInfo).map(([key, value]) => ({
    name: key,
    type: value.type,
    nullable: value.nullable,
    default: value.defaultValue,
  }));
}

export async function generateDataLensFromBaseAndVersionWithRangesBuilderCode(
  knex: Knex,
  {
    tableBaseName,
    tableVersionName,
    isDeletedSupported,
    additionalConstraints,
  }: {
    tableBaseName: string;
    tableVersionName: string;
    isDeletedSupported: boolean;
    additionalConstraints?: string[][];
  }
) {
  const headerInfo = ((await knex(
    tableBaseName
  ).columnInfo()) as unknown) as AllColumnInfo;
  const versionInfo = ((await knex(
    tableVersionName
  ).columnInfo()) as unknown) as AllColumnInfo;

  const keyColumns = columnInfoToDpColumns(_.pick(headerInfo, ["id"]));

  const headerColumns = columnInfoToDpColumns(
    _.pickBy(headerInfo, (value, key) => key !== "id")
  );
  const versionColumns = columnInfoToDpColumns(
    _.pickBy(versionInfo, (value, key) => key !== "id" && key !== "headerId")
  );

  const tableLensFunction = buildDataPoolLensFunctionSupportingEffectiveDatesUsingRanges(
    tableBaseName,
    tableVersionName,
    versionColumns,
    headerColumns,
    keyColumns,
    isDeletedSupported
  );
  return {
    lensCode: tableLensFunction.lensCode,
  };
}

export function buildDataPoolLensFunctionSupportingEffectiveDatesUsingRanges(
  baseName: string,
  versionName: string,
  versionColumns: Column[],
  headerColumns: Column[],
  keyColumns: Column[],
  isDeletedSupport: boolean
): LensInfo {
  const typeName = `${baseName}_Type`;
  const lensName = getLensName(baseName);

  const allColumns = [...keyColumns, ...headerColumns, ...versionColumns];

  const typeColumns = allColumns.map(c => `"${c.name}" ${c.type}`);
  const overlaySelectColumns = allColumns.map(
    c => `overlay."${c.name}" as "${c.name}"`
  );

  const keyColumnsToSelect = keyColumns.map(
    c => `base."${c.name}" as "${c.name}"`
  );
  const headerColumnsToSelect = headerColumns.map(
    c => `base."${c.name}" as "${c.name}"`
  );

  const versionColumnsToSelect = versionColumns.map(
    c => `version."${c.name}" as "${c.name}"`
  );

  const code = `
    CREATE TYPE "${typeName}" AS (${typeColumns.join(", ")});
    CREATE FUNCTION "${lensName}"(timestamptz ${
    isDeletedSupport ? ", bool DEFAULT false" : ""
  }) RETURNS setof "${typeName}"
    AS $$
      SELECT
        ${
          keyColumnsToSelect.length > 0
            ? `${keyColumnsToSelect.join(", ")}`
            : ""
        }
        ${
          headerColumnsToSelect.length > 0
            ? `,${headerColumnsToSelect.join(", ")}`
            : ""
        }
        ${
          versionColumnsToSelect.length > 0
            ? `,${versionColumnsToSelect.join(",")}`
            : ""
        }
      FROM
      "${baseName}" base
      JOIN "${versionName}" version ON version."headerId" = base.id
      AND (version."effectiveDateTimeRange" @> $1::timestamptz )
      ${isDeletedSupport ? 'AND ($2 or version."isDeleted" = false)' : ""}
    $$
    LANGUAGE SQL;
  `;
  console.log("code...", code);
  const lensDropCode = getDropLensCode(baseName);
  return { lensCode: code, lensName, lensDropCode };
}
