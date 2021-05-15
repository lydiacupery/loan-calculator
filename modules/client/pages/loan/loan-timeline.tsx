import { Typography } from "@material-ui/core";
import { Timeline, TimelineContent, TimelineItem } from "@material-ui/lab";
import { useQueryBundle } from "modules/client/graphql/hooks";
import { GetLoanVersions } from "modules/client/graphql/types.gen";
import React from "react";

type Props = {
  loanId: string;
};
export const LoanTimeline: React.FC<Props> = props => {
  const versions = useQueryBundle(GetLoanVersions, {
    variables: { loanId: props.loanId },
  });
  if (versions.state !== "DONE") {
    return <></>;
  }
  return (
    <Timeline>
      <TimelineItem>
        <TimelineContent>
          <Typography>HELLO</Typography>
        </TimelineContent>
      </TimelineItem>
    </Timeline>
  );
};
