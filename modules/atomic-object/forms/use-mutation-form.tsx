import { PureQueryOptions } from "apollo-client";
import { Isomorphism } from "modules/atomic-object/lenses";
import { GraphqlBundle } from "modules/client/graphql/core";
import { GraphQLError } from "graphql";
import { useCallback, useState } from "react";
import { SubmitFn } from "./core";
import { useMutation } from "@apollo/react-hooks";

export type MutationFormState =
  | { key: "INITIAL" }
  | { key: "SUBMITTING" }
  | { key: "SUBMITTED" }
  | { key: "ERROR"; errors: ReadonlyArray<GraphQLError> };

export type MutationWrapperProps<TState, TVars, TResult, TFormData> = {
  /** The mutation function to submit to */
  mutation: GraphqlBundle<TResult, TVars>;
  /** Called with the mutation result after submitting */
  onMutate?: (result: TResult) => void;

  /** UNUSED parameter. Passing this in is just to inform TypeScript of intended types. */
  valuesFormDataIso?: Isomorphism<TState, TFormData>;

  /** Error handler */
  onError?: (result: ReadonlyArray<Error>) => void;
  formDataToVars: (state: TState, initialState: TState) => TVars;

  // Apollo options
  refetchQueries?: Array<string | PureQueryOptions>;
  awaitRefetchQueries?: boolean;
};

/** Produces input props for an IsoForm that invoke a mutation on submit. */
export function useMutationForm<TData, TVars, TResult = any, TFormData = any>(
  props: MutationWrapperProps<TData, TVars, TResult, TFormData> & {}
) {
  const [state, setState] = useState<MutationFormState>({
    key: "INITIAL",
  });

  const {
    onMutate,
    onError,
    formDataToVars,
    refetchQueries,
    awaitRefetchQueries,
  } = props;

  const [mutate] = useMutation<TResult, TVars>(props.mutation.Document);

  const onSubmit = useCallback<(initialState: any) => SubmitFn<TData>>(
    initial => async (data, formik) => {
      try {
        setState({ key: "SUBMITTING" });
        const result = await mutate({
          variables: formDataToVars(data, initial),
          refetchQueries,
          awaitRefetchQueries,
        });
        setState({ key: "SUBMITTED" });
        if (result.errors && result.errors.length > 0) {
          setState({
            key: "ERROR",
            errors: result.errors,
          });
          console.info("ERROR", result.errors);
          if (onError) {
            onError(result.errors);
          }
          return;
        }
        if (!result.data) {
          throw new Error("Didn't get data?");
        }
        if (onMutate) onMutate(result.data);
      } catch (e) {
        console.info("ERROR", e.graphQLErrors || [e]);
        if (onError) {
          onError(e.graphQLErrors || [e]);
        } else {
          setState({
            key: "ERROR",
            errors: e.graphQLErrors || [e],
          });
          formik.setSubmitting(false);
        }
      }
    },
    [
      mutate,
      formDataToVars,
      onMutate,
      onError,
      refetchQueries,
      awaitRefetchQueries,
    ]
  );

  return { onSubmit, state };
}
