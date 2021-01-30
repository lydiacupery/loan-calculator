import * as Hexagonal from "modules/atomic-object/hexagonal";
import ApolloClient from "apollo-client";

export const ApolloClientPort = Hexagonal.port<
  ApolloClient<any>,
  "apollo client"
>("apollo client");
export type ApolloClientPort = typeof ApolloClientPort;
