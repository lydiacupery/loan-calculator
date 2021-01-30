import { flatMap } from "lodash-es";
import { Context } from "atomic-object/hexagonal";

import { JsonMap } from "helpers/json";
import { LoanRepositoryPort } from "domain-services/loan/repository";
import { EventLogRecordRepositoryPort } from "records/event-log";

export type ActionCommon<TPayload, TJobPayload extends TPayload = TPayload> = {
  schema: JsonMap;
  /**
   * Can this action be run inside the sandboxes?
   * (Only canRunInSandbox: true can run on a non-master datapool)
   */
  canRunInSandbox?: boolean;
  /**
   * Is the sandbox action replayable onto the master datapool?
   */
  replayable?: boolean;
};

export type ActionContext = Context<
  LoanRepositoryPort | EventLogRecordRepositoryPort
>;
/** TODO: clean up permissions, then remove? */

/** An action with an instantaneous effect which does not have outcome data to capture */
export type UncapturedActionDesc<K extends string, T, R> = {
  type: K;
  handler: (payload: T, extra: { context: ActionContext }) => Promise<R>;
  handleAndCaptureEffect?: never;
  cleanup?: (context: ActionContext) => void;
} & ActionCommon<T>;

/** An action with no instantaneous effect. May have a background effect */
export type VoidEffectActionDesc<K extends string, T> = {
  type: K;
  handler?: never;
  handleAndCaptureEffect?: never;
  cleanup?: never;
} & ActionCommon<T>;

/** An action that has an instantaneous effect which also captures outcome info */
export type CapturedActionDesc<K extends string, T, R, C = unknown> = {
  type: K;
  handler?: never;
  handleAndCaptureEffect: (
    payload: T,
    extra: { context: ActionContext }
  ) => Promise<[R, C]>;
  cleanup?: (context: ActionContext) => void;
} & ActionCommon<T>;

export type Action<
  K extends string = any,
  T = any,
  R = unknown,
  C = unknown
> = {
  type: K;
  /**
   * Can this action be run inside the sandboxes?
   * (Only canRunInSandbox: true can run on a non-master datapool)
   */
  canRunInSandbox?: boolean;
  /**
   * Is the sandbox action replayable onto the master datapool?
   */
  replayable?: boolean;
  handler:
    | null
    | ((
        payload: T,
        extra: {
          context: ActionContext;
          capture: (v: C) => void | Promise<void>;
        }
      ) => Promise<R>);
  schema: JsonMap;
  cleanup?: (context: ActionContext) => void;
};

export function declareAction<K extends string, T>(
  action: VoidEffectActionDesc<K, T>
): Action<K, T, void, void>;

export function declareAction<K extends string, T, R>(
  action: UncapturedActionDesc<K, T, R>
): Action<K, T, R, void>;

export function declareAction<K extends string, T, R, C>(
  action: CapturedActionDesc<K, T, R, C>
): Action<K, T, R, C>;

export function declareAction<K extends string, T, R, C>(
  action:
    | UncapturedActionDesc<K, T, R>
    | CapturedActionDesc<K, T, R, C>
    | VoidEffectActionDesc<K, T>
): Action<K, T, R, C> {
  if (action.replayable === true && action.canRunInSandbox !== true) {
    throw new Error(
      "Invalid action declaration - only sandbox actions can be marked as replayable"
    );
  }
  if ("handleAndCaptureEffect" in action) {
    return declareAction({
      type: action.type,
      replayable: action.replayable,
      canRunInSandbox: action.canRunInSandbox,
      schema: action.schema,
      handler: async (
        payload: any,
        { context, capture, runnerUserId }: any
      ) => {
        const [result, captured] = await action.handleAndCaptureEffect!(
          payload,
          {
            context,
          }
        );
        await capture(captured);
        return result;
      },
      cleanup: action.cleanup,
    }) as any;
  }
  return {
    ...action,
    handler: "handler" in action ? action.handler || null : null,
  };
}

export class Actions<TActions extends Action<any, any, any, any> = never> {
  constructor(public actions: ReadonlyArray<TActions> = []) {}

  forType(type: TActions["type"]) {
    const action = this.actions.find(a => a.type === type);
    if (!action) {
      throw new Error(`Unknown action type ${type}`);
    }
    return action;
  }

  with<K extends string, T, R, C>(
    action: Action<K, T, R, C>
  ): this extends Actions<never>
    ? Actions<Action<K, T, R, C>>
    : Actions<TActions | Action<K, T, R, C>> {
    return new Actions([...this.actions, action]) as any;
  }

  withAll<TActions2 extends Action<any, any, any, any>>(
    actions: Actions<TActions2>
  ): this extends Actions<never>
    ? Actions<TActions2>
    : Actions<TActions | TActions2> {
    return new Actions([...this.actions, ...actions.actions]) as any;
  }
}

export type ActionObjectTypes<TAction extends Action> = TAction extends Action<
  infer K,
  infer P,
  any,
  any
>
  ? { type: K; payload: P }
  : never;

export type ActionsObjectTypes<
  TActions extends Actions<any>
> = TActions extends Actions<infer TActionTypes>
  ? ActionObjectTypes<TActionTypes>
  : never;

export type UnwrapActions<
  TActions extends Actions<any>
> = TActions extends Actions<infer TA> ? TA : never;
