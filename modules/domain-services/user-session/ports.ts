import * as Hexagonal from "atomic-object/hexagonal";
import { UserSessionRepository } from ".";

export const UserSessionRepositoryPort = Hexagonal.port<
  UserSessionRepository,
  "UserSessionRepositoryPort"
>("UserSessionRepositoryPort");
export type UserSessionRepositoryPort = typeof UserSessionRepositoryPort;
