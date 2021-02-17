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

describe("SocketSession", () => {

  test("set/get/removeEntityById + getEntityIterator", () => {
    function listEntityIds(sut: SocketSession) {
      return iterableToArray(sut.getEntityIterator(), (entry) => entry[0]);
    }

    function listEntities(sut: SocketSession) {
      return iterableToArray(sut.getEntityIterator(), (entry) => entry[1]);
    }

    const sut = new SocketSession();
    const world = new ECSY.World();
    const entityA = world.createEntity("a");
    const entityB = world.createEntity("b");

    expect(listEntityIds(sut)).toEqual([]);
    expect(listEntities(sut)).toEqual([]);

    sut.setEntityById("A", entityA);
    sut.setEntityById("B", entityB);

    expect(sut.getEntityById("A")).toBe(entityA);
    expect(sut.getEntityById("B")).toBe(entityB);
    expect(listEntityIds(sut)).toEqual(["A", "B"]);
    expect(listEntities(sut)).toEqual([entityA, entityB]);

    sut.removeEntityById("A");
    expect(listEntityIds(sut)).toEqual(["B"]);
    expect(listEntities(sut)).toEqual([entityB]);
    sut.removeEntityById("B");

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

    const sut = new SocketSession();

    sut.allowComponent("a", ComponentA);
    sut.allowComponent("b", ComponentB);

    expect(getAllowedComponentIdList(sut)).toEqual(["a", "b"]);
    expect(getAllowedComponentList(sut)).toEqual([ComponentA, ComponentB]);

    sut.disallowComponent("a");

    expect(getAllowedComponentIdList(sut)).toEqual(["b"]);
    expect(getAllowedComponentList(sut)).toEqual([ComponentB]);
  });

  test("getUpdates", () => {
    class ComponentA extends ECSY.Component<any> {
      value?: number;
    }
    class ComponentB extends ECSY.Component<any> {}

    const world = new ECSY.World()
      .registerComponent(ComponentA)
      .registerComponent(ComponentB);
    const entityA = world
      .createEntity("a")
      .addComponent(ComponentA, { value: 1 })
      .addComponent(ComponentB, { value: 2 });
    const sut = new SocketSession();

    sut.allowComponent("aComponent", ComponentA);
    sut.setEntityById("anEntity", entityA);

    expect(sut.getUpdates()).toEqual({
      anEntity: {
        aComponent: { value: 1 },
      },
    });

    expect(sut.getUpdates()).toEqual({});

    const component = entityA?.getMutableComponent(ComponentA);
    if (component) {
      component.value = 2;
    }

    expect(sut.getUpdates()).toEqual({
      anEntity: {
        aComponent: { value: 2 },
      },
    });
  });

  test("connect + pushUpdates", () => {
    const sut = new SocketSession();
    spyOn(sut, "getUpdates").and.returnValue({
      anEntity: {
        aComponent: {
          value: 1,
        },
      },
    });

    sut.connect("seance");

    expect(sut.socket?.endPointURL()).toEqual("/socket");
    expect(sut.socket?.connect).toHaveBeenCalledTimes(1);
    expect(sut.socket?.channel).toHaveBeenCalledTimes(1);
    expect(sut.socket?.channel).toHaveBeenCalledWith("seance");

    // Should not recreate socket/channel if exists already
    sut.connect("seance");

    cast<jest.Mock>(sut.socket?.channel).mockReset();
    expect(sut.socket?.channel).toHaveBeenCalledTimes(0);

    // Sends data over the socket representing changes since last call
    // WRT the allowed components of all registered entities
    sut.pushUpdates();
    expect(sut.channel?.push).toHaveBeenCalledTimes(1);
    expect(sut.channel?.push).toHaveBeenCalledWith("update_entities", {
      body: {
        anEntity: {
          aComponent: { value: 1 },
        },
      },
    });
  });
});
