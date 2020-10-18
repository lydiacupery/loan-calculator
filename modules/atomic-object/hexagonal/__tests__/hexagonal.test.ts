import * as Hexagonal from '..';

describe('Hexagonal', () => {
  describe('Building a context class', () => {
    it('Can register adapters', () => {
      let buildCount = 0;

      interface Foo {
        foo: number;
      }
      const fooPort = Hexagonal.port<Foo, 'foo'>('foo');
      type fooPort = typeof fooPort;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const barPort = Hexagonal.port<number, 'bar'>('bar');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      type barPort = typeof barPort;

      const fooAdapter = Hexagonal.adapter({
        port: fooPort,
        build() {
          buildCount += 1;
          return { foo: 1 };
        },
      });

      const ContextBase = Hexagonal.contextClass((cb) =>
        cb.add(fooPort, fooAdapter),
      );
      class Context extends ContextBase {
        get foo() {
          return this.get(fooPort);
        }
      }

      const expected = { foo: 1 };

      const ctx1 = new Context();

      expect(ctx1.get(fooPort)).toEqual(expected);
      expect(ctx1.get(fooPort)).toEqual(expected);
      expect(buildCount).toEqual(1);

      const ctx2 = new Context();
      expect(ctx2.foo).toEqual(expected);
      expect(buildCount).toEqual(2);
    });

    it('supports multiple ports, lazily instantiating them', () => {
      const p1 = Hexagonal.port<string, 'p1'>('p1');
      const p2 = Hexagonal.port<string, 'p2'>('p2');

      let buildCount = 0;
      const Ctx = Hexagonal.contextClass((cb) =>
        cb
          .add(p1, () => {
            buildCount += 1;
            return 'foo';
          })
          .add(p2, () => {
            buildCount += 1;
            return 'bar';
          }),
      );
      const ctx = new Ctx();

      expect(buildCount).toEqual(0);

      expect(ctx.get(p1)).toEqual('foo');
      expect(buildCount).toEqual(1);

      expect(ctx.get(p2)).toEqual('bar');
      expect(buildCount).toEqual(2);
    });

    it('Can override defaults in the constructor with a recipe', () => {
      const p1 = Hexagonal.port<string, 'p1'>('p1');

      let buildCount = 0;
      const Ctx = Hexagonal.contextClass((cb) =>
        cb.add(p1, () => {
          buildCount += 1;
          return 'foo';
        }),
      );

      const ctx = new Ctx({
        portDefaults: Hexagonal.recipe((cb) => cb.add(p1, () => 'bar')),
      });

      expect(ctx.get(p1)).toEqual('bar');
      expect(buildCount).toEqual(0);
    });

    it('Can override defaults in the constructor with a recipe-builder function', () => {
      const p1 = Hexagonal.port<string, 'p1'>('p1');

      let buildCount = 0;
      const Ctx = Hexagonal.contextClass((cb) =>
        cb.add(p1, () => {
          buildCount += 1;
          return 'foo';
        }),
      );

      const ctx = new Ctx({
        portDefaults: (cb) => cb.add(p1, () => 'bar'),
      });

      expect(ctx.get(p1)).toEqual('bar');
      expect(buildCount).toEqual(0);
    });

    it('Can override defaults in the constructor with a recipe-builder function that may not provide a value', () => {
      const p1 = Hexagonal.port<string | null, 'p1'>('p1');

      let override: string | null | undefined = null;

      let buildCount = 0;
      const Ctx = Hexagonal.contextClass((cb) =>
        cb.add(p1, () => {
          buildCount += 1;
          return 'foo';
        }),
      );

      override = null;
      const ctxWithNullOverride = new Ctx({
        portDefaults: (cb) => cb.add(p1, () => override),
      });
      expect(ctxWithNullOverride.get(p1)).toEqual(null);

      override = undefined;
      const ctxWithUndefinedOverride = new Ctx({
        portDefaults: (cb) => cb.add(p1, () => override),
      });
      expect(ctxWithUndefinedOverride.get(p1)).toEqual('foo');

      override = 'bar';
      const ctxWithOverride = new Ctx({
        portDefaults: (cb) => cb.add(p1, () => override),
      });
      expect(ctxWithOverride.get(p1)).toEqual('bar');
      expect(buildCount).toEqual(1);
    });
  });

  describe('.context', () => {
    it('can create a context directly', () => {
      const p1 = Hexagonal.port<string, 'p1'>('p1');

      const ctx = Hexagonal.context((cb) => cb.add(p1, () => 'foo'));
      expect(ctx.get(p1)).toEqual('foo');
    });
  });
});
