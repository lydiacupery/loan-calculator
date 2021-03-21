const { buildContext } = require("modules/server/context");
const awsServerlessExpress = require("aws-serverless-express");
const { buildApp } = require("modules/server");


const binaryMimeTypes = [
  "application/octet-stream",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "font/eot",
  "font/opentype",
  "font/otf",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
];

const app = buildApp(buildContext);
const server = awsServerlessExpress.createServer(
  app,
  undefined,
  binaryMimeTypes
);

module.exports.handler = (event: any, context: any) => {
  return awsServerlessExpress.proxy(server, event, context);
};
