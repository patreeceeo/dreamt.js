import SocketSession from "./SocketSession";
import * as ECSY from "ecsy";
// import * as PHX from "phoenix";

// class ComponentA extends ECSY.Component<any> {}
// class ComponentB extends ECSY.Component<any> {}

describe("SocketSession", () => {

  // Use weakmap
  // test("updateSnapshot");
  // test("compareSnapshot");

  test("set/get/removeEntityById", () => {
    const sut = new SocketSession();
    const world = new ECSY.World();
    const entityA = world.createEntity("a");
    const entityB = world.createEntity("b");

    entityA.id = 1;
    sut.setEntityById(entityA);
    sut.setEntityById(entityB, "B");

    expect(sut.getEntityById(1)).toBe(entityA);
    expect(sut.getEntityById("B")).toBe(entityB);

    sut.removeEntityById(entityA.id);
    sut.removeEntityById("B");

    expect(sut.getEntityById(1)).not.toBeDefined();
    expect(sut.getEntityById("B")).not.toBeDefined();
  });

  // test("set/removeWhitelistedComponent + getComponentWhitelist", () => {
  //   const sut = new SocketSession();

  //   sut.setWhitelistedComponent(ComponentA);
  //   sut.setWhitelistedComponent(ComponentB);

  //   expect(sut.getComponentWhitelist()).toEqual([
  //     ComponentA,
  //     ComponentB
  //   ]);

  //   sut.removeWhitelistedComponent(ComponentA);

  //   expect(sut.getComponentWhitelist()).toEqual([
  //     ComponentB
  //   ])
  // });

  // test("connect", ()=> {
  //   const sut = new SocketSession('seance');

  //   sut.connect();
  // });

  // test("pushLocalChangeSet");

});
