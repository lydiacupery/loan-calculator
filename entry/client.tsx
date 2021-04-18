import { AnalyticsProvider } from "modules/client/analytics";
import * as GALoader from "modules/client/analytics/load-ga";
import "modules/client/bootstrap-mui"; // this must be the first import
import { buildGraphqlClient } from "modules/client/graphql/client";
import * as ErrorNotifier from "modules/atomic-object/error-notifier";
import { createBrowserHistory } from "history";
import * as React from "react";

import * as ReactDom from "react-dom";
import { Router } from "react-router-dom";
import { App } from "../modules/client";
import { ApolloProvider } from "@apollo/react-common";

const history = createBrowserHistory();
history.listen((location, action) => {
  if (process.env.TRACKING_ID) {
    window.ga("send", "pageview", location.pathname + location.search);
  }
});

const bootstrapClient = () => {
  if (process.env.TRACKING_ID) {
    GALoader.loadGA();
  }

  ErrorNotifier.setup(process.env.ROLLBAR_CLIENT_ACCESS_TOKEN, {
    captureUncaught: false,
    captureUnhandledRejections: false,
  });

  window.onerror = (message, filename?, lineno?, colno?, error?) => {
    console.error("OnError: ", message, error);
    ErrorNotifier.error(message, error);
    history.push("/error");
  };

  window.onunhandledrejection = (event: any) => {
    const error = event.reason;
    console.error("OnUnhandledRejection: ", error);
    ErrorNotifier.error(error);
    history.push("/error");
  };

  const graphqlClient = buildGraphqlClient(history);

  const rootEl = (
    <ApolloProvider client={graphqlClient}>
      <AnalyticsProvider
        value={{
          engine: function() {
            return window.ga.apply(window, arguments);
          },
        }}
      >
        <Router history={history}>
          <App />
        </Router>
      </AnalyticsProvider>
    </ApolloProvider>
  );
  ReactDom.render(
    (rootEl as any) as React.ReactElement<any>,
    document.getElementById("app")
  );
};

bootstrapClient();
