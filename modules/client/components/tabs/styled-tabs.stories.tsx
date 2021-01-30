import { Box } from "@material-ui/core";
import * as React from "react";
import { StyledTab } from "./tab";
import { StyledTabs } from "./tabs";
import { mockProvider } from "modules/client/test-helpers/mock-provider";
export default {
  title: "Styled Tabs",
};

const Provider = mockProvider({});
export const Basic = () => {
  return (
    <>
      <StyledTabs value={0}>
        <StyledTab label="Upcoming Payments" />
        <StyledTab label="Past Payments" />
      </StyledTabs>
    </>
  );
};
