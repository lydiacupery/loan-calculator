import { Port, PortType } from "./ports";
import * as Recipe from "./recipe";

export interface Context<TPorts extends Port = Port> {
  /** Unused. Exists in the type to disallow assignment of contexts not supporting all needed ports */
  _needs: { [K in TPorts["key"]]: K };
  get<TP extends TPorts>(port: TP): PortType<TP>;
  clone(overrides?: Recipe.RecipeOverride<TPorts>): this;
}

type ConstructorArgs<U extends Port> = {
  portDefaults?: Recipe.RecipeOverride<U>;
};

export type ContextClass<TCapabilities extends Port> = {
  // new (): Context<TCapabilities>;
  new (args?: ConstructorArgs<TCapabilities>): Context<
    TCapabilities
  > extends Context<TCapabilities>
    ? ContextBase<TCapabilities>
    : never;
};

export interface ContextBase<TCapabilities extends Port>
  extends Context<TCapabilities> {
  /** TODO: Factor out a container type that the context has a reference to instead of including this on the context itself */
  __override<TPort extends TCapabilities>(
    port: TPort,
    value: PortType<TPort>
  ): this;
}

export abstract class ContextBaseImpl<TPorts extends Port>
  implements ContextBase<TPorts> {
  _needs = null as any;
  protected portDefaults: Recipe.Recipe<Port>;
  protected instances: Map<Port, any>;
  protected abstract classRecipe: Recipe.Recipe<Port>;

  constructor(args?: ConstructorArgs<Port>) {
    this.instances = new Map();

    if (args && args.portDefaults) {
      const recipe = Recipe.coerce(args.portDefaults);
      this.portDefaults = recipe;
      for (const port of Recipe.eachPort(recipe)) {
        const value = Recipe.instantiate(recipe, port, this);
        if (value !== undefined) {
          this.instances.set(port, value);
        }
      }
    } else {
      this.portDefaults = Recipe.buildEmpty();
    }
  }

  get<TPort extends TPorts>(port: TPort): PortType<TPort> {
    if (this.instances.has(port)) {
      return this.instances.get(port);
    }

    const instance = Recipe.instantiate(
      this.classRecipe,
      port,
      this as Context
    );
    this.instances.set(port, instance);
    return instance;
  }

  clone(overrides?: Recipe.RecipeOverride<TPorts>): this {
    const overrideRecipe = overrides
      ? Recipe.merge(this.portDefaults, Recipe.coerce(overrides))
      : this.portDefaults;
    return new (this.constructor as any)({
      portDefaults: overrideRecipe,
    });
  }

  __override<TPort extends TPorts>(port: TPort, value: PortType<TPort>): this {
    this.instances.set(port, value);
    return this;
  }
}
