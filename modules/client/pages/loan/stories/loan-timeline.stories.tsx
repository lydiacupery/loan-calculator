import * as React from "react";
import { storiesOf } from "@storybook/react";
import { mockProvider } from "modules/client/test-helpers/mock-provider";
import * as DateTimeIso from "modules/core/date-time-iso";
import { LoanTimeline } from "../loan-timeline";

const Provider = mockProvider({
  mocks: {
    Query: () => ({
      getLoanVersions: () => [
        {
          id: "version1",
          extraPayment: 1000,
          rate: 0.03,
          effectiveDateRange: {
            start: DateTimeIso.toIsoDateTime(new Date(2020, 1, 9)),
            end: DateTimeIso.toIsoDateTime(new Date(2020, 2, 9)),
          },
        },

        {
          id: "version2",
          extraPayment: 1000,
          rate: 0.035,
          effectiveDateRange: {
            start: DateTimeIso.toIsoDateTime(new Date(2020, 2, 10)),
            end: DateTimeIso.toIsoDateTime(new Date(2020, 5, 9)),
          },
        },

        {
          id: "version3",
          extraPayment: 1000,
          rate: 0.03,
          effectiveDateRange: {
            start: DateTimeIso.toIsoDateTime(new Date(2020, 5, 10)),
            end: DateTimeIso.toIsoDateTime(new Date()),
          },
        },
      ],
    }),
  },
});

storiesOf("Loan Timeline", module).add("Example", () => {
  return (
    <Provider>
      <LoanTimeline loanId="id" />
    </Provider>
  );
});
