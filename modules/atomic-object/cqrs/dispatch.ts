import Ajv from "ajv";
import config from "config";
import * as Result from "modules/atomic-object/result";
import { buildAjv, SchemaError } from "modules/core/schemas";

import { Action, ActionContext, Actions, UnwrapActions } from "./actions";
import {
  EventLogRecordRepositoryPort,
  SavedEventLog,
} from "modules/records/event-log";

type DispatchResult<T> = {
  value: T;
  event: SavedEventLog;
};
/** Wrapper for AJV errors that subclass Error to work with result type */

export class Dispatcher<TActions extends Action<any, any, any>> {
  schemaCache: Map<Action<any, any, any, unknown>, Ajv.ValidateFunction>;
  ajv: Ajv.Ajv;
  constructor(
    private rootContext: ActionContext,
    private actions: Actions<TActions>
  ) {
    this.ajv = buildAjv({ jsonPointers: true, allErrors: false });
    this.schemaCache = new Map<Action<any, any, any>, Ajv.ValidateFunction>();
    for (const action of this.actions.actions) {
      this.ajv.addSchema(action.schema, action.type);
    }
  }

  private _validatorFor(action: TActions): Ajv.ValidateFunction | undefined {
    const validator = this.ajv.getSchema(action.type);
    return validator;
  }

  private _captureValidatorFor(action: TActions): Ajv.ValidateFunction {
    let validator = this.schemaCache.get(action);
    if (validator) {
      return validator;
    }

    validator = this.ajv.compile({
      $ref: `${action.type}#/definitions/effect`,
    });
    this.schemaCache.set(action, validator);
    return validator;
  }

  orThrow = async <K extends TActions["type"]>(arg: {
    type: K;
    payload: TActions extends Action<K, infer P, any> ? P : never;
  }): Promise<
    TActions extends Action<K, any, infer R> ? DispatchResult<R> : never
  > => {
    let { payload } = arg;

    if (config.get("test")) {
      payload = JSON.parse(JSON.stringify(payload));
    }

    const action = this.actions.forType(arg.type);
    const validate = this._validatorFor(action);

    if (!validate || !validate(payload)) {
      if (!validate) {
        throw new Error(`No validator`);
      }
      throw new SchemaError(validate.errors![0]);
    }

    if (!action) {
      throw new Error(`Bad action type ${arg.type}`);
    }

    let eventRecord: SavedEventLog;

    let result: any;

    const clonedContext = this.rootContext.clone();

    const returnResult = await (async (context: ActionContext) => {
      // Get index + timestamp
      eventRecord = await context.get(EventLogRecordRepositoryPort).insert({
        type: arg.type,
        payload: {
          ...arg.payload,
        },
        effect: null, // May get updated
      });

      if (action.handler) {
        let captured: any = null;
        const capture = (a: any) => {
          const validateAction = this._captureValidatorFor(action);
          if (validateAction(a)) {
            captured = a;
          } else {
            throw new SchemaError(validateAction.errors![0]);
          }
        };
        result = await action.handler(arg.payload, {
          context,
          capture,
        });
        // Save eventRecord effect
        if (captured) {
          eventRecord = await context
            .get(EventLogRecordRepositoryPort)
            .updateEffect(eventRecord, captured);
        }
      } else {
        result = undefined;
      }

      const ret: DispatchResult<any> = {
        event: eventRecord,
        value: result,
      };
      return ret as any;
    })(clonedContext);

    if (action.cleanup) {
      action.cleanup(this.rootContext);
      let parentContext = this.rootContext._parentContext;
      while (parentContext !== null) {
        action.cleanup(parentContext);
        parentContext = parentContext._parentContext;
      }
    }
    const res = await returnResult;
    return res;
  };

  valueOrThrow = async <K extends TActions["type"]>(arg: {
    type: K;
    payload: TActions extends Action<K, infer P, any> ? P : never;
  }): Promise<TActions extends Action<K, any, infer R> ? R : never> => {
    const res = await this.orThrow(arg as any);
    return res.value;
  };

  toResult = async <K extends TActions["type"]>(arg: {
    type: K;
    payload: TActions extends Action<K, infer P, any> ? P : never;
  }): Promise<
    TActions extends Action<K, any, infer R>
      ? Result.Type<DispatchResult<R>>
      : never
  > => {
    try {
      return (await this.orThrow(arg as any)) as any;
    } catch (e) {
      return e;
    }
  };
}

export type DispatcherFn<TActions extends Actions<any>> = Dispatcher<
  UnwrapActions<TActions>
>["orThrow"];
