import {
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@material-ui/core";
import { useQueryBundle } from "modules/client/graphql/hooks";
import { GetLoans, LocalDate } from "modules/client/graphql/types.gen";
import { LoanRoute } from "modules/client/routes/loan";
import * as React from "react";

type Props = {
  onNavigate: (path: string) => void;
};

export const AllLoansPage: React.FC<Props> = props => {
  const loans = useQueryBundle(GetLoans);

  const onRowClick = React.useCallback(
    (loanId: string) => () => {
      const loanRoute = LoanRoute.generate(loanId);
      props.onNavigate(loanRoute);
    },
    []
  );

  if (loans.state !== "DONE") {
    return <div> LOADING </div>;
  }
  return (
    <Grid>
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Principal</TableCell>
            <TableCell>Start Date</TableCell>
            <TableCell>Payments Per Year</TableCell>
            <TableCell>Payment Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loans.data.getLoans.map(row => (
            <TableRow key={row.id} onClick={onRowClick(row.id)}>
              <TableCell component="th" scope="row">
                {row.name}
              </TableCell>
              <TableCell>{row.principal}</TableCell>
              <TableCell>{row.startAt}</TableCell>
              <TableCell>{row.paymentsPerYear}</TableCell>
              <TableCell>{row.paymentAmount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Grid>
  );
};
