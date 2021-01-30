// import { withContext } from "__tests__/db-helpers";

// import { EventLogRecordRepositoryPort } from "records/event-log";
// import { v4 as uuidv4 } from "uuid";
// import * as Blueprints from "blueprints";
// import { ActionRunnerUserIdPort } from "domain-services/action-runner-user-id-port";
// import { withKnexTransaction } from "records";
// import { Actions, declareAction, ActionContext } from "../actions";
// import { Dispatcher } from "../dispatch";
// import { PaymentId } from "core/payment/value";
// import { PaymentRecordRepositoryPort } from "records/payment";

// /** ******************************************************************************** */

// const action1 = declareAction({
//   type: "test-action",
//   schema: { type: "object" },
//   async handler(payload: { id: PaymentId; name: string }, { context }) {
//     const { name } = payload;
//     return await context
//       .get(PaymentRecordRepositoryPort)
//       .update([{ name }]);
//   },
// });

// const brokenAction = declareAction({
//   type: "broken-action",
//   schema: { type: "object" },
//   handler(payload: { message: string }, { context }) {
//     throw new Error(payload.message);
//   },
// });

// const nonValidatingAction = declareAction({
//   type: "non-validating-action",
//   schema: { type: "number" },
//   async handler(payload: { message: string }, { context }) {},
// });

// const capturingAction = declareAction({
//   type: "capturing-action",
//   schema: {
//     type: "object",
//     definitions: {
//       effect: {
//         type: "object",
//         properties: {
//           foo: { type: "number" },
//         },
//         required: ["foo"],
//       },
//     },
//   },
//   handleAndCaptureEffect(payload: { foo: number }) {
//     return Promise.resolve([{}, payload]);
//   },
// });

// const sandboxAction = declareAction({
//   type: "SandboxAction",
//   canRunInSandbox: true,
//   schema: { type: "object" },
//   handler: () => Promise.resolve("worked"),
// });

// const actions = new Actions()
//   .with(action1)
//   .with(brokenAction)
//   .with(nonValidatingAction)
//   .with(capturingAction)
//   .with(sandboxAction);

// describe("Dispatching actions", () => {
//   it(
//     "works (with transaction)",
//     withContext(async (ctx: ActionContext, { universe, user }) => {
//       const payloadId = uuidv4();
//       const result = await withKnexTransaction(ctx, async trxCtx => {
//         const dispatch = new Dispatcher(trxCtx, actions).valueOrThrow;
//         return await dispatch({
//           type: "test-action",
//           payload: { id: payloadId as BusinessLineId, name: "Fort ctx" },
//         });
//       });

//       expect(result.length).toEqual(1);
//       expect(result[0].id).toBeTruthy();
//       expect(result[0].name).toEqual("Fort ctx");

//       const [event] = await ctx.get(EventLogRecordRepositoryPort).table();
//       expect(event.type).toEqual("test-action");
//       expect(event.userId).toEqual(user!.nativeId);
//       expect(event.dataPoolId).toEqual(
//         ctx.get(CurrentDataPoolPort).getCurrentDataPool().id
//       );
//       expect(event.payload).toEqual({ id: payloadId, name: "Fort ctx" });
//     })
//   );

//   it(
//     "works with UserId overwritten",
//     withContext(async (ctx: ActionContext, { universe }) => {
//       const userOverrideCtx = ctx.clone(c =>
//         c.add(ActionRunnerUserIdPort, () => "testOverrideOfUserId")
//       );
//       const dispatch = new Dispatcher(userOverrideCtx, actions).valueOrThrow;
//       const payloadId = uuidv4();
//       await dispatch({
//         type: "test-action",
//         payload: { id: payloadId as BusinessLineId, name: "Fort ctx" },
//       });
//       const [event] = await ctx.get(EventLogRecordRepositoryPort).table();
//       expect(event.type).toEqual("test-action");
//       expect(event.userId).toEqual("testOverrideOfUserId");
//     })
//   );

//   it(
//     "Does not log on broken action failure (with transaction usage pattern)",
//     withContext(async ctx => {
//       await expect(
//         withKnexTransaction(ctx, async trxCtx => {
//           const dispatch = new Dispatcher(trxCtx, actions).valueOrThrow;
//           // Throw here
//           await dispatch({
//             type: "broken-action",
//             payload: { message: "Foo" },
//           });
//         })
//       ).rejects.toThrow("Foo");

//       // Failed inside a transaction - should abort event log
//       expect(await ctx.get(EventLogRecordRepositoryPort).count()).toEqual(0);
//     })
//   );

//   it(
//     "Does not log on non-validating action failure",
//     withContext(async ctx => {
//       const dispatch = new Dispatcher(ctx, actions).valueOrThrow;
//       await expect(
//         dispatch({
//           type: "non-validating-action",
//           payload: { message: "Foo" },
//         })
//       ).rejects.toThrow(Error);

//       expect(await ctx.get(EventLogRecordRepositoryPort).count()).toEqual(0);
//     })
//   );
//   it(
//     "Validates result for capturing actions",
//     withContext(async ctx => {
//       const dispatch = new Dispatcher(ctx, actions).valueOrThrow;
//       await expect(
//         dispatch({
//           type: "capturing-action",
//           payload: { NOFOO: 1 } as any,
//         })
//       ).rejects.toThrow(Error);

//       await expect(
//         dispatch({
//           type: "capturing-action",
//           payload: { foo: 1 },
//         })
//       ).resolves.toEqual({});
//     })
//   );

//   it("Does not let us declareAction with replayable: true and canRunInSandbox: false", () => {
//     expect(() => {
//       declareAction({
//         type: "some-bad-type",
//         // Missing canRunInSandbox
//         replayable: true,
//         schema: { type: "object" },
//         handler: () => Promise.resolve(),
//       });
//     }).toThrow();

//     expect(
//       declareAction({
//         type: "some-bad-type",
//         canRunInSandbox: true,
//         replayable: true,
//         schema: { type: "object" },
//         handler: () => Promise.resolve(),
//       })
//     ).toEqual(
//       expect.objectContaining({
//         replayable: true,
//         type: "some-bad-type",
//         canRunInSandbox: true,
//       })
//     );
//   });
// });
