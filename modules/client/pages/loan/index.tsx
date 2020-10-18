import {
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
  return ( <Grid>
  <Paper className={classes.paper} >
    <Grid container direction="column">
    <Typography variant="h3">{loan.data.getLoan?.name}</Typography>
    <Typography variant="body1">Loan started on {loan.data.getLoan?.startAt}. </Typography>
    <Typography variant="body1">Loan total amount is {loan.data.getLoan?.principal}. </Typography>
    <Typography variant="body1">With payment amount of {loan.data.getLoan?.paymentAmount}. </Typography>
    <Typography variant="body1">With {loan.data.getLoan?.paymentsPerYear} payments per year. </Typography>

    </Grid>
  </Paper>
  <CompletedLoanPayments completedPayments={loan.data.getLoan.completedPayments}/>
  </Grid>)
};

const useStyles = makeStyles((theme) => ({
  paper: {
    padding:theme.typography.pxToRem(20) 
  }
}))