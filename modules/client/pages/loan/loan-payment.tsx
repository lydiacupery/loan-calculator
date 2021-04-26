import {
  Button,
  FormControl,
  Grid,
  TableCell,
  TableRow,
  Typography,
} from "@material-ui/core";
import * as React from "react";
import * as DateTimeIso from "modules/core/date-time-iso";
import * as DateIso from "modules/core/date-iso";
import { formatUSD } from "modules/core/formatter";
import { Field, Form, Formik } from "formik";
import { MakePayment, Payment } from "modules/client/graphql/types.gen";
import * as IsoDateTime from "modules/core/date-time-iso";
import { useForm } from "modules/atomic-object/forms/use-form";
import * as FMUI from "formik-material-ui";
import { toNumber } from "lodash";
import { StringFormatDefinition } from "ajv";
import { PaymentButton } from "./components/payment-button";
import { RemoveButton } from "./components/remove-button";

type Props = {
  principalPayment: number;
  interestPayment: number;
  remainingPrincipal: number;
  totalPayment: number;
  date: DateIso.Type;
  showPaymentButton?: boolean;
  showRemoveButton?: boolean;
  loanId: string;
  paymentId: string;
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
      <TableCell>
        {props.showRemoveButton && <RemoveButton paymentId={props.paymentId} />}
      </TableCell>
      <TableCell>
        {props.showPaymentButton && (
          <PaymentButton
            initialPaymentAmount={props.totalPayment}
            loanId={props.loanId}
          />
        )}
      </TableCell>
    </TableRow>
  );
};
