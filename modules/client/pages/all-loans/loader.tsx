import * as React from "react";
import { asyncComponent } from "react-async-component";
import { RouteComponentProps } from "react-router";

type Props = {};
export const AllLoansPageLoader = asyncComponent({
  resolve: async () => {
    const { AllLoansPage: AllLoansPage } = await import("./index");
    return function Resolved(props: RouteComponentProps<Props>) {
      const onNavigate = React.useCallback(
        (path: string): void => {
          props.history.push(path);
        },
        [props.history]
      );
      return <AllLoansPage {...props.match.params} onNavigate={onNavigate} />;
    };
  },
  name: "AllLoans",
});
