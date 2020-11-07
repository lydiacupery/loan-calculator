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
import { LoanInfo } from "./loan-info";

type Props = {
  loanId: string;
};

export const LoanPage: React.FC<Props> = props => {
  const classes = useStyles()
  const loan = useQueryBundle(GetLoan, {
    variables: {
      loanId: props.loanId,
    },
  });


  if (loan.state !== "DONE" || !loan.data.getLoan) {
    return <div> LOADING </div>;
  }

  const loanInfo = loan.data.getLoan
  return (
    <Grid>
  <Paper className={classes.paper} >
    <Typography variant="h3">{loan.data.getLoan?.name}</Typography>
  </Paper>
    <Box m={6}/>
    <Grid container wrap="nowrap" direction="column" alignContent="flex-start" >
      <Grid item  container  >
        <Grid item xs={1}/>
        <Grid item container xs={10}>
        <LoanInfo principal={loanInfo.principal} paymentAmount={loanInfo.paymentAmount} paymentsPerYear={loanInfo.paymentsPerYear} startAt={loanInfo.startAt}/>
        </Grid>
        <Grid item xs={1}/>
      </Grid>

    <Box m={6}/>
      <Grid item container >
        <Grid xs={1}/>
        <Grid item container xs={10} style={{background: "red"}} >
        <CompletedLoanPayments completedPayments={loan.data.getLoan.completedPayments}/>
        </Grid>
        <Grid xs={1}/>
      </Grid>
    </Grid>
  </Grid>)
};

const useStyles = makeStyles((theme) => ({
  paper: {
    padding:theme.typography.pxToRem(20) 
  }
}))