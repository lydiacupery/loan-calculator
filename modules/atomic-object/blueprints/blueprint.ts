import { identity } from "lodash-es";
import { newHelloFunction } from "packages/entropy";
import { Entropy, hashInt } from "modules/entropy";

const blah = newHelloFunction();

type DesignFn<T, P extends keyof T> = (x: Entropy) => PromiseLike<T[P]> | T[P];
type BlueprintDesign<T> = {
  [P in keyof T]: T[P] | Promise<T[P]> | DesignFn<T, P>;
};
type PartialBlueprint<T> = { [P in keyof T]?: PartialBlueprint<T[P]> };

const prng = new Entropy(hashInt(process.pid));

export class Blueprint<TConverted, TInput = TConverted> {
  constructor(
    public readonly blueprintDesign: BlueprintDesign<TInput>,
    public readonly converter: (u: any) => TConverted
  ) {}

  public async build(item?: PartialBlueprint<TInput>): Promise<TConverted> {
    const built = await this._buildOverrides<TInput>(item, prng);
    const keysForGeneration = Object.getOwnPropertyNames(
      this.blueprintDesign
    ).reduce((memo, prop) => {
      if (!Object.getOwnPropertyNames(built).includes(prop)) {
        memo.push(prop);
      }
      return memo;
    }, new Array<string>());

    for (const key of keysForGeneration) {
      const v = (this.blueprintDesign as any)[key];
      let value = v;
      try {
        if (
          value !== null &&
          value !== undefined &&
          typeof value.then === "function"
        ) {
          value = await v(prng);
        } else if (typeof value === "function") {
          value = await Promise.resolve(v(prng));
        } else {
          value = v;
        }
      } catch (e) {
        console.error(
          "Error building key",
          key,
          "for blueprint item",
          this.blueprintDesign,
          e
        );
      }
      (built as any)[key] = value;
    }

    return this.converter(built as any);
  }

  async _buildOverrides<T1>(
    item: PartialBlueprint<T1> | undefined,
    uniqueNumber: Entropy
  ) {
    if (item === undefined || item === null) {
      return {};
    }
    const base: { [key: string]: any } = {};
    for (const key of Object.getOwnPropertyNames(item)) {
      const v = (item as any)[key];
      let value = v;
      if (!value) {
        value = v;
      } else if (typeof value.then === "function") {
        value = await v(uniqueNumber);
      } else if (typeof value === "function") {
        value = await Promise.resolve(v(uniqueNumber));
      } else {
        value = v;
      }
      base[key] = value;
    }

    return base as PartialBlueprint<T1>;
  }
}
export function design<TInput, TConverted = TInput>(
  blueprintDesign: BlueprintDesign<TInput>,
  converter: (t: TInput) => TConverted = identity
): Blueprint<TConverted, TInput> {
  return new Blueprint<TConverted, TInput>(blueprintDesign, converter);
}
