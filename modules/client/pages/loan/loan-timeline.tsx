import { Box, Grid, Paper, Typography } from "@material-ui/core";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from "@material-ui/lab";
import { useQueryBundle } from "modules/client/graphql/hooks";
import { GetLoanVersions } from "modules/client/graphql/types.gen";
import { makeStyles } from "modules/client/styles";
import * as DateTimeIso from "modules/core/date-time-iso";
import { formatPercentage, formatUSD } from "modules/core/formatter";
import React from "react";

type Props = {
  loanId: string;
};
export const LoanTimeline: React.FC<Props> = props => {
  const versions = useQueryBundle(GetLoanVersions, {
    variables: { loanId: props.loanId },
  });
  const classes = useStyles();
  if (versions.state !== "DONE") {
    return <></>;
  }
  return (
    <Grid container direction="column">
      <Paper className={classes.paper}>
        <Typography variant="h6">Loan Timeline</Typography>
        <Timeline>
          {versions.data.getLoanVersions.map(v => (
            <TimelineItem>
              <TimelineOppositeContent>
                <Typography align="right">
                  {DateTimeIso.toSlashyDate(v.effectiveDateTimeRange.start)}
                  {v.effectiveDateTimeRange.end
                    ? ` to ${DateTimeIso.toSlashyDate(
                        v.effectiveDateTimeRange.end
                      )}`
                    : " onward"}
                </Typography>
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color="primary"></TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Grid
                  direction="column"
                  alignContent="flex-start"
                  justify="flex-start"
                >
                  <Typography>
                    Extra payment of {formatUSD(v.extraPayment)}
                  </Typography>
                  <Typography>Rate of {formatPercentage(v.rate)}</Typography>
                </Grid>
                <Box m={2} />
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </Paper>
    </Grid>
  );
};

const useStyles = makeStyles(theme => ({
  paper: {
    padding: theme.typography.pxToRem(20),
  },
}));
