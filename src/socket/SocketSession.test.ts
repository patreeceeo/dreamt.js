import SocketSession from "./SocketSession";
import * as ECSY from "ecsy";
// import * as PHX from "phoenix";

function iterableToArray<I, A = I>(
  it: Iterable<I>,
  transformItem: (x:I) => A = (x:I)=> x as unknown as A
): Array<A> {
  const list = [];
  for(const item of it) {
    list.push(transformItem(item))
  }
  return list;
}

describe("SocketSession", () => {
  // Use weakmap
  // test("updateSnapshot");
  // test("compareSnapshot");

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

    entityA.id = 1;
    sut.setEntityById(entityA);
    sut.setEntityById(entityB, "B");

    expect(sut.getEntityById(1)).toBe(entityA);
    expect(sut.getEntityById("B")).toBe(entityB);
    expect(listEntityIds(sut)).toEqual([1, "B"]);
    expect(listEntities(sut)).toEqual([entityA, entityB]);

    sut.removeEntityById(entityA);
    expect(listEntityIds(sut)).toEqual(["B"]);
    expect(listEntities(sut)).toEqual([entityB]);
    sut.removeEntityById("B");

    expect(sut.getEntityById(1)).not.toBeDefined();
    expect(sut.getEntityById("B")).not.toBeDefined();
    expect(listEntityIds(sut)).toEqual([]);
    expect(listEntities(sut)).toEqual([]);
  });

  test("(dis)allowComponent + getAllowedComponentIterator", () => {
    function getAllowedComponentList(sut: SocketSession) {
      return iterableToArray(sut.getAllowedComponentIterator());
    }

    class ComponentA extends ECSY.Component<any> {}
    class ComponentB extends ECSY.Component<any> {}

    const sut = new SocketSession();

    sut.allowComponent(ComponentA);
    sut.allowComponent(ComponentB);

    expect(getAllowedComponentList(sut)).toEqual([ComponentA, ComponentB]);

    sut.disallowComponent(ComponentA);

    expect(getAllowedComponentList(sut)).toEqual([ComponentB]);
  });

  // test("connect", ()=> {
  //   const sut = new SocketSession('seance');

  //   sut.connect();
  // });

  // test("pushLocalChangeSet");
});
