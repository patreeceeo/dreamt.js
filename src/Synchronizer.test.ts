import NetworkTransporter, {
  IEntityComponentDiff,
  IUpdateEntitiesMessage,
} from "./Synchronizer";
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

function listEntityIds(sut: NetworkTransporter) {
  return iterableToArray(sut.getEntityIterator(), (entry) => entry[0]);
}

function listEntities(sut: NetworkTransporter) {
  return iterableToArray(sut.getEntityIterator(), (entry) => entry[1]);
}

function constructSut(
  world: ECSY.World,
  pushMessage = (messageType: string, m: IUpdateEntitiesMessage) => {
    void messageType, m;
  },
  addHandler = (
    messageType: string,
    handler = (m: IUpdateEntitiesMessage) => {
      void m;
    }
  ) => {
    void handler, messageType;
  }
) {
  return new NetworkTransporter(world, pushMessage, addHandler);
}

describe("Synchronizer", () => {
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
    function getAllowedComponentIdList(sut: NetworkTransporter) {
      return iterableToArray(
        sut.getAllowedComponentIterator(),
        (entry) => entry[0]
      );
    }
    function getAllowedComponentList(sut: NetworkTransporter) {
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

  test("getDiff + _handleIncoming", () => {
    class NumComponent extends ECSY.Component<any> {
      value?: number;
    }
    class ExcludedComponent extends ECSY.Component<any> {}
    class StrComponent extends ECSY.Component<any> {
      value?: string;
    }

    const world = new ECSY.World()
      .registerComponent(NumComponent)
      .registerComponent(ExcludedComponent);
    const sut = constructSut(world);

    // TODO find a way to DRY this test

    /*** CREATE ENTITY ***/

    // Create original entity
    const anEntity = world
      .createEntity("a")
      .addComponent(NumComponent, { value: 1 })
      .addComponent(ExcludedComponent, { value: 2 });
    sut.registerEntity("anEntity", anEntity);
    sut.allowComponent("numero", NumComponent);
    sut.allowComponent("varchar", StrComponent);

    expect(sut.getDiffToBePushed()).toEqual({
      upsert: {
        anEntity: {
          numero: { value: 1 },
        },
      },
      remove: {},
    } as IEntityComponentDiff);

    // Duplicate entity from incoming message
    sut._handleIncoming({
      body: {
        upsert: {
          anotherEntity: {
            numero: { value: 6 },
          },
        },
        remove: {},
      },
    });

    const anotherEntity = sut.getEntityById("anotherEntity");
    expect(anotherEntity?.getComponent(NumComponent)?.value).toBe(6);
    // So it knows not to send this back
    expect(sut._serverWorldModel).toEqual({
      anotherEntity: {
        numero: { value: 6 },
      },
    });

    // Should add locally created entity to _serverWorldModel
    sut.pushDiff();
    expect(sut._serverWorldModel).toEqual({
      anEntity: {
        numero: { value: 1 },
      },
      anotherEntity: {
        numero: { value: 6 },
      },
    });

    /*** ADD COMPONENT ***/

    // Originate adding of a component
    anEntity.addComponent(StrComponent, { value: "Hai!" });

    expect(sut.getDiffToBePushed()).toEqual({
      upsert: {
        anEntity: {
          varchar: { value: "Hai!" },
        },
      },
      remove: {},
    } as IEntityComponentDiff);

    // Add component in response to incoming message
    sut._handleIncoming({
      body: {
        upsert: {
          anotherEntity: {
            varchar: { value: "Boo!" },
          },
        },
        remove: {},
      },
    });

    expect(anotherEntity?.getComponent(StrComponent)?.value).toBe("Boo!");
    // So it knows not to send this back
    expect(sut._serverWorldModel).toEqual({
      anEntity: {
        numero: { value: 1 },
      },
      anotherEntity: {
        numero: { value: 6 },
        varchar: { value: "Boo!" },
      },
    });

    sut.pushDiff();
    expect(sut._serverWorldModel).toEqual({
      anEntity: {
        numero: { value: 1 },
        varchar: { value: "Hai!" },
      },
      anotherEntity: {
        numero: { value: 6 },
        varchar: { value: "Boo!" },
      },
    });

    /*** UPDATE COMPONENT ***/

    // Originate update of a component
    updateComponent(anEntity, StrComponent, { value: "Bai!" });

    expect(sut.getDiffToBePushed()).toEqual({
      upsert: {
        anEntity: {
          varchar: { value: "Bai!" },
        },
      },
      remove: {},
    } as IEntityComponentDiff);

    // Update component in response to incoming message
    sut._handleIncoming({
      body: {
        upsert: {
          anotherEntity: {
            varchar: { value: "Ahh!" },
          },
        },
        remove: {},
      },
    });

    expect(anotherEntity?.getComponent(StrComponent)?.value).toBe("Ahh!");
    // So it knows not to send this back
    expect(sut._serverWorldModel).toEqual({
      anEntity: {
        numero: { value: 1 },
        varchar: { value: "Hai!" },
      },
      anotherEntity: {
        numero: { value: 6 },
        varchar: { value: "Ahh!" },
      },
    });

    sut.pushDiff();
    expect(sut._serverWorldModel).toEqual({
      anEntity: {
        numero: { value: 1 },
        varchar: { value: "Bai!" },
      },
      anotherEntity: {
        numero: { value: 6 },
        varchar: { value: "Ahh!" },
      },
    });

    /*** REMOVE COMPONENT ***/

    // Originate removal of component
    anEntity.removeComponent(StrComponent);

    expect(sut.getDiffToBePushed()).toEqual({
      upsert: {},
      remove: {
        anEntity: {
          varchar: true,
        },
      },
    });

    // Remove component in response to incoming message
    sut._handleIncoming({
      body: {
        upsert: {},
        remove: {
          anotherEntity: {
            varchar: true,
          },
        },
      },
    });

    expect(anotherEntity?.hasComponent(StrComponent)).toBe(false);
    // So it knows not to send this back
    expect(sut._serverWorldModel).toEqual({
      anEntity: {
        numero: { value: 1 },
        varchar: { value: "Bai!" },
      },
      anotherEntity: {
        numero: { value: 6 },
      },
    });

    sut.pushDiff();
    expect(sut._serverWorldModel).toEqual({
      anEntity: {
        numero: { value: 1 },
      },
      anotherEntity: {
        numero: { value: 6 },
      },
    });

    /*** REMOVE ENTITY ***/

    // Originate removal of entity
    anEntity.remove();

    expect(sut.getDiffToBePushed()).toEqual({
      upsert: {},
      remove: {
        anEntity: true,
      },
    });

    // Remove entity in response to incoming message
    cast<jest.Mock>(anotherEntity?.remove).mockClear();
    sut._handleIncoming({
      body: {
        upsert: {},
        remove: {
          anotherEntity: true,
        },
      },
    });

    expect(anotherEntity?.remove).toHaveBeenCalledTimes(1);
    // So it knows not to send this back
    expect(sut._serverWorldModel).toEqual({
      anEntity: {
        numero: { value: 1 },
      },
    });

    sut.pushDiff();
    expect(sut._serverWorldModel).toEqual({});
  });

  test("getDiffToBePushed", () => {
    // it calls getDiff with _networkWorldModel and returns the result
    const world = new ECSY.World();
    const sut = constructSut(world);

    sut._serverWorldModel = {};
    spyOn(sut, "getDiff").and.callFake((x) => x);

    const result = sut.getDiffToBePushed();
    expect(result).toBe(sut._serverWorldModel);
  });

  test("adding message handler", () => {
    const world = new ECSY.World();
    const addHandler = jest.fn();
    const sut = new NetworkTransporter(world, () => {}, addHandler);

    expect(addHandler).toHaveBeenCalledWith(
      "update_entities",
      sut._handleIncoming
    );
  });

  test("pushDiff", () => {
    const world = new ECSY.World();
    const pushMessage = jest.fn();
    const sut = new NetworkTransporter(world, pushMessage, () => {});
    spyOn(sut, "getDiffToBePushed").and.returnValue({
      upsert: {
        anEntity: {
          aComponent: {
            value: 1,
          },
        },
      },
      remove: {},
    } as IEntityComponentDiff);

    sut.pushDiff();
    expect(pushMessage).toHaveBeenCalledTimes(1);
    expect(pushMessage).toHaveBeenCalledWith("update_entities", {
      body: {
        upsert: {
          anEntity: {
            aComponent: {
              value: 1,
            },
          },
        },
        remove: {},
      },
    });
  });
});
