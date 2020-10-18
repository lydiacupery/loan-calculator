import * as Hexagonal from "atomic-object/hexagonal";
import { UserSessionPort } from "context/ports";
import { UserSessionRepository } from ".";
import { UserSessionRepositoryPort } from "./ports";

export const userSessionRepositoryAdapter = Hexagonal.adapter({
  port: UserSessionRepositoryPort,
  requires: [UserSessionPort],
  build: ctx => new UserSessionRepository(ctx),
});
