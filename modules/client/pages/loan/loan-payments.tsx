import {
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@material-ui/core";
import * as React from "react";
import { LoanPayment } from "./loan-payment";
import * as DateTimeIso from "modules/core/date-time-iso";
import * as DateIso from "modules/core/date-iso";

type Props = {
  payments: {
    principalPayment: number;
    interestPayment: number;
    remainingPrincipal: number;
    totalPayment: number;
    date: DateIso.Type;
  }[];
  paymentDateText: "Paid At" | "To Be Paid At";
};

export const LoanPayments: React.FC<Props> = props => {
  return (
    <Grid container style={{ background: "pink" }}>
      <Paper style={{ width: "100%" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{props.paymentDateText}</TableCell>
              <TableCell>Interest Payment</TableCell>
              <TableCell>Principal Payment</TableCell>
              <TableCell>Total Payment</TableCell>
              <TableCell>Remaining Principal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {props.payments.map(payment => (
              <LoanPayment {...payment} />
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Grid>
  );
};
