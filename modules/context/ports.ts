import { UserSession } from "domain-services/user-session/types";
import * as Hexagonal from "atomic-object/hexagonal";

export const UserSessionPort = Hexagonal.port<
  UserSession | null,
  "initial user session"
>("initial user session");
export type UserSessionPort = typeof UserSessionPort;
