import { MuiThemeProvider } from "@material-ui/core";
import { ThemeProvider } from "@material-ui/styles";
import { ENGLISH, TranslationProvider } from "modules/client/translations";
import * as React from "react";
import { BrowserRouter } from "react-router-dom";
import { PlacementTheme } from "./styles/mui-theme";

export const withTheme = (s: any) => (
  <MuiThemeProvider theme={PlacementTheme}>
    <ThemeProvider theme={PlacementTheme}>{s()}</ThemeProvider>
  </MuiThemeProvider>
);

export const withI18n = (s: any) => (
  <TranslationProvider value={ENGLISH}>{s()}</TranslationProvider>
);
