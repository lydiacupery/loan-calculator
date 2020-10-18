import { Flavor } from "helpers";

export type Maybe<T> = T | null | undefined;
export const orThrow = (message: string) => <T>(x: Maybe<T>): T => {
  if (x === undefined || x === null) {
    throw new Error(message);
  }
  return x;
};
export type UUID = Flavor<string, "A UUID">;
