import {World} from 'ecsy';
import {observable, runInAction} from 'mobx';
import {addEntities, manageEntities, DreamtComponentConstructor, EntityMap} from './worldUtils';
import {cast, IWorld, IEntity} from './testUtils';

jest.mock('ecsy');

describe("worldUtils", () => {
  test("addEntities", () => {
    const c1 = {} as DreamtComponentConstructor;
    const c2 = {} as DreamtComponentConstructor;
    const toBeAdded: EntityMap = new Map([
      ['a', new Set()],
      ['b', new Set([c1])],
      ['c', new Set([c1, c2])]
    ]);
    const world = new World();
    const added = cast<IWorld>(world).__getEntities();

    addEntities(world, toBeAdded);

    expect(world.createEntity).toHaveBeenCalledTimes(3);
    expect(world.createEntity).toHaveBeenCalledWith('a');
    expect(world.createEntity).toHaveBeenCalledWith('b');
    expect(world.createEntity).toHaveBeenCalledWith('c');

    expect(added.get('a').addComponent).not.toHaveBeenCalled();
    expect(added.get('b').addComponent).toHaveBeenCalledWith(c1);
    expect(added.get('c').addComponent).toHaveBeenCalledWith(c1);
    expect(added.get('c').addComponent).toHaveBeenCalledWith(c2);
  });
});

describe("worldUtils/manageEntities", () => {
  it("facilitates reactive entity creation", async () => {
    const entities = new Map();
    const ball: DreamtComponentConstructor[] = [];
    const entitiesObservable = observable.map(entities);
    const world = new World();

    manageEntities(world, entitiesObservable);

    runInAction(() =>{
      entitiesObservable.set("ball", ball);
    })

    await new Promise((resolve) => setImmediate(resolve));

    expect(world.createEntity).toHaveBeenCalledWith('ball');
  });

  it("facilitates reactively adding components", async () => {
    const rigidBody = {};
    const ball = observable.set<DreamtComponentConstructor>();
    const entitiesObservable = observable.map({ball});
    const world = new World();
    const addedEntities = cast<IWorld>(world).__getEntities();

    manageEntities(world, entitiesObservable);

    runInAction(() =>{
      const ball = entitiesObservable.get("ball");
      cast<Set<any>>(ball).add(rigidBody);
    })

    await new Promise((resolve) => setImmediate(resolve));

    // casting to IEntity since it's "possibly undefined" from `tsc`'s
    // perspective, but we know it isn't ;)
    const ballEntity = cast<IEntity>(addedEntities.get("ball"));
    expect(ballEntity.addComponent).toHaveBeenCalledWith(rigidBody);
  });
});
