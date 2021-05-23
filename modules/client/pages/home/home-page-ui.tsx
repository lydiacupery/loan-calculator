import { Grid, Paper, Typography } from "@material-ui/core";
import { ButtonLink } from "modules/client/components/button-link";
import { makeStyles } from "modules/client/styles";
import * as React from "react";

export interface HomePageUIProps {
  name: string;
  currentCount: number;
  onClick?: () => void;
}

export function HomePageUI(props: HomePageUIProps) {
  const [resetting, setResetting] = React.useState(false);
  const classes = useStyles();

  return (
    <>
      <Grid container direction="row">
        <Grid item xs={6}>
          <Paper className={classes.paper}>
            <Typography>This page will eventually be replaced.</Typography>
            <Typography>See these links:</Typography>
            <ul>
              <li>
                <ButtonLink to={`/error/`}>Error Page</ButtonLink>
              </li>
              <li>
                <ButtonLink to={`/loans/`}>Loans</ButtonLink>
              </li>
            </ul>
          </Paper>
        </Grid>
        <Grid item xs={6} />
      </Grid>
    </>
  );
}

const useStyles = makeStyles(theme => ({
  paper: {
    padding: theme.spacing(2),
    margin: theme.spacing(2),
  },
}));
