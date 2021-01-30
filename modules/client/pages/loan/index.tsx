import {
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TabsProps,
  Typography,
} from "@material-ui/core";
import { useQueryBundle } from "modules/client/graphql/hooks";
import { GetLoan, GetLoans, LocalDate } from "modules/client/graphql/types.gen";
import { makeStyles } from "modules/client/styles";
import { database } from "faker";
import * as React from "react";
import { CompletedLoanPayments } from "./completed-loan-payments";
import { LoanInfo } from "./loan-info";
import * as DateTimeIso from "modules/core/date-time-iso"
import { StyledTabs } from "modules/client/components/tabs/tabs";
import { StyledTab } from "modules/client/components/tabs/tab";
import { isNil } from "lodash-es";

type Props = {
  loanId: string;
};


export const LoanPage: React.FC<Props> = props => {
  const classes = useStyles()
  const [selectedTab, setSelectedTab] = React.useState<"upcoming" | "past">("upcoming")
  const loan = useQueryBundle(GetLoan, {
    variables: {
      loanId: props.loanId,
      effectiveDateTime: DateTimeIso.toIsoDateTime(new Date(2021, 1, 9))
    },
  });

  const handleSelectedTabChange: TabsProps["onChange"] = React.useCallback((event: any, newValue?: "upcoming" | "past") => {
    if(!isNil(newValue)) {
      setSelectedTab(newValue)
    }
  })


  if (loan.state !== "DONE" || !loan.data.getLoan) {
    return <div> LOADING </div>;
  }

  const loanInfo = loan.data.getLoan
  return (
    <Grid>
      <Paper className={classes.paper} >
        <Typography variant="h3">{loan.data.getLoan?.name}</Typography>
      </Paper>
      <Box m={6} />
      <Grid container wrap="nowrap" direction="column" alignContent="flex-start" >
        <Grid item container>
          <Grid item xs={1}></Grid>

          <Grid item container xs={10}>
            <Grid item container >
              <LoanInfo principal={loanInfo.principal} paymentAmount={loanInfo.paymentAmount} paymentsPerYear={loanInfo.paymentsPerYear} startAt={loanInfo.startAt} extraPayment={loanInfo.extraPayment} />
            </Grid>

            <Box m={3} />

            <Grid item container >
              <StyledTabs value={selectedTab} onChange={handleSelectedTabChange}>
                <StyledTab label="Upcoming Payments" value="upcoming"></StyledTab>
                <StyledTab label="Past Payments" value="past"></StyledTab>
              </StyledTabs>
            </Grid>
            <Box m={6} />

            {selectedTab === "upcoming" ? 
                <CompletedLoanPayments payments={loan.data.getLoan.remainingPayments} paymentDateText="To Be Paid At" />
              :
                <CompletedLoanPayments payments={loan.data.getLoan.completedPayments} paymentDateText="Paid At" />
            }
          </Grid>
          <Grid item xs={1}></Grid>
        </Grid>
      </Grid>

    </Grid>)
};

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.typography.pxToRem(20)
  }
}))