import { generatePath } from "react-router";

export namespace LoanRoute {
  export const PATH_TEMPLATE = `/loan/:loanId`;

  export const generate = (loanId: string) =>
    generatePath(PATH_TEMPLATE, { loanId });
}
