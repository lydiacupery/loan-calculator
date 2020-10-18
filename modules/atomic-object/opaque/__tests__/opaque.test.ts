import * as Opaque from '../index';
import * as DirtyTrackingOpaque from '../dirty_tracking';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type AssertAssignable<A, B extends A> = true;

describe('Opaque', () => {
  it('supports to and from conversion that is a no-op at runtime', () => {
    type Named = { name: string };
    const O = Opaque.of<'Named', Named>();

    const orig = { name: 'foo' };
    const opaque = Opaque.to(O, orig);
    expect(orig).toBe(opaque);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type _checkOpaque = AssertAssignable<{ _opaque: 'Named' }, typeof opaque>;

    /** This does not type check if opaque is compatible with Named */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type _checkOpaqueHasNoName = AssertAssignable<
      never,
      typeof opaque extends Named ? Named : never
    >;

    const clear = Opaque.from(O, opaque);
    expect(opaque).toBe(clear);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type _check = AssertAssignable<Named, typeof clear>;
  });

  it('Can create lenses on opaque types', () => {
    type Named = { name: string; age: number };
    const O = Opaque.of<'Named', Named>();

    const name_ = Opaque.propLens(O, 'name');
    let opaque = Opaque.to(O, { name: 'Joe', age: 32 });
    opaque = name_.set(opaque, 'Joanie');

    const clear = Opaque.from(O, opaque);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type _check = AssertAssignable<Named, typeof clear>;

    expect(clear.name).toEqual('Joanie');
    expect(clear.age).toEqual(32);
  });

  it('Can track the dirty status of an opaque object', () => {
    type Named = { name: string; age: number };
    const O = DirtyTrackingOpaque.of<'Named', Named>();

    const name_ = DirtyTrackingOpaque.propLens(O, 'name');
    let opaque = DirtyTrackingOpaque.to(O, { name: 'Joe', age: 32 });
    expect(DirtyTrackingOpaque.isDirty(opaque)).toEqual(false);

    opaque = name_.set(opaque, 'Joanie');
    expect(DirtyTrackingOpaque.isDirty(opaque)).toEqual(true);
  });
});
