import { Box, Paper, Typography } from "@material-ui/core";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
} from "@material-ui/lab";
import { useQueryBundle } from "modules/client/graphql/hooks";
import { GetLoanVersions } from "modules/client/graphql/types.gen";
import { makeStyles } from "modules/client/styles";
import * as DateTimeIso from "modules/core/date-time-iso";
import React from "react";

type Props = {
  loanId: string;
};
export const LoanTimeline: React.FC<Props> = props => {
  const versions = useQueryBundle(GetLoanVersions, {
    variables: { loanId: props.loanId },
  });
  const classes = useStyles();
  console.log("----versions", versions);
  if (versions.state !== "DONE") {
    return <></>;
  }
  return (
    <Timeline>
      {versions.data.getLoanVersions.map(v => (
        <TimelineItem>
          <TimelineContent>
            <Typography align="right">
              {DateTimeIso.toSlashyDate(v.effectiveDateTimeRange.start)} to{" "}
              {v.effectiveDateTimeRange.end
                ? DateTimeIso.toSlashyDate(v.effectiveDateTimeRange.end)
                : "infinity"}
            </Typography>
          </TimelineContent>
          <TimelineSeparator>
            <TimelineDot></TimelineDot>
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>
            <Paper className={classes.paper}>
              <Box m={1} />
              <Typography>Extra payment of {v.extraPayment}</Typography>
              <Typography>Rate of {v.rate}</Typography>
              <Box m={1} />
            </Paper>
            <Box m={2} />
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};

const useStyles = makeStyles(theme => ({
  paper: {
    padding: `${theme.typography.pxToRem(6)} ${theme.typography.pxToRem(16)}`,
  },
}));
