import {
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@material-ui/core";
import { useQueryBundle } from "client/graphql/hooks";
import { GetLoan, GetLoans, LocalDate } from "client/graphql/types.gen";
import { makeStyles } from "client/styles";
import { database } from "faker";
import * as React from "react";
import { CompletedLoanPayments } from "./completed-loan-payments";
import * as DateTimeIso from "core/date-time-iso";

type Props = {
  principal: number;
  paymentAmount: number;
  paymentsPerYear: number;
  startAt: DateTimeIso.Type;
};

export const LoanInfo: React.FC<Props> = props => {
  const classes = useStyles();
  return (
    <Grid container direction="column">
      <Paper className={classes.paper}>
        <Typography variant="h6">Loan Info</Typography>
        <Box m={2} />
        <Grid item container>
          <Grid item xs={6}>
            <Typography variant="body1">Started on</Typography>
          </Grid>
          <Grid item>
            <Typography variant="body1">
              {DateTimeIso.dateFromTimestamp(props.startAt)}
            </Typography>
          </Grid>
        </Grid>
        <Box m={2} />
        <Grid container justify="space-between">
          <Grid item xs={6}>
            <Typography variant="body1">Total amount</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1">
              {Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(props.principal)}
            </Typography>
          </Grid>
        </Grid>
        <Box m={2} />
        <Grid container justify="space-between">
          <Grid item xs={6}>
            <Typography variant="body1">Payment amount</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1">
              {Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(props.paymentAmount)}{" "}
            </Typography>
          </Grid>
        </Grid>
        <Box m={2} />
        <Grid container justify="space-between">
          <Grid item xs={6}>
            <Typography variant="body1">Payments per year</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1">{props.paymentsPerYear}</Typography>
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  );
};

const useStyles = makeStyles(theme => ({
  paper: {
    padding: theme.typography.pxToRem(20),
  },
}));
