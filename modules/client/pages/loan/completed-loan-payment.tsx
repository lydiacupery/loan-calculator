import { Grid, TableCell, TableRow, Typography } from "@material-ui/core";
import * as React from "react";
import * as DateTimeIso from "core/date-time-iso";

type Props = {
  principalPayment: number;
  interestPayment: number;
  dateTime: DateTimeIso.Type;
};
export const CompletedLoanPayment: React.FC<Props> = props => {
  return (
    <TableRow>
      <TableCell>
        <Typography>{props.principalPayment}</Typography>
      </TableCell>
      <TableCell>
        <Typography>{props.interestPayment}</Typography>
      </TableCell>
      <TableCell>
        <Typography>{DateTimeIso.dateFromTimestamp(props.dateTime)}</Typography>
      </TableCell>
    </TableRow>
  );
};
