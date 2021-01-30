import * as Factory from "modules/atomic-object/blueprints/blueprint";

describe("FactoryBuilder", () => {
  it("builds an object if no values are provided", async () => {
    type Thing = {
      name: string;
      id: number;
    };

    const factory = Factory.design<Thing>({
      name: "Thing One",
      id: (prng: any) => Promise.resolve(prng.nextInt(1, 9999)),
    });

    const result = await factory.build();
    expect(result.name).toEqual("Thing One");
  });

  it("increments the sequence number on subsequent build calls", async () => {
    type Thing = {
      name: string;
      id: number;
    };

    const factory = Factory.design<Thing>({
      name: "Thing One",
      id: (prng: any) => Promise.resolve(prng.nextInt(1, 9999)),
    });

    let result = await factory.build();
    const firstResultId = result.id;
    expect(result.name).toEqual("Thing One");

    result = await factory.build();
    const secondResultId = result.id;
    expect(result.name).toEqual("Thing One");

    expect(secondResultId).not.toEqual(firstResultId);
  });

  it("accepts a value from the partial", async () => {
    type Thing = {
      name: string;
      id: number;
    };

    const factory = Factory.design<Thing>({
      name: "Thing One",
      id: (prng: any) => Promise.resolve(prng.nextInt(1, 9999)),
    });

    const result = await factory.build({ name: "Thing Two" });
    expect(result.name).toEqual("Thing Two");
  });

  it("accepts a value that is just a function", async () => {
    type Thing = {
      name: string;
      id: number;
    };

    const factory = Factory.design<Thing>({
      name: "Thing One",
      id: (prng: any) => prng.nextInt(1, 9999),
    });

    const result = await factory.build({ name: "Thing Two" });
    expect(result.name).toEqual("Thing Two");
  });
});
