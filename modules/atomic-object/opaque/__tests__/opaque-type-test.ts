// import * as Opaque from '../index';

// const OpaqueNumber = Opaque.of<'O1', number>();
// const OpaqueNumber2 = Opaque.of<'O2', number>();

// const O1 = Opaque.to(OpaqueNumber, 32);

// // typings:expect-error
// const cantUseTheUnderlyingType = O1 + O1;

// const canAssignToOpaqueType: Opaque.OpaqueTypeOf<typeof OpaqueNumber> = O1;

// const canUnwrap: Opaque.ClearTypeOf<typeof OpaqueNumber> = Opaque.from(
//   OpaqueNumber,
//   O1,
// );

// const cantUnwrapClearType: Opaque.ClearTypeOf<typeof OpaqueNumber> = Opaque.from(
//   OpaqueNumber,
//   // typings:expect-error
//   32,
// );

// // typings:expect-error
// const cantAssignToClearType: Opaque.ClearTypeOf<typeof OpaqueNumber> = O1;

// // typings:expect-error
// const cantMismatchOpaques: Opaque.OpaqueTypeOf<typeof OpaqueNumber2> = O1;
