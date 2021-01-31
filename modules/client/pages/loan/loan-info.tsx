import { Box, Grid, Paper, Typography } from "@material-ui/core";
import { makeStyles } from "modules/client/styles";
import * as DateTimeIso from "modules/core/date-time-iso";
import { formatUSD } from "modules/core/formatter";
import * as React from "react";

type Props = {
  principal: number;
  paymentAmount: number;
  paymentsPerYear: number;
  extraPayment: number;
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
              {formatUSD(props.principal)}
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
              {formatUSD(props.paymentAmount)}{" "}
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
        <Box m={2} />
        <Grid container justify="space-between">
          <Grid item xs={6}>
            <Typography variant="body1">Extra Payment</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1">
              {formatUSD(props.extraPayment)}
            </Typography>
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
