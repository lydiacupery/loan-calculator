import { Tabs, TabsProps } from "@material-ui/core";
import { makeStyles } from "client/styles";
import * as React from "react";
export const StyledTabs: React.FC<TabsProps> = props => {
  const styledTabsClasses = useStyledTabs();
  return (
    <Tabs
      {...props}
      classes={{ indicator: styledTabsClasses.indicator }}
      TabIndicatorProps={{ children: <span /> }}
    >
      {props.children}
    </Tabs>
  );
};

const useStyledTabs = makeStyles(theme => ({
  indicator: {},
}));
