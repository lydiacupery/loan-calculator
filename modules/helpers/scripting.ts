export type NodeScript = () => Promise<ScriptResult>;

export const run = (fn: NodeScript): void => {
  fn()
    .then(response => {
      if (failed(response)) {
        console.error(response.name, response.message, response.baseError);
        process.exit(1);
      }
      if (succeeded(response)) {
        process.exit(0);
      }
    })
    .catch(reason => {
      console.error(reason);
      process.exit(3);
    });
};

/** Slightly more explicit version of atomic-object/result, which
 * wasn’t working properly. Result.isError wasn’t properly detecting
 * that objects that are structurally compatible with Error should be
 * treated as errors. Ask me why I wish this was unnecessary.
 */
export type ScriptResult = ScriptSucceeded | ScriptError;

type ScriptSucceeded = {
  status: "succeeded";
};

interface ScriptError extends NestableError {
  status: "failed";
}

enum ScriptStatus {
  succeeded = "succeeded",
  failed = "failed",
}

type NestableError = Error & {
  baseError?: NestableError;
};

export const scriptFailure = (x: NestableError): ScriptError => ({
  ...x,
  status: ScriptStatus.failed,
});

export const scriptSuccess = (): ScriptSucceeded => ({
  status: ScriptStatus.succeeded,
});

export const failed = (x: ScriptResult): x is ScriptError =>
  x.status === ScriptStatus.failed;
export const succeeded = (x: ScriptResult): x is ScriptSucceeded =>
  x.status === ScriptStatus.succeeded;
