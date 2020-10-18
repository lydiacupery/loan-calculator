import * as React from "react";
import { Row } from "react-table";
import { GridChildComponentProps } from "react-window";
import { ItemType } from "./types";

export type ItemData = {
  rows: Row<ItemType>[];
  prepareRow: (row: Row<ItemType>) => void;
};

export const Item: React.FunctionComponent<
  Omit<GridChildComponentProps, "data"> & {
    data: ItemData;
  }
> = React.memo(
  props => {
    const { rowIndex, columnIndex, data, style } = props;
    const { rows, prepareRow } = data;
    // get row
    const row = rows[rowIndex];
    if (!row) {
      return <div style={style}> LOADING... </div>;
    }

    if (!row.getRowProps) {
      prepareRow(row);
    }

    const cell = row.cells[columnIndex];
    // return (
    //   <div style={style}>
    //     HELLO R-{rowIndex}, C-{columnIndex}
    //   </div>
    // );
    return <div {...cell.getCellProps({ style })}>{cell.render("Cell")}</div>;
    // return (
    //   <div style={style}>
    //     HELLO R{rowIndex} C{columnIndex}
    //   </div>
    // );
    // return (
    //   <div style={style}>
    //     HELLO {rowIndex},{columnIndex}
    //   </div>
    // );
  },
  (prev, curr) => {
    const prevCell =
      prev.data.rows[prev.rowIndex] &&
      prev.data.rows[prev.rowIndex].cells[prev.columnIndex];
    const currCell =
      prev.data.rows[prev.rowIndex] &&
      prev.data.rows[prev.rowIndex].cells[prev.columnIndex];
    return prevCell === currCell && prev.style === curr.style;
  }
);
