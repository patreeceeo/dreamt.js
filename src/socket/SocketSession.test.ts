import SocketSession from "./SocketSession";
import * as ECSY from "ecsy";
import { cast } from "../testUtils";

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

function listEntityIds(sut: SocketSession) {
  return iterableToArray(sut.getEntityIterator(), (entry) => entry[0]);
}

function listEntities(sut: SocketSession) {
  return iterableToArray(sut.getEntityIterator(), (entry) => entry[1]);
}
// TODO rename to Transporter
describe("SocketSession", () => {
  test("set/get/removeEntityById + getEntityIterator", () => {
    const world = new ECSY.World();
    const sut = new SocketSession(world);
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
    function getAllowedComponentIdList(sut: SocketSession) {
      return iterableToArray(
        sut.getAllowedComponentIterator(),
        (entry) => entry[0]
      );
    }
    function getAllowedComponentList(sut: SocketSession) {
      return iterableToArray(
        sut.getAllowedComponentIterator(),
        (entry) => entry[1]
      );
    }

    class ComponentA extends ECSY.Component<any> {}
    class ComponentB extends ECSY.Component<any> {}

    const world = new ECSY.World();
    const sut = new SocketSession(world);

    sut.allowComponent("a", ComponentA);
    sut.allowComponent("b", ComponentB);

    expect(getAllowedComponentIdList(sut)).toEqual(["a", "b"]);
    expect(getAllowedComponentList(sut)).toEqual([ComponentA, ComponentB]);

    sut.disallowComponent("a");

    expect(getAllowedComponentIdList(sut)).toEqual(["b"]);
    expect(getAllowedComponentList(sut)).toEqual([ComponentB]);
  });

  test("_getOutgoing + _handleIncoming", () => {
    class ComponentA extends ECSY.Component<any> {
      value?: number;
    }
    class ComponentB extends ECSY.Component<any> {}
    class ComponentC extends ECSY.Component<any> {
      value?: string;
    }

    const world = new ECSY.World()
      .registerComponent(ComponentA)
      .registerComponent(ComponentB);
    const entityA = world
      .createEntity("a")
      .addComponent(ComponentA, { value: 1 })
      .addComponent(ComponentB, { value: 2 });
    const sut = new SocketSession(world);

    sut.allowComponent("aComponent", ComponentA);
    sut.allowComponent("anotherComponent", ComponentC);
    sut.registerEntity("anEntity", entityA);

    expect(sut._getOutgoing()).toEqual({
      anEntity: {
        aComponent: { value: 1 },
      },
    });

    expect(sut._getOutgoing()).toEqual({});

    const component = entityA?.getMutableComponent(ComponentA);
    if (component) {
      component.value = 2;
    }

    expect(sut._getOutgoing()).toEqual({
      anEntity: {
        aComponent: { value: 2 },
      },
    });

    sut._handleIncoming({
      body: {
        anEntity: {
          aComponent: { value: 5 },
        },
      },
    });

    // Updates that were just recieved shouldn't be included in outgoing
    // updates
    expect(sut._getOutgoing()).toEqual({});
    expect(component?.value).toBe(5);

    // Create entities
    sut._handleIncoming({
      body: {
        anEntity: {
          aComponent: { value: 5 },
        },
        anotherEntity: {
          aComponent: { value: 6 },
        },
      },
    });

    expect(listEntityIds(sut)).toEqual(['anEntity', 'anotherEntity']);
    const anotherEntity = sut.getEntityById('anotherEntity');
    expect(anotherEntity?.getComponent(ComponentA)?.value).toBe(6);

    // Add components
    sut._handleIncoming({
      body: {
        anEntity: {
          aComponent: { value: 5 },
        },
        anotherEntity: {
          aComponent: { value: 6 },
          anotherComponent: { value: "Boo!" }
        },
      },
    });

    expect(anotherEntity?.getComponent(ComponentC)?.value).toBe("Boo!");
    expect(sut._getOutgoing()).toEqual({});
    // Remove entities
    // Remove components
  });

  test("connect + pushUpdates", () => {
    const world = new ECSY.World();
    const sut = new SocketSession(world);
    spyOn(sut, "_getOutgoing").and.returnValue({
      anEntity: {
        aComponent: {
          value: 1,
        },
      },
    });

    sut.connect("seance");

    expect(sut._socket?.endPointURL()).toEqual("/socket");
    expect(sut._socket?.connect).toHaveBeenCalledTimes(1);
    expect(sut._socket?.channel).toHaveBeenCalledTimes(1);
    expect(sut._socket?.channel).toHaveBeenCalledWith("seance");
    expect(sut._channel?.on).toHaveBeenCalledWith(
      "update_entities",
      sut._handleIncoming
    );

    // Should not recreate socket/channel if exists already
    sut.connect("seance");

    cast<jest.Mock>(sut._socket?.channel).mockReset();
    expect(sut._socket?.channel).toHaveBeenCalledTimes(0);

    sut.pushUpdates();
    expect(sut._channel?.push).toHaveBeenCalledTimes(1);
    expect(sut._channel?.push).toHaveBeenCalledWith("update_entities", {
      body: {
        anEntity: {
          aComponent: { value: 1 },
        },
      },
    });
  });
});
