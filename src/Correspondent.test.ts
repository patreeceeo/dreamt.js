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
  return iterableToArray(sut._entityMap.entries(), (entry) => entry[0]);
}

function listEntities(sut: Correspondent) {
  return iterableToArray(sut._entityMap.entries(), (entry) => entry[1][0]);
}

function constructSut(world: ECSY.World) {
  return new Correspondent(world);
}

describe("Correspondent", () => {
  test("(un)registerEntity + getEntityById", () => {
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

    expect(sut.getEntityById("A")).toBeNull();
    expect(sut.getEntityById("B")).toBeNull();
    expect(listEntityIds(sut)).toEqual([]);
    expect(listEntities(sut)).toEqual([]);
  });

  test("registerComponent + getComponentIterator", () => {
    function getComponentIdList(sut: Correspondent) {
      return iterableToArray(sut.getComponentIterator(), (entry) => entry[0]);
    }
    function getComponentList(sut: Correspondent) {
      return iterableToArray(sut.getComponentIterator(), (entry) => entry[1]);
    }

    class ComponentA extends ECSY.Component<any> {}
    class ComponentB extends ECSY.Component<any> {}

    const world = new ECSY.World();
    const sut = constructSut(world);

    sut.registerComponent("a", ComponentA);
    sut.registerComponent("b", ComponentB);

    expect(getComponentIdList(sut)).toEqual(["a", "b"]);
    expect(getComponentList(sut)).toEqual([ComponentA, ComponentB]);
  });

  test("root object reuse", () => {
    const world = new ECSY.World();
    const sut = constructSut(world);
    const cache = {};

    expect(sut.produceDiff(cache)).toBe(sut.diff);
  });

  test("isMine opt", () => {
    class OwnershipComponent extends ECSY.Component<{
      value: number;
    }> {}
    class AnotherComponent extends ECSY.Component<{
      value: number;
    }> {}
    const world = new ECSY.World();
    const sut = new Correspondent(world, {
      isMine: (entity) => {
        return (entity.getComponent(OwnershipComponent) as any).value === 1;
      },
    });
    const cache = {};

    sut.registerComponent("ownership", OwnershipComponent);
    sut.registerComponent("another", AnotherComponent);

    sut.consumeDiff({
      upsert: {
        myOtherEntity: {
          ownership: 1,
          another: 13,
        },
      },
      remove: {},
    });

    const myOtherEntity = sut.getEntityById("myOtherEntity");

    expect(myOtherEntity).toBeDefined();
    if (myOtherEntity) {
      (myOtherEntity.getMutableComponent(AnotherComponent) as any).value = 17;
    }

    expect(sut.produceDiff(cache)).toEqual({
      upsert: {
        myOtherEntity: {
          ownership: 1,
          another: 17,
        },
      },
      remove: {},
    });
  });

  test("registerComponent opts", () => {
    class ComplexComponent extends ECSY.Component<{
      value: { part1: string; part2: string };
    }> {
      value?: {
        part1: string;
        part2: string;
      };
    }

    const world = new ECSY.World();
    const sut = constructSut(world);
    const cache = {};

    sut.registerComponent("write_read", ComplexComponent, {
      write: (c) =>
        (c as ComplexComponent).value?.part1 +
        "," +
        (c as ComplexComponent).value?.part2,
      read: (c, str) => {
        const [part1, part2] = (str as string).split(",");
        (c as any).value = { part1, part2 };
      },
    });
    sut.registerComponent("writeCache", ComplexComponent, {
      writeCache: ({ part1, part2 }) => part1 + part2,
    });
    sut.registerComponent("allow", ComplexComponent, {
      allow: (() => {
        let allow = true;
        return () => {
          const retval = allow;
          allow = false;
          return retval;
        };
      })(),
    });

    const entity = sut.createEntity("a").addComponent(ComplexComponent, {
      value: {
        part1: "foo",
        part2: "bar",
      },
    });

    updateComponent(entity, ComplexComponent, {
      value: { part1: "baz", part2: "bar" },
    });

    expect(sut.produceDiff(cache)).toEqual({
      upsert: {
        a: {
          writeCache: {
            part1: "baz",
            part2: "bar",
          },
          write_read: "baz,bar",
          allow: {
            part1: "baz",
            part2: "bar",
          },
        },
      },
      remove: {},
    });

    const diff = {
      upsert: {
        a: {
          write_read: "baz,bap",
        },
      },
      remove: {},
    };

    sut.consumeDiff(diff);

    expect(
      (entity.getComponent(ComplexComponent) as ComplexComponent)?.value?.part2
    ).toEqual("bap");

    updateComponent(entity, ComplexComponent, {
      value: { part1: "give", part2: "take" },
    });

    expect(sut.produceDiff(cache)).toEqual({
      upsert: {
        a: expect.not.objectContaining({
          allow: expect.anything(),
        }),
      },
      remove: {},
    });
  });

  // TODO refactor this test into smaller units
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
      .registerComponent("numero", NumComponent)
      .registerComponent("varchar", StrComponent);
    const cache: IEntityComponentData = {};

    function testProduce(
      diffExpected: IEntityComponentDiff,
      cache: IEntityComponentData,
      cacheExpected: IEntityComponentData
    ) {
      const diffProduced = sut.produceDiff(cache);
      expect(diffProduced).toEqual(diffExpected);

      sut.updateCache(cache, diffProduced);

      expect(cache).toEqual(cacheExpected);
    }

    function testConsume(
      diffToConsume: IEntityComponentDiff,
      cache: IEntityComponentData,
      cacheExpected: IEntityComponentData
    ) {
      sut.consumeDiff(diffToConsume);

      sut.updateCache(cache, diffToConsume);

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
            numero: 1,
          },
        },
        remove: {},
      },
      cache,
      {
        anEntity: {
          numero: 1,
        },
      }
    );

    const anotherEntity = world.createEntity();
    const createEntityOriginal = sut.createEntity;
    spyOn(sut, "createEntity").and.returnValue(anotherEntity);
    testConsume(
      {
        upsert: {
          anotherEntity: {
            numero: 6,
          },
        },
        remove: {},
      },
      cache,
      {
        anEntity: {
          numero: 1,
        },
      }
    );

    expect(sut.createEntity).toHaveBeenCalledTimes(1);
    expect(sut.createEntity).toHaveBeenCalledWith("anotherEntity", false);
    expect(anotherEntity.addComponent).toHaveBeenCalledTimes(1);
    expect(anotherEntity.addComponent).toHaveBeenCalledWith(NumComponent, { value: 6 });
    sut.registerEntity("anotherEntity", anotherEntity, false);
    sut.createEntity = createEntityOriginal;


    /** ADD COMPONENT ** */

    anEntity.addComponent(StrComponent, { value: "Hai!" });

    testProduce(
      {
        upsert: {
          anEntity: {
            varchar: "Hai!",
          },
        },
        remove: {},
      },
      cache,
      {
        anEntity: {
          numero: 1,
          varchar: "Hai!",
        },
      }
    );

    (anotherEntity.addComponent as jest.Mock).mockClear();
    testConsume(
      {
        upsert: {
          anotherEntity: {
            varchar: "Boo!",
          },
        },
        remove: {},
      },
      cache,
      {
        anEntity: {
          numero: 1,
          varchar: "Hai!",
        },
      }
    );

    expect(anotherEntity.addComponent).toHaveBeenCalledWith(StrComponent, { value: "Boo!" });


    /** ADD UNREGISTERED COMPONENT ** */
    testConsume(
      {
        upsert: {
          anotherEntity: {
            topping: "cheese",
          },
        },
        remove: {},
      },
      cache,
      {
        anEntity: {
          numero: 1,
          varchar: "Hai!",
        },
      }
    );

    /** UPDATE COMPONENT ** */

    updateComponent(anEntity, StrComponent, { value: "Bai!" });

    // Updating a component created by a diff should not be mentioned in the next diff
    // Caveat: this can be overridden using the global isMine callback
    updateComponent(anotherEntity as any, NumComponent, {
      value: 7,
    });

    testProduce(
      {
        upsert: {
          anEntity: {
            varchar: "Bai!",
          },
        },
        remove: {},
      },
      cache,
      {
        anEntity: {
          numero: 1,
          varchar: "Bai!",
        },
      }
    );

    // Update component in response to incoming message
    testConsume(
      {
        upsert: {
          anotherEntity: {
            varchar: "Ahh!",
          },
        },
        remove: {},
      },
      cache,
      {
        anEntity: {
          numero: 1,
          varchar: "Bai!",
        },
      }
    );

    expect(anotherEntity?.getComponent(StrComponent)?.value).toBe("Ahh!");

    /** NON-UPDATE COMPONENT ** */
    spyOn(anEntity, "getMutableComponent");
    testConsume(
      {
        upsert: {
          anEntity: {
            numero: 1,
          },
        },
        remove: {},
      },
      cache,
      {
        anEntity: {
          numero: 1,
          varchar: "Bai!",
        },
      }
    );

    expect(anEntity.getMutableComponent).not.toHaveBeenCalled();

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
          numero: 1,
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
          numero: 1,
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
      {}
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

  test("createEmptyDiff", () => {
    const result = Correspondent.createEmptyDiff();
    expect(result).toEqual({
      upsert: {},
      remove: {},
    });
  });

  test("setUpsert", () => {
    const diff = Correspondent.createEmptyDiff();
    expect(Correspondent.setUpsert(diff, "anEnt", { c1: 1 })).toEqual({
      upsert: {
        anEnt: {
          c1: 1,
        },
      },
      remove: {},
    });
  });

  test("getUpsert", () => {
    const diff = {
      upsert: {
        anEnt: {
          c1: 1,
        },
      },
      remove: {},
    };

    expect(Correspondent.getUpsert(diff, "anEnt")).toEqual({
      c1: 1,
    });
  });
});
