import { Row } from "exceljs";
import { trim } from "lodash-es";

export const buildAssertColumnHeader = (excelRow: Row) => (args: {
  columnIndex: number;
  expectedHeaderText: string;
}): void => {
  if (
    excelRow
      .getCell(args.columnIndex)
      .value!.toString()
      .trim()
      .toUpperCase() !== args.expectedHeaderText.toUpperCase()
  ) {
    throw new Error(
      `${args.expectedHeaderText} not in expected order.  Found ${excelRow
        .getCell(args.columnIndex)
        .value!.toString()
        .trim()
        .toUpperCase()}`
    );
  }
};

type ColumnGetterParams = {
  columnIndex: number;
} & (
  | {
      isRequired: true;
    }
  | { isRequired: false; defaultValue: string });
export const columnGetterForRow: (
  excelRow: Row
) => (args: ColumnGetterParams) => string = excelRow => {
  return args => {
    const cellValue = excelRow.getCell(args.columnIndex).value;
    if (cellValue === null || cellValue === "") {
      if (args.isRequired) {
        throw new Error(
          `Column ${args.columnIndex} was empty for row ${excelRow}`
        );
      }
      return args.defaultValue;
    }
    return trim(cellValue.toString()).toString();
  };
};
