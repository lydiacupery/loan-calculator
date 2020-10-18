import {
  Grid,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@material-ui/core";
import * as React from "react";
import { CompletedLoanPayment } from "./completed-loan-payment";
import * as DateTimeIso from "core/date-time-iso";

type Props = {
  completedPayments: {
    principalPayment: number;
    interestPayment: number;
    paidAt: DateTimeIso.Type;
  }[];
};

export const CompletedLoanPayments: React.FC<Props> = props => {
  return (
    <>
      <TableHead>
        <TableRow>
          <TableCell>Principal Payment</TableCell>
          <TableCell>Interest Payment</TableCell>
          <TableCell>Paid At</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {props.completedPayments.map(payment => (
          <CompletedLoanPayment {...payment} />
        ))}
      </TableBody>
    </>
  );
};
