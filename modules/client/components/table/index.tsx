import * as React from "react";
import { Column, useTable } from "react-table";
import { ItemData } from "./Item";
import { TableContent } from "./content";
import * as DateTimeIso from "modules/core/date-time-iso";
import { ItemType } from "./types";

const columns: Column<ItemType>[] = [
  {
    Header: "Name",
    columns: [
      {
        Header: "First Name",
        accessor: "firstName",
      },
      {
        Header: "Last Name",
        accessor: "lastName",
      },
      {
        Header: "Suffix",
        accessor: "suffix",
      },
    ],
  },
  {
    Header: "Job Title",
    accessor: "jobTitle",
  },
  {
    Header: "Date Created",
    id: "createdAt",
    accessor: row => DateTimeIso.dateFromTimestamp(row.createdAt),
  },
];

type Props = {
  // are there still more items to load?
  hasNextPage: boolean;
  // items loaded so far
  items: ItemType[];
  // Callback function that knows how to load more items
  loadMoreItems: (startIndex: number, stopIndex: number) => Promise<any>;
  //Callback function determining if the item at an index is loaded
  isItemLoaded: (index: number) => boolean;
  scrollState: {
    rowIndex: number;
    columnIndex: number;
  };
  setScrollRowAndColumn: (rowIndex: number, columnIndex: number) => void;
  totalCount: number;
};

export const Table: React.FunctionComponent<Props> = props => {
  const {
    hasNextPage,
    items,
    loadMoreItems,
    isItemLoaded,
    scrollState,
    setScrollRowAndColumn,
    totalCount,
  } = props;

  const itemCount = hasNextPage ? items.length + 1 : items.length;

  // using react table, could pull this up a level
  const { headers, rows, prepareRow } = useTable({
    data: items,
    columns: columns,
  });

  const itemData: ItemData = React.useMemo(
    () => ({
      headers,
      rows,
      prepareRow,
    }),
    [headers, rows, prepareRow]
  );
  return (
    <TableContent
      hasNextPage={hasNextPage}
      loadMoreItems={loadMoreItems}
      isItemLoaded={isItemLoaded}
      scrollState={scrollState}
      setScrollRowAndColumn={setScrollRowAndColumn}
      itemCount={totalCount}
      itemData={itemData}
      columnCount={columns.length}
    />
  );
};
