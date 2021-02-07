import { UserSession } from "modules/domain-services/user-session/types";
import * as Hexagonal from "modules/atomic-object/hexagonal";

export const UserSessionPort = Hexagonal.port<
  UserSession | null,
  "initial user session"
>("initial user session");
export type UserSessionPort = typeof UserSessionPort;
