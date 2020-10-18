import * as Hexagonal from "atomic-object/hexagonal";
import introspectionQueryResultData from "client/graphql/introspection-result.gen";
import ApolloClient from "apollo-client";
import {
  IntrospectionFragmentMatcher,
  InMemoryCache,
} from "apollo-cache-inmemory";
import { ApolloLink } from "apollo-link";
import SchemaLink from "apollo-link-schema";
import { ClientSideResolvers } from "client/graphql/resolvers";
import { ApolloClientPort } from "./ports";
import { executableSchema } from "graphql-api";

export const ApolloClientStatePort = Hexagonal.port<
  unknown,
  "apollo client state"
>("apollo client state");

export const apolloClientAdapter = Hexagonal.adapter({
  port: ApolloClientPort,
  requires: [ApolloClientStatePort],
  build: ctx => {
    const fragmentMatcher = new IntrospectionFragmentMatcher({
      introspectionQueryResultData,
    });
    const apolloCache = new InMemoryCache({ fragmentMatcher });
    const apolloClient = new ApolloClient({
      ssrMode: true,
      cache: apolloCache,
      link: ApolloLink.from([
        new SchemaLink({
          schema: executableSchema,
          context: ctx,
        }),
      ]) as any, // todo, fix typings conflict
      resolvers: ClientSideResolvers as any,
    });

    apolloCache.writeData({
      data: ctx.get(ApolloClientStatePort) || {},
    });
    return apolloClient;
  },
});
