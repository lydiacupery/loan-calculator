import { Grid, TableCell, TableRow, Typography } from "@material-ui/core";
import * as React from "react";
import * as DateTimeIso from "modules/core/date-time-iso";
import { formatUSD } from "modules/core/formatter";

type Props = {
  principalPayment: number;
  interestPayment: number;
  remainingPrincipal: number;
  totalPayment: number;
  dateTime: DateTimeIso.Type;
};
export const CompletedLoanPayment: React.FC<Props> = props => {
  return (
    <TableRow>
      <TableCell>
        <Typography>{DateTimeIso.dateFromTimestamp(props.dateTime)}</Typography>
      </TableCell>
      <TableCell>
        <Typography>{formatUSD(props.interestPayment)}</Typography>
      </TableCell>
      <TableCell>
        <Typography>{formatUSD(props.principalPayment)}</Typography>
      </TableCell>
      <TableCell>
        <Typography>{formatUSD(props.totalPayment)}</Typography>
      </TableCell>
      <TableCell>
        <Typography>{formatUSD(props.remainingPrincipal)}</Typography>
      </TableCell>
    </TableRow>
  );
};
