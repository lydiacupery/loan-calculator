import { Context, ContextBaseImpl, ContextClass } from "./context";
import { Port, PortType } from "./ports";
import * as R from "./recipe";

export { Context } from "./context";
export { Port } from "./ports";

export const Recipe = R;
export type Recipe<TPort extends Port> = R.Recipe<TPort>;

/** Declare a port */
export function port<Type, TIdentifier extends string>(
  id: TIdentifier
): Port<TIdentifier, Type> {
  return {
    key: id,
  } as any;
}

/** Declare a port adapter. Mainly a helper function to properly type a provider function for a port. */
export function adapter<
  TPort extends Port,
  TConcreteType extends PortType<TPort>,
  TDependencies extends Port
>(args: {
  port: TPort;
  requires?: [];
  build: R.ProviderFunction<Context, TConcreteType>;
}): () => TConcreteType;

export function adapter<
  TPort extends Port,
  TConcreteType extends PortType<TPort>,
  TDependencies extends Port
>(args: {
  port: TPort;
  requires: TDependencies[];
  build: R.ProviderFunction<Context<TDependencies>, TConcreteType>;
}): R.ProviderFunction<Context<TDependencies>, TConcreteType>;

export function adapter(args: { port: any; requires?: any[]; build: any }) {
  return args.build;
}

/** Generate a context class backed by a Recipe specified by the given function */
export function contextClass<T extends Port>(
  f: R.RecipeBuilderFunction<T>
): ContextClass<T> {
  const classRecipe = R.build(f);

  // eslint-disable-next-line no-shadow
  class Context extends ContextBaseImpl<any> {
    protected classRecipe = classRecipe;
  }
  return Context;
}

export function context<T extends Port>(f: R.RecipeBuilderFunction<T>) {
  return new (contextClass(f))();
}

export const recipe = Recipe.build;
