import {
  Correspondent,
  IEntityComponentDiff,
  IEntityComponentData,
} from "./Correspondent";
import * as ECSY from "ecsy";
import { cast } from "./testUtils";
import { updateComponent } from "./ecsExtensions";

function iterableToArray<I, A = I>(
  it: Iterable<I>,
  transformItem: (x: I) => A = (x: I) => (x as unknown) as A
): Array<A> {
  const list = [];
  for (const item of it) {
    list.push(transformItem(item));
  }
  return list;
}

function listEntityIds(sut: Correspondent) {
  return iterableToArray(sut.getEntityIterator(), (entry) => entry[0]);
}

function listEntities(sut: Correspondent) {
  return iterableToArray(sut.getEntityIterator(), (entry) => entry[1]);
}

function constructSut(world: ECSY.World) {
  return new Correspondent(world);
}

describe("Correspondent", () => {
  test("set/get/removeEntityById + getEntityIterator", () => {
    const world = new ECSY.World();
    const sut = constructSut(world);
    const entityA = world.createEntity("a");
    const entityB = world.createEntity("b");

    expect(listEntityIds(sut)).toEqual([]);
    expect(listEntities(sut)).toEqual([]);

    sut.registerEntity("A", entityA);
    sut.registerEntity("B", entityB);

    expect(sut.getEntityById("A")).toBe(entityA);
    expect(sut.getEntityById("B")).toBe(entityB);
    expect(listEntityIds(sut)).toEqual(["A", "B"]);
    expect(listEntities(sut)).toEqual([entityA, entityB]);

    sut.unregisterEntity("A");
    expect(listEntityIds(sut)).toEqual(["B"]);
    expect(listEntities(sut)).toEqual([entityB]);
    sut.unregisterEntity("B");

    expect(sut.getEntityById("A")).not.toBeDefined();
    expect(sut.getEntityById("B")).not.toBeDefined();
    expect(listEntityIds(sut)).toEqual([]);
    expect(listEntities(sut)).toEqual([]);
  });

  test("(dis)allowComponent + getAllowedComponentIterator", () => {
    function getAllowedComponentIdList(sut: Correspondent) {
      return iterableToArray(
        sut.getAllowedComponentIterator(),
        (entry) => entry[0]
      );
    }
    function getAllowedComponentList(sut: Correspondent) {
      return iterableToArray(
        sut.getAllowedComponentIterator(),
        (entry) => entry[1]
      );
    }

    class ComponentA extends ECSY.Component<any> {}
    class ComponentB extends ECSY.Component<any> {}

    const world = new ECSY.World();
    const sut = constructSut(world);

    sut.allowComponent("a", ComponentA);
    sut.allowComponent("b", ComponentB);

    expect(getAllowedComponentIdList(sut)).toEqual(["a", "b"]);
    expect(getAllowedComponentList(sut)).toEqual([ComponentA, ComponentB]);

    sut.disallowComponent("a");

    expect(getAllowedComponentIdList(sut)).toEqual(["b"]);
    expect(getAllowedComponentList(sut)).toEqual([ComponentB]);
  });

  test("component identity function", () => {
    class ComplexComponent extends ECSY.Component<any> {
      static schema = {
        part1: {
          type: ECSY.Types.String,
        },
        part2: {
          type: ECSY.Types.String,
        },
      };
      part1?: string;
      part2?: string;
    }

    const world = new ECSY.World();
    const sut = constructSut(world);
    const cache = {};

    sut.allowComponent(
      "complex",
      ComplexComponent,
      (c: any) => c.part1 + c.part2
    );

    const entity = sut.createEntity("a").addComponent(ComplexComponent, {
      part1: "foo",
      part2: "bar",
    });

    sut.produceDiff(cache);

    updateComponent(entity, ComplexComponent, { part1: "baz" });

    expect(sut.produceDiff(cache)).toEqual({
      upsert: {
        a: {
          complex: {
            part1: "baz",
            part2: "bar",
          },
        },
      },
      remove: {},
    });
  });

  // TODO write separate tests for updateCache?
  test("diff operations", () => {
    class NumComponent extends ECSY.Component<any> {
      static schema = {
        value: { type: ECSY.Types.Number },
      };
      value?: number;
    }
    class ExcludedComponent extends ECSY.Component<any> {}
    class StrComponent extends ECSY.Component<any> {
      value?: string;
      static schema = {
        value: { type: ECSY.Types.String },
      };
    }

    const world = new ECSY.World()
      .registerComponent(NumComponent)
      .registerComponent(ExcludedComponent);
    const sut = constructSut(world)
      .allowComponent("numero", NumComponent)
      .allowComponent("varchar", StrComponent);
    const cache: IEntityComponentData = {};

    function testProduce(
      diffExpected: IEntityComponentDiff,
      cache: IEntityComponentData,
      cacheExpected: IEntityComponentData
    ) {
      const diffProduced = sut.produceDiff(cache);
      expect(diffProduced).toEqual(diffExpected);

      Correspondent.updateCache(cache, diffProduced);

      expect(cache).toEqual(cacheExpected);
    }

    function testConsume(
      diffToConsume: IEntityComponentDiff,
      cache: IEntityComponentData,
      cacheExpected: IEntityComponentData
    ) {
      sut.consumeDiff(diffToConsume);

      Correspondent.updateCache(cache, diffToConsume);

      expect(cache).toEqual(cacheExpected);
    }

    /** CREATE ENTITY ** */

    // Create original entity
    const anEntity = sut
      .createEntity("anEntity")
      .addComponent(NumComponent, { value: 1 })
      .addComponent(ExcludedComponent, { value: 2 });

    testProduce(
      {
        upsert: {
          anEntity: {
            numero: { value: 1 },
          },
        },
        remove: {},
      },
      cache,
      {
        anEntity: {
          numero: { value: 1 },
        },
      }
    );

    testConsume(
      {
        upsert: {
          anotherEntity: {
            numero: { value: 6 },
          },
        },
        remove: {},
      },
      cache,
      {
        anEntity: {
          numero: { value: 1 },
        },
        anotherEntity: {
          numero: { value: 6 },
        },
      }
    );

    const anotherEntity = sut.getEntityById("anotherEntity");
    expect(anotherEntity?.getComponent(NumComponent)?.value).toBe(6);

    /** ADD COMPONENT ** */

    anEntity.addComponent(StrComponent, { value: "Hai!" });

    testProduce(
      {
        upsert: {
          anEntity: {
            varchar: { value: "Hai!" },
          },
        },
        remove: {},
      },
      cache,
      {
        anEntity: {
          numero: { value: 1 },
          varchar: { value: "Hai!" },
        },
        anotherEntity: {
          numero: { value: 6 },
        },
      }
    );

    testConsume(
      {
        upsert: {
          anotherEntity: {
            varchar: { value: "Boo!" },
          },
        },
        remove: {},
      },
      cache,
      {
        anEntity: {
          numero: { value: 1 },
          varchar: { value: "Hai!" },
        },
        anotherEntity: {
          numero: { value: 6 },
          varchar: { value: "Boo!" },
        },
      }
    );

    expect(anotherEntity?.getComponent(StrComponent)?.value).toBe("Boo!");

    /** UPDATE COMPONENT ** */

    updateComponent(anEntity, StrComponent, { value: "Bai!" });

    testProduce(
      {
        upsert: {
          anEntity: {
            varchar: { value: "Bai!" },
          },
        },
        remove: {},
      },
      cache,
      {
        anEntity: {
          numero: { value: 1 },
          varchar: { value: "Bai!" },
        },
        anotherEntity: {
          numero: { value: 6 },
          varchar: { value: "Boo!" },
        },
      }
    );

    // Update component in response to incoming message
    testConsume(
      {
        upsert: {
          anotherEntity: {
            varchar: { value: "Ahh!" },
          },
        },
        remove: {},
      },
      cache,
      {
        anEntity: {
          numero: { value: 1 },
          varchar: { value: "Bai!" },
        },
        anotherEntity: {
          numero: { value: 6 },
          varchar: { value: "Ahh!" },
        },
      }
    );

    expect(anotherEntity?.getComponent(StrComponent)?.value).toBe("Ahh!");

    /** REMOVE COMPONENT ** */

    // Originate removal of component
    anEntity.removeComponent(StrComponent);

    testProduce(
      {
        upsert: {},
        remove: {
          anEntity: {
            varchar: true,
          },
        },
      },
      cache,
      {
        anEntity: {
          numero: { value: 1 },
        },
        anotherEntity: {
          numero: { value: 6 },
          varchar: { value: "Ahh!" },
        },
      }
    );

    testConsume(
      {
        upsert: {},
        remove: {
          anotherEntity: {
            varchar: true,
          },
        },
      },
      cache,
      {
        anEntity: {
          numero: { value: 1 },
        },
        anotherEntity: {
          numero: { value: 6 },
        },
      }
    );

    expect(anotherEntity?.hasComponent(StrComponent)).toBe(false);

    /** REMOVE ENTITY ** */

    anEntity.remove();

    testProduce(
      {
        upsert: {},
        remove: {
          anEntity: true,
        },
      },
      cache,
      {
        anotherEntity: {
          numero: { value: 6 },
        },
      }
    );

    cast<jest.Mock>(anotherEntity?.remove).mockClear();
    testConsume(
      {
        upsert: {},
        remove: {
          anotherEntity: true,
        },
      },
      cache,
      {}
    );

    expect(anotherEntity?.remove).toHaveBeenCalledTimes(1);
  });

  test("isEmptyDiff", () => {
    expect(
      Correspondent.isEmptyDiff({
        upsert: {},
        remove: {},
      })
    ).toBe(true);
    expect(
      Correspondent.isEmptyDiff({
        upsert: {
          anEntity: {},
        },
        remove: {},
      })
    ).toBe(false);
    expect(
      Correspondent.isEmptyDiff({
        upsert: {},
        remove: {
          anEntity: {},
        },
      })
    ).toBe(false);
  });
});
