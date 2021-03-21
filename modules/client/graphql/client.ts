import { InMemoryCache, NormalizedCacheObject } from "apollo-cache-inmemory";
import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { BatchHttpLink } from "apollo-link-batch-http";
import { History } from "history";
import { buildErrorLink } from "./error-link";
import { buildClientLink } from "./state-link";

const cache = new InMemoryCache();

const stateLink = buildClientLink(cache);

export function buildGraphqlClient(
  history: History<any>
): ApolloClient<NormalizedCacheObject> {
  const errorLink = buildErrorLink(history);
  return new ApolloClient({
    cache: cache,
    link: ApolloLink.from([
      errorLink,
      stateLink,
      new BatchHttpLink({
        uri: config.get("server.apiHost") + "/graphql",
        batchInterval: 10,
        credentials: "same-origin",
      }),
    ]) as any, //todo, fix typings
    defaultOptions: {
      watchQuery: {
        // this governs the default fetch policy for react-apollo-hooks' useQuery():
        fetchPolicy: "cache-and-network",
      },
    },
  });
}
