import { Grid, TableCell, TableRow, Typography } from "@material-ui/core";
import * as React from "react";
import * as DateTimeIso from "modules/core/date-time-iso";
import * as DateIso from "modules/core/date-iso";
import { formatUSD } from "modules/core/formatter";

type Props = {
  principalPayment: number;
  interestPayment: number;
  remainingPrincipal: number;
  totalPayment: number;
  date: DateIso.Type;
};
export const LoanPayment: React.FC<Props> = props => {
  return (
    <TableRow>
      <TableCell>
        <Typography>{DateIso.formatLongDayMonthYear(props.date)}</Typography>
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
