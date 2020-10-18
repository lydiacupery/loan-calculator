import { buildApp } from "server";
import * as throng from "throng";
import * as config from "config";
import express from "express";

const expressStaticGzip = require("express-static-gzip");

export const port = config.get<number>("server.port");

export function startServer(app: express.Express) {
  return app.listen(port, () => {
    console.info("up and running on port", port);
  });
}

const app = buildApp();
app.get("/auth/user-not-found", (req, res) => {
  res.sendFile(`${process.cwd()}/dist/index.html`);
});

// Static assets
app.use(expressStaticGzip("./dist/"));
app.use(express.static("./dist/"));

// Serve index.html for all unknown URLs
app.get(
  "/*",
  // Authentication.ensureAuthenticatedAndRedirect,
  (req, res) => {
    res.sendFile(`${process.cwd()}/dist/index.html`);
  }
);

if (config.get<boolean>("server.cluster")) {
  console.info(`Starting ${config.get<number>("server.workers")} workers`);
  throng(config.get<number>("server.workers"), () => startServer(app));
} else {
  startServer(app);
}
