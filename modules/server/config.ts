const config = require("config");

// add configs needed on the server to thiss type
type ConfigType = {
  environment: "development" | "production" | "test";
  auth: {
    issuerUrl: string;
    clientId: string;
    clientSecret: string;
    callbackPath: string;
  };
  server: {
    apiHost: string;
    publicHost: string;
    secret: string;
    requireSsl: boolean;
    basicAuthPassword: null | string;
    graphqlPlaygroundEnabled: boolean;
  };
};

export const serverConfig: ConfigType = {
  environment: config.get("environment"),
  auth: {
    issuerUrl: config.has("auth.issuerUrl")
      ? config.get("auth.issuerUrl")
      : "default",
    clientId: config.has("auth.clientId")
      ? config.get("auth.clientId")
      : "default",
    clientSecret: config.has("auth.clientSecret", "")
      ? config.get("auth.clientSecret")
      : "default",
    callbackPath: config.has("auth.callbackPath")
      ? config.get("auth.callbackPath")
      : "default",
  },
  server: {
    apiHost: config.get("server.apiHost"),
    publicHost: config.get("server.publicHost"),
    secret: config.get("server.secret"),
    requireSsl: config.get("server.requireSsl"),
    basicAuthPassword: config.get("server.basicAuthPassword"),
    graphqlPlaygroundEnabled: config.get("server.graphqlPlaygroundEnabled"),
  },
};
