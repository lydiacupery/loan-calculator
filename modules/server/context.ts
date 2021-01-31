import { Context as GraphQLContext, ContextOpts } from "modules/context";

export type ContextBuilder = (opts?: ContextOpts) => GraphQLContext;

export const buildContext: ContextBuilder = (opts: ContextOpts = {}) => {
  return new GraphQLContext({
    ...opts,
  });
};
export type ContextFromResponse = (
  response: { removeListener: any; on: any },
  opts?: ContextOpts
) => GraphQLContext;

export const contextFromResponseBuilder = (
  contextBuilder: ContextBuilder
): ContextFromResponse => (
  response: { removeListener: any; on: any },
  opts: ContextOpts = {}
) => {
  const ctx = contextBuilder({ ...opts });
  const cleanup = async () => {
    await ctx.destroy();
    response.removeListener("finish", cleanup);
    response.removeListener("close", cleanup);
  };

  response.on("close", cleanup);
  response.on("finish", cleanup);
  return ctx;
};
