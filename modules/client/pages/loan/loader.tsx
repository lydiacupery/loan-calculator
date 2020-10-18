import * as React from "react";
import { asyncComponent } from "react-async-component";
import { RouteComponentProps } from "react-router";

type Props = {
  loanId: string;
};
export const LoanPageLoader = asyncComponent({
  resolve: async () => {
    const { LoanPage } = await import("./index");
    return function Resolved(props: RouteComponentProps<Props>) {
      return <LoanPage {...props.match.params} />;
    };
  },
  name: "Loan",
});
