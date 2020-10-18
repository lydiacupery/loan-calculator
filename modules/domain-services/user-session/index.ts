import { UserSessionPort } from "context/ports";
import { orThrow as baseOrThrow } from "core";
// import { MutableUserSessionStoragePort } from "../store/ports";
import * as Hexagonal from "atomic-object/hexagonal";

type ServiceContext = Hexagonal.Context<UserSessionPort>;

export class UserSessionRepository {
  constructor(private ctx: ServiceContext) {}

  get userSessionPort() {
    return orThrow(this.ctx.get(UserSessionPort));
  }

  get sessionKey() {
    return `UserSession:${this.firstName}${this.lastName}`;
  }

  // Simple Immutable Session Passthrough Functions
  // ===========================================================================

  // clear = async (): Promise<any> =>
  //   await this.userSessionPort.delete(this.sessionKey);

  firstName = () => this.userSessionPort.firstName;
  lastName = () => this.userSessionPort.lastName;

  // delete = async () => {
  //   await this.mutableSessionPort.delete(this.sessionKey);
  // };
}

const orThrow = baseOrThrow("Session Port was missing");
