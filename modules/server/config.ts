const config = require("config");

// add configs needed on the server to thiss type
type ConfigType = {
  environment: string;
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
  environment: process.env.NODE_ENV!,
  server: {
    apiHost: process.env.API_HOST || "localhost:3001",
    publicHost: process.env.PUBLIC_HOST || "localhost:3000",
    secret: process.env.BASIC_AUTH_PASSWORD || "",
    requireSsl: process.env.REQUIRE_SSL !== "false" || true,
    basicAuthPassword: process.env.BASIC_AUTH_PASSWORD || null,
    graphqlPlaygroundEnabled: true,
  },
};
