import { ErrorRequestHandler } from "express";

export const sessionError = "SessionError";
export const invalidCookieSessionError = "InvalidCookieSessionError";
const sessionErrors = [sessionError, invalidCookieSessionError];

export const handleBrokenSessions: ErrorRequestHandler = (
  err,
  req,
  res,
  next
) => {
  if (res.headersSent) return next(err);
  if (err && sessionErrors.includes(err.toString())) {
    req.logout();
    res.status(403);
    return res.send(JSON.stringify({ error: err.toString() }));
    console.error("Logging user out due to a broken session cookie");
  } else {
    next();
  }
};
