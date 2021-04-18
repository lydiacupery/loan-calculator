import { SubmitFn } from "modules/atomic-object/forms";
import { useMutationForm } from "modules/atomic-object/forms/use-mutation-form";
import { GraphqlBundle } from "modules/client/graphql/core";
import { Maybe } from "modules/core";
import { compact } from "lodash-es";
import { StateUpdateFunction, useState } from "react";
import { PureQueryOptions } from "apollo-client/core/types";
import { RefetchQueriesFunction } from "@apollo/react-common/lib/types/types";

type Return<FormData> = {
  formErrors: string[];
  errorVisible: boolean;
  onSubmit: (initialState: any) => SubmitFn<FormData>;
  setErrorVisibility: StateUpdateFunction<boolean>;
};

type MutationBuilder<FormData, MutationVariables> = (
  current: FormData,
  initial: FormData
) => MutationVariables;

type ResponseLens<MutationResponse, MutationResponseData> = (
  a: MutationResponse
) => Maybe<MutationResponseData>;

type ErrorLens<MutationResponseData> = (
  a: MutationResponseData
) => Maybe<Error>[];

type Error = { message?: string };

/**
 * Provides form state and a submit function that you can use to trigger a mutation
 *
 * @param mutation the GraphQL Mutation Bundle that submitting your form will trigger
 * @param mutationBuilder a function that builds input for your mutation from your form data
 * @param responseLens a function that extracts the data that you care about from raw mutation results
 * @param errorLens a function that extracts error messages from the data that you care about
 */
export const useForm = <
  FormData,
  Mutation,
  MutationVariables,
  MutationResponse
>(
  mutation: GraphqlBundle<Mutation, MutationVariables>,
  mutationBuilder: MutationBuilder<FormData, MutationVariables>,
  responseLens: ResponseLens<Mutation, MutationResponse>,
  errorLens: ErrorLens<MutationResponse>,
  effect: () => void = () => {},
  refetchQueries?: Array<string | PureQueryOptions>
): Return<FormData> => {
  const [errors, setErrors] = useState<string[]>([]);
  const [errorsVisible, setErrorVisibility] = useState<boolean>(false);
  const { onSubmit } = useMutationForm({
    mutation,
    awaitRefetchQueries: true,
    refetchQueries,
    onMutate: result => {
      const response = responseLens(result);
      if (response && errorLens(response).length > 0) {
        setErrors(compact(errorLens(response).map(maybeMessage)));
        setErrorVisibility(true);
      }
      if (response && errorLens(response).length === 0) {
        effect();
      }
    },
    formDataToVars: mutationBuilder,
  });

  return {
    formErrors: errors,
    setErrorVisibility,
    onSubmit,
    errorVisible: errorsVisible,
  };
};

type MaybeMessage = (e: Maybe<Error>) => Maybe<string>;
const maybeMessage: MaybeMessage = e => (e ? e.message : null);
