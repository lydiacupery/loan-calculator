import { ApolloServer } from "apollo-server-express";
import bodyParser from "body-parser";
import cors from "cors";
import express, { Request } from "express";
import { formatError, GraphQLError } from "graphql";
import * as ErrorNotifier from "modules/atomic-object/error-notifier";
import { Logger } from "modules/atomic-object/logger";
import * as Result from "modules/atomic-object/result";
// import { userSessionValidator } from "modules/domain-servicesuser-session/validator";
import resolvers from "modules/graphql-api/resolvers";
import { rawSchema } from "modules/graphql-api/schema-base";
// import { executableSchema } from "modules/graphql-api";
import { serverConfig } from "server/config";
import {
  buildContext as defaultContextBuilder,
  ContextBuilder,
  contextFromResponseBuilder,
} from "server/context";
import morgan from "morgan";
import passport from "passport";
import * as db from "../db";
import { addAuthenticationEndpoints } from "./endpoints/authentication";
import * as Authentication from "./endpoints/authentication";
import {
  handleBrokenSessions,
  invalidCookieSessionError,
} from "./error-handling";
import { enforcePasswordIfSpecified } from "./middleware";
import { UserSession } from "modules/domain-servicesuser-session/types";

const knex = db.getConnection();
const knexLogger = require("knex-logger");
const enforce = require("express-sslify");
const cookieSession = require("cookie-session");

const theApp = express();

const getApp = (maybeApp?: express.Express) => {
  return maybeApp || theApp;
};

export function buildApp(
  buildAppContext?: ContextBuilder,
  maybeApp?: express.Express
): express.Express {
  const app = getApp(maybeApp);
  const builder = buildAppContext || defaultContextBuilder;
  const buildContext = contextFromResponseBuilder(builder);
  const buildAuthenticatedContext = Authentication.authenticatedContextBuilder(
    buildContext
  );

  app.use(
    cors({
      origin: serverConfig.server.publicHost,
      credentials: true,
      allowedHeaders: ["x-api-key"],
    })
  );

  app.use(bodyParser.json());
  app.use(
    bodyParser.urlencoded({
      extended: true,
    })
  );

  app.use(
    cookieSession({
      name: "session",
      secret: serverConfig.server.secret,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    })
  );

  // Logging
  app.use(morgan("short"));
  app.use(knexLogger(knex));

  // Force SSL.
  if (serverConfig.server.requireSsl) {
    app.use(
      enforce.HTTPS({
        trustProtoHeader: true,
      })
    );
  }

  if (serverConfig.server.basicAuthPassword) {
    app.use(enforcePasswordIfSpecified(serverConfig.server.basicAuthPassword));
  }

  // Gzip support
  // app.use(compression());

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: UserSession, done) => {
    done(null, user);
  });
  passport.deserializeUser((user: {}, done) => {
    // const maybeUser = userSessionValidator.from(user);
    const maybeUser = user as any; // todo, what should the user object look like?  make validator
    Result.isError(maybeUser)
      ? done(invalidCookieSessionError, maybeUser)
      : done(null, maybeUser);
  });

  addAuthenticationEndpoints(app, passport, builder);

  app.use(handleBrokenSessions);

  const graphqlPath = "/graphql";

  const apolloServer = new ApolloServer({
    typeDefs: rawSchema,
    resolvers,
    // Integration context for Express - we know that after `/graphql`'s other
    // middleware runs, 'context' will be on `req`.
    context: ({ req }: { req: Request }) => req.context,
    // GraphQL development web IDE
    formatError: (e: GraphQLError) => {
      Logger.error(e);
      return formatError(e);
    },
    playground: serverConfig.server.graphqlPlaygroundEnabled
      ? {
          settings: {
            "request.credentials": "include",
          },
        }
      : false,
  });

  // GraphQL authentication
  app.use(
    graphqlPath,
    buildAuthenticatedContext
    // Authentication.ensureAuthenticatedAndSetStatus
  );

  // cors: false - we already use cors above, so we don't need apolloServer to
  // apply cors settings that we already specify above. Tested by trying a
  // /graphql request from a different host - failed as expected due to cors.
  apolloServer.applyMiddleware({
    app: app as any,
    path: graphqlPath,
    cors: false,
  });

  return app;
}
