import * as Hexagonal from "modules/atomic-object/hexagonal";
import { UserSessionPort } from "modules/context/ports";
import { UserSessionRepository } from ".";
import { UserSessionRepositoryPort } from "./ports";

export const userSessionRepositoryAdapter = Hexagonal.adapter({
  port: UserSessionRepositoryPort,
  requires: [UserSessionPort],
  build: ctx => new UserSessionRepository(ctx),
});
