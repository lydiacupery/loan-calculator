import * as ApolloHooks from "react-apollo-hooks";
import { GraphqlBundle } from "./core";
import {
  ApolloQueryResult,
  ObservableQuery,
  FetchMoreQueryOptions,
  FetchMoreOptions,
} from "apollo-client";
import { useMemo, useRef } from "react";
import { MutationFn } from "react-apollo";
import { Omit } from "helpers";
import { flow } from "lodash-es";

type NonOptional<O> = O extends null | undefined | (infer T) ? T : O;

/** Extra query stuff we get from apollo hooks. */
type QueryExtras<TData, TVariables> = Pick<
  ObservableQuery<TData, TVariables>,
  "refetch" | "startPolling" | "stopPolling" | "updateQuery"
> & {
  fetchMore<K extends keyof TVariables>(
    fetchMoreOptions: FetchMoreQueryOptions<TVariables, K> &
      FetchMoreOptions<TData, TVariables>
  ): Promise<ApolloQueryResult<TData>>;
};

type QueryBaseResult<TData, TVariables> = Omit<
  ApolloHooks.QueryHookResult<TData, TVariables>,
  "data"
> & {
  data: TData;
} & QueryExtras<TData, TVariables>;

export type PlacementQueryHookResult<TResult, TVars> =
  // Initial loading state. No data to show
  | { state: "LOADING" } & QueryExtras<TResult, TVars>
  // Updating, but we have data to show. Usually render this.
  | { state: "UPDATING" } & QueryBaseResult<TResult, TVars>
  // Loaded. We have data to show
  | { state: "DONE" } & QueryBaseResult<TResult, TVars>;

export function useQueryBundle<Result, Vars>(
  query: GraphqlBundle<Result, Vars>,
  options?: ApolloHooks.QueryHookOptions<Vars>
): PlacementQueryHookResult<Result, Vars> {
  const rawResult = ApolloHooks.useQuery<Result, Vars>(query.Document, {
    suspend: false,
    ...options,
  });

  const ourResult = useMemo<PlacementQueryHookResult<Result, Vars>>((): any => {
    if (!rawResult.data || Object.keys(rawResult.data).length == 0) {
      return { state: "LOADING", ...rawResult };
    } else if (rawResult.loading) {
      return { state: "UPDATING", ...rawResult };
    } else {
      return { state: "DONE", ...rawResult };
    }
  }, [rawResult]);

  return ourResult;
}

export function usePreviousResultWhileLoading<R, V>(
  queryResult: PlacementQueryHookResult<R, V>
): PlacementQueryHookResult<R, V> {
  const data = useRef<null | typeof queryResult>(null);
  if (queryResult.state === "LOADING" && !data.current) {
    return queryResult;
  }
  if (!data.current || queryResult.state === "DONE") {
    data.current = queryResult;
  }
  if (data.current.state === "LOADING") {
    // https://github.com/AmwayCorp/fusion-platform/issues/168
    // This should work, but the types are unhappy...
    // Ideally, this state should change to "Updating" to better represent the state of having cached values but getting new up to date values
    // return {
    //   ...data.current,
    //   state: "UPDATING",
    // };
    return data.current;
  }
  return data.current;
}

export const useQueryWithPreviousResultsWhileLoading = flow(
  useQueryBundle,
  usePreviousResultWhileLoading
);

export function useMutationBundle<T, TVariables>(
  mutation: GraphqlBundle<T, TVariables>,
  options?: ApolloHooks.MutationHookOptions<T, TVariables>
): MutationFn<T, TVariables> {
  const func = ApolloHooks.useMutation(
    mutation.Document,
    options
  ) as MutationFn<T, TVariables>; // using the type from react-apollo instead of react-apollo-hooks for better compatibility with remaining non-hook apollo use. (change this later?)
  return func;
}
