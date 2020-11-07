import * as Hexagonal from "atomic-object/hexagonal";
import * as DateTimeIso from "core/date-time-iso";

export class CurrentEffectiveDateTime {
  constructor(private currentEffectiveDateTime: DateTimeIso.Type) {}
  getCurrentEffectiveDateTime(): DateTimeIso.Type {
    return this.currentEffectiveDateTime;
  }

  setCurrentEffectiveDateTime(effectiveDateTime: DateTimeIso.Type): void {
    this.currentEffectiveDateTime = effectiveDateTime;
  }
}

export const CurrentEffectiveDateTimePort = Hexagonal.port<
  CurrentEffectiveDateTime | null,
  "CurrentEffectiveDateTime"
>("CurrentEffectiveDateTime");
export type CurrentEffectiveDateTimePort = typeof CurrentEffectiveDateTimePort;
