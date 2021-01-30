import * as Hexagonal from "modules/atomic-object/hexagonal";

interface RepositoryClass<TContext extends Hexagonal.Context<any>, TRepo> {
  new (ctx: TContext): TRepo;
}

type RCType<
  TRepoClass extends RepositoryClass<any, any>
> = TRepoClass extends RepositoryClass<any, infer T> ? T : never;
type ContextType<
  TRepoClass extends RepositoryClass<any, any>
> = TRepoClass extends RepositoryClass<infer T, any> ? T : never;

export function buildRepositoryPortAndAdapter<
  TLabel extends string,
  TRepoClass extends RepositoryClass<any, any>
>(
  label: TLabel,
  Repo: TRepoClass
): [
  Hexagonal.Port<TLabel, RCType<TRepoClass>>,
  (ctx: ContextType<TRepoClass>) => RCType<TRepoClass>
] {
  const port = Hexagonal.port<RCType<TRepoClass>, TLabel>(label);
  const adapter = Hexagonal.adapter({
    port,
    build: ctx => {
      return new Repo(ctx);
    },
  });

  return [port, adapter];
}
