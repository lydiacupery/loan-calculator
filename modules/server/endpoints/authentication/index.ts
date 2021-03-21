// import * as Result from "modules/atomic-object/result";

// import { UserSessionPort } from "modules/context/ports";
// import { UserSessionRepositoryPort } from "modules/domain-services/user-session/ports";
// import { UserSession } from "modules/domain-services/user-session/types";

// // This import wants to use "@types/express-serve-static-core" for types only,
// // which is at a later version than npm "express-serve-static-core".
// // eslint-disable-next-line import/no-unresolved
// import * as core from "express-serve-static-core";
// import passportLocal from "passport-local";
// import { serverConfig } from "modules/server/config";
// import { ContextBuilder } from "modules/server/context";
// import { devLoginForm } from "./development-login";

// export function addAuthenticationEndpoints(
//   app: core.Express,
//   passport: any,
//   contextBuilder: ContextBuilder
// ) {
//   // const audience = serverConfig.auth.issuerUrl;
//   // const clientID = serverConfig.auth.clientId;
//   // const { callbackPath } = serverConfig.auth;
//   // const { clientSecret } = serverConfig.auth;
//   const baseUrl = serverConfig.server.apiHost;
//   const callbackURL = baseUrl + callbackPath;
//   const { publicHost } = serverConfig.server;
//   const ctx = contextBuilder();

//   const enableDeveloperLogin =
//     serverConfig.environment === "development" ||
//     serverConfig.environment === "test";

//   // POST - see https://stackoverflow.com/questions/3521290/logout-get-or-post
//   app.post(
//     "/auth/login",
//     (req, res, next) => {
//       if (req.body && req.body.redirectUri) {
//         saveUrlToSession(req, req.body.redirectUri);
//       }
//       if (enableDeveloperLogin) {
//         return res.redirect("/auth/development-login");
//       }
//       next();
//     },
//     passport.authenticate("okta") // Redirects to okta url
//   );

//   if (enableDeveloperLogin) {
//     const devStrategy = new passportLocal.Strategy(
//       { passReqToCallback: true },
//       (req, username, password, done) => {
//         const userSession: UserSession = {
//           provider: "local",
//           firstName: req.body.firstname,
//           lastName: req.body.lastname,
//         };
//         done(null, userSession);
//       }
//     );

//     passport.use("dev", devStrategy);

//     app.get("/auth/development-login", (req, res) => {
//       res.send(devLoginForm());
//     });

//     app.post(
//       "/auth/development-login",
//       passport.authenticate("dev", {
//         failureRedirect: "/",
//       }),
//       (req, res, _next) => {
//         const url = getAndClearLoginRedirectUrl(req);
//         return res.redirect(url);
//       }
//     );
//   }

//   app.post("/auth/logout", async (req, res) => {
//     // Clear user session
//     const authenticatedCtx = ctx.clone(c =>
//       c.add(UserSessionPort, () => ({ ...req.user } as UserSession))
//     ); // { userSession: { ...req!.user } });
//     const repo = authenticatedCtx.get(UserSessionRepositoryPort);
//     // await repo.delete();  // should we remove user ctx?

//     req.logout();
//     res.redirect(`${publicHost}/login`);
//   });
// }

// // todo, all these copied over, not sure which ones I'll actually need
export const authenticatedContextBuilder = (buildContextForResponse: any) => (
  req: Express.Request,
  res: Express.Response,
  next: any
) => {
  if (req.user) {
    // The JSON Schema validator used below provides _almost_ good enough
    // validation. It doesn’t constrain abilities to only known abilities.
    // The unsafeCastUserSession should be removed when we have time.
    const userSession = req.user as any;
    const context = buildContextForResponse(res, { userSession });
    req.context = context;
  } else {
    const context = buildContextForResponse(res);
    req.context = context;
  }
  return next();
};

// /** Save url to to req.session.unauthenticatedUrlRequest.
//  * @param {originalUrl} Ex.: `/manage-data`, query params are allowed
//  */
// export function saveUrlToSession(req: Express.Request, originalUrl: string) {
//   if (originalUrl.match(/^http/)) {
//     if (__DEV__) {
//       // Debug-assert to catch dev errors, handle gracefully in production
//       throw new Error(
//         `Urls to redirect must not contain the origin, only the path onward. originalUrl is ${originalUrl}`
//       );
//     }

//     return;
//   }
//   // Safety check - all auth routes are excluded
//   if (originalUrl.startsWith("/auth")) {
//     return;
//   }

//   if (req && req.session) {
//     req.session.unauthenticatedUrlRequest = originalUrl;
//     req.session.unauthenticatedUrlRequestTimeout = Date.now() + 60 * 5 * 1000;
//   }
// }

// // use the saved URL when re-directing (fall back to root)
// export function getAndClearLoginRedirectUrl(req: Express.Request) {
//   if (
//     req &&
//     req.session &&
//     req.session.unauthenticatedUrlRequest &&
//     req.session.unauthenticatedUrlRequestTimeout &&
//     req.session.unauthenticatedUrlRequestTimeout > Date.now()
//   ) {
//     const url = req.session.unauthenticatedUrlRequest;
//     req.session.unauthenticatedUrlRequest = null;
//     req.session.unauthenticatedUrlRequestTimeout = 0;
//     if (url.match(/^http/)) {
//       if (__DEV__) {
//         // Debug-assert to catch dev errors, handle gracefully in production
//         throw new Error(
//           `Url invalid for redirection, must not contain the origin, url is "${url}"`
//         );
//       }
//       return "/";
//     }
//     return url;
//   }
//   return "/";
// }

// export function ensureAuthenticatedAndSetStatus(req: any, res: any, next: any) {
//   try {
//     if (req.isAuthenticated()) {
//       return next();
//     } else {
//       res.status(403);
//       res.send({ error: "User not authenticated." });
//     }
//   } catch (e) {
//     try {
//       req.logout();
//     } catch (e2) {
//       res.status(403);
//       return res.send({
//         error: "Cannot logout",
//       });
//     }
//     res.status(403);
//     return res.send({
//       error: "Unknown Error",
//     });
//   }
// }
