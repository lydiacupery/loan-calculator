import { QueryResult } from "@apollo/react-common";
import * as ApolloHooks from "@apollo/react-hooks";
import { useMutation, useQuery } from "@apollo/react-hooks";
import {
  ApolloQueryResult,
  FetchMoreOptions,
  FetchMoreQueryOptions,
  ObservableQuery,
} from "apollo-client";
import { Omit } from "modules/helpers";
import { flow } from "lodash-es";
import * as React from "react";
import { useMemo } from "react";
import { GraphqlBundle } from "./core";

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
  QueryResult<TData, TVariables>,
  "data"
> & {
  data: TData;
} & QueryExtras<TData, TVariables>;

export type QueryHookResult<TResult, TVars> =
  // Initial loading state. No data to show
  | ({ state: "LOADING" } & QueryExtras<TResult, TVars>)
  // Updating, but we have data to show. Usually render this.
  | ({ state: "UPDATING" } & QueryBaseResult<TResult, TVars>)
  // Loaded. We have data to show
  | ({ state: "DONE" } & QueryBaseResult<TResult, TVars>);

export function useQueryBundle<Result, Vars>(
  query: GraphqlBundle<Result, Vars>,
  options?: ApolloHooks.QueryHookOptions<Result, Vars>
): QueryHookResult<Result, Vars> {
  const rawResult = useQuery<Result, Vars>(query.Document, {
    ...options,
  });

  const ourResult = useMemo<QueryHookResult<Result, Vars>>((): any => {
    if (!rawResult.data || Object.keys(rawResult.data).length === 0) {
      return { state: "LOADING", ...rawResult };
    } else if (rawResult.loading) {
      return { state: "UPDATING", ...rawResult };
    } else {
      return { state: "DONE", ...rawResult };
    }
  }, [rawResult]);

  return ourResult;
}

export function useMutationBundle<T, TVariables>(
  mutation: GraphqlBundle<T, TVariables>,
  options?: ApolloHooks.MutationHookOptions<T, TVariables>
): ApolloHooks.MutationTuple<T, TVariables> {
  return useMutation(mutation.Document, options);
}

export function usePreviousResultWhileLoading<R, V>(
  queryResult: QueryHookResult<R, V>
): QueryHookResult<R, V> {
  const data = React.useRef<null | typeof queryResult>(null);
  if (queryResult.state === "LOADING" && !data.current) {
    return queryResult;
  }
  if (!data.current || queryResult.state === "DONE") {
    data.current = queryResult;
  }
  if (data.current.state === "LOADING") {
    // https://github.com/AmwayEFS/fusion-platform/issues/168
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
