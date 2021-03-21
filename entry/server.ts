import { buildApp } from "modules/server";
import throng from "throng";
import config from "config";
import express from "express";

const expressStaticGzip = require("express-static-gzip");

export const port = process.env.PORT || 3001;

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

if (parseInt(process.env.CONCURRENCY || '0') > 1) {
  console.info(`Starting ${parseInt(process.env.CONCURRENCY || '0')} workers`);
  throng(parseInt(process.env.CONCURRENCY || '0'), () => startServer(app));
} else {
  startServer(app);
}
