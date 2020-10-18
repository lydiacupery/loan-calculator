// import * as Hexagonal from '..';
// import { number } from 'yup';

// const fooPort = Hexagonal.port<string, 'foo'>('foo');
// type fooPort = typeof fooPort;
// const barPort = Hexagonal.port<number, 'bar'>('bar');
// type barPort = typeof barPort;

// const fooAdapter = Hexagonal.adapter({
//   port: fooPort,
//   build() {
//     return 'foo';
//   },
// });

// const barAdapter = Hexagonal.adapter({
//   port: barPort,
//   requires: [fooPort],
//   build(ctx) {
//     return 1;
//   },
// });

// const badBarAdapter = Hexagonal.adapter({
//   port: barPort,
//   requires: [fooPort],
//   build(ctx) {
//     ctx.get(fooPort);

//     // typings:expect-error
//     ctx.get(barPort);

//     return 1;
//   },
// });

// const fooCtx = Hexagonal.contextClass((cb) => cb.add(fooPort, fooAdapter));
// const fooBarCtx = Hexagonal.contextClass((cb) =>
//   cb.add(fooPort, fooAdapter).add(barPort, barAdapter),
// );

// const goodFooBarCtxInst = new fooBarCtx({
//   portDefaults: Hexagonal.recipe((cb) => cb.add(barPort, () => 1)),
// });

// goodFooBarCtxInst.get(barPort);

// const goodFooCtxInst = new fooCtx({});
// // typings:expect-error
// goodFooCtxInst.get(barPort);

// // typings:expect-error
// const badFooCtxInst = new fooCtx({
//   portDefaults: Hexagonal.recipe((cb) => cb.add(barPort, () => 1)),
// });

// const implicitFooCtx: Hexagonal.Context<fooPort> = new fooBarCtx();

// // typings:expect-error
// const badImplicitBarCtx: Hexagonal.Context<barPort> = new fooCtx();

// // typings:expect-error
// const Ctx1 = Hexagonal.contextClass((cb) => cb.add(barPort, barAdapter));

// // typings:expect-error
// const Ctx2 = Hexagonal.contextClass((cb) => cb.add(barPort, fooAdapter));

// const Ctx3 = Hexagonal.contextClass((cb) => cb.add(barPort, () => 1));

// // typings:expect-error
// const Ctx4 = Hexagonal.contextClass((cb) => cb.add(barPort, () => '1'));

// const Ctx5 = Hexagonal.contextClass((cb) =>
//   cb.add(fooPort, () => 'foo').add(barPort, (ctx) => 1),
// );
// const Ctx6 = Hexagonal.contextClass((cb) =>
//   // typings:expect-error
//   cb.add(fooPort, () => 'foo').add(barPort, (ctx) => '1'),
// );

// const dependencyAccess = Hexagonal.contextClass((cb) =>
//   cb
//     .add(fooPort, () => 'foo')
//     .add(barPort, (ctx) => {
//       ctx.get(fooPort);
//       return 1;
//     }),
// );

// const Ctx7 = Hexagonal.contextClass((cb) =>
//   cb
//     .add(fooPort, () => 'foo')
//     .add(barPort, (ctx) => {
//       // typings:expect-error
//       ctx.get(barPort);
//       return 1;
//     }),
// );
