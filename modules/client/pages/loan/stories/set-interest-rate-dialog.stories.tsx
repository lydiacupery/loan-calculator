import * as React from "react";
import { storiesOf } from "@storybook/react";
import { mockProvider } from "modules/client/test-helpers/mock-provider";
import * as DateTimeIso from "modules/core/date-time-iso";
import { SetInterestRateDialog } from "../components/set-interest-rate-dailog";

const Provider = mockProvider({});

storiesOf("Set Interest Rate Dialog", module).add("Example", () => {
  return (
    <Provider>
      <SetInterestRateDialog loanId="id" currentRate={0.04} />
    </Provider>
  );
});
