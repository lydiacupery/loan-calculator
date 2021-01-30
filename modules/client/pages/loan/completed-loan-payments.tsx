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
import { CompletedLoanPayment } from "./completed-loan-payment";
import * as DateTimeIso from "modules/core/date-time-iso";

type Props = {
  payments: {
    principalPayment: number;
    interestPayment: number;
    remainingPrincipal: number;
    totalPayment: number;
    dateTime: DateTimeIso.Type;
  }[];
  paymentDateText: "Paid At" | "To Be Paid At";
};

export const CompletedLoanPayments: React.FC<Props> = props => {
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
              <CompletedLoanPayment {...payment} />
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Grid>
  );
};
