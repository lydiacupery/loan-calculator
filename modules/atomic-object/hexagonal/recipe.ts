import { Context } from "./context";
import { Port, PortType } from "./ports";

export interface Recipe<TPort extends Port> {
  adapters: Map<TPort, ProviderFunction>;
}

export type Recipeable<TPort extends Port> =
  | Recipe<TPort>
  | RecipeBuilderFunction<TPort>;

export type RecipeOverride<TPort extends Port> =
  | OverrideRecipe<TPort>
  | RecipeBuilderOverrideFunction<TPort>;

export interface RecipeBuilder1 {
  add<TPort extends Port, TConcreteType extends PortType<TPort>>(
    port: TPort,
    provider: () => TConcreteType
  ): RecipeBuilder<TPort>;

  toRecipe(): Recipe<Port>;
}

export interface RecipeBuilder<TCapabilities extends Port> {
  add<
    TPort extends Port,
    TConcreteType extends PortType<TPort>,
    TCtx extends Context<TCapabilities>
  >(
    port: TPort,
    provider: (ctx: TCtx) => TConcreteType
  ): RecipeBuilder<TCapabilities | TPort>;

  toRecipe(): Recipe<TCapabilities>;
}

class RecipeBuilderImpl {
  adapters = new Map<Port, ProviderFunction>();

  add(port: any, provider: any): this {
    this.adapters.set(port, provider);
    return this;
  }

  toRecipe(): Recipe<any> {
    return {
      adapters: this.adapters,
    };
  }
}

export type RecipeBuilderFunction<T extends Port> = (
  cb: RecipeBuilder1
) => RecipeBuilder<T>;

interface RecipeOverrider<TCapabilities extends Port> {
  add<
    TPort extends Port,
    TConcreteType extends PortType<TPort>,
    TCtx extends Context<TCapabilities>
  >(
    port: TPort,
    provider: (ctx: TCtx) => TConcreteType | undefined
  ): this;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class RecipeOverriderImpl {} // TODO: not used...
export type RecipeBuilderOverrideFunction<T extends Port> = (
  cb: RecipeOverrider<T>
) => RecipeOverrider<T>;

export type ProviderFunction<TCtx extends Context = Context, TType = any> = (
  ctx: TCtx
) => TType;

export function buildEmpty<TPort extends Port = Port>(): Recipe<TPort> {
  return {
    adapters: new Map(),
  };
}

export function build<TPort extends Port>(
  buildFn: RecipeBuilderFunction<TPort>
): Recipe<TPort> {
  const cb = new RecipeBuilderImpl();
  buildFn(cb);
  return cb.toRecipe();
}

export function merge<TP1 extends Port, TP2 extends Port>(
  r1: Recipe<TP1>,
  r2: Recipe<TP2>
): Recipe<TP1 | TP2> {
  const result = {
    adapters: new Map<Port, ProviderFunction>([
      ...r1.adapters,
      ...r2.adapters,
    ] as any),
  };

  return result as any;
}

export function instantiate<TPort extends Port>(
  recipe: Recipe<TPort>,
  port: TPort,
  context: any
): PortType<TPort> {
  const adapter = recipe.adapters.get(port);
  if (!adapter) throw new Error(`Adapter not registered for port ${port.key}`);
  const instance = adapter(context);
  return instance;
}

export function eachPort<TPort extends Port = Port>(recipe: Recipe<TPort>) {
  return recipe.adapters.keys();
}

export type OverridePorts<TPort extends Port> = TPort extends Port<
  infer S,
  infer T
>
  ? Port<S, T | undefined>
  : never;

export type OverrideRecipe<TPort extends Port> = Recipe<OverridePorts<TPort>>;

export function coerce<TPort extends Port>(
  recipable: Recipeable<TPort>
): Recipe<TPort>;
export function coerce<TPort extends Port>(
  recipable: RecipeOverride<TPort>
): OverrideRecipe<TPort>;
export function coerce<TPort extends Port>(recipable: any) {
  if (typeof recipable === "function") {
    return build(recipable);
  } else {
    return recipable;
  }
}
