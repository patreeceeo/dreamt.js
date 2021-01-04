import {World} from 'ecsy';
import {observable, runInAction} from 'mobx';
import {actions, addEntities, manageEntities, DreamtComponentConstructor, EntityMap} from './worldUtils';
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

    // casting to IEntity since it's "possibly undefined" from `tsc`'s
    // perspective, but we know it isn't ;)
    const entityA = cast<IEntity>(added.get('a'));
    const entityB = cast<IEntity>(added.get('b'));
    const entityC = cast<IEntity>(added.get('c'));
    expect(entityA.addComponent).not.toHaveBeenCalled();
    expect(entityB.addComponent).toHaveBeenCalledWith(c1);
    expect(entityC.addComponent).toHaveBeenCalledWith(c1);
    expect(entityC.addComponent).toHaveBeenCalledWith(c2);
  });
});

describe("worldUtils/manageEntities", () => {
  it("facilitates reactive entity creation", async () => {
    const ball: DreamtComponentConstructor[] = [];
    const entitiesObservable = observable.map();
    const world = new World();

    manageEntities(world, entitiesObservable, observable.map());

    runInAction(() =>{
      entitiesObservable.set("ball", ball);
    })

    await new Promise((resolve) => setImmediate(resolve));

    expect(world.createEntity).toHaveBeenCalledWith('ball');
  });

  it("facilitates reactive entity destruction", async () => {
    // be wary of memory leaks!
    const pacman = observable.set<DreamtComponentConstructor>();
    const pwrup = observable.set<DreamtComponentConstructor>();
    const entitiesObservable = observable.map({pacman, pwrup});
    const actionsObservable = observable.map();
    const world = new World();
    const addedEntities = cast<IWorld>(world).__getEntities();

    manageEntities(world, entitiesObservable, actionsObservable);

    // allow entities to be added
    await new Promise((resolve) => setImmediate(resolve));
    const puEntity = cast<IEntity>(addedEntities.get("pwrup"));

    runInAction(() => {
      actionsObservable.set(puEntity, actions.REMOVE);
    });

    // allow entities to be removed
    await new Promise((resolve) => setImmediate(resolve));

    const pmEntity = cast<IEntity>(addedEntities.get("pacman"));
    expect(pmEntity.remove).not.toHaveBeenCalled();
    expect(puEntity.remove).toHaveBeenCalledTimes(1);
    // it should clear actions once they've executed
    expect(actionsObservable.size).toBe(0);
  });

  it("facilitates reactively adding components", async () => {
    const rigidBody = {};
    const ball = observable.set<DreamtComponentConstructor>();
    const entitiesObservable = observable.map({ball});
    const world = new World();
    const addedEntities = cast<IWorld>(world).__getEntities();

    manageEntities(world, entitiesObservable, observable.map());

    runInAction(() =>{
      const ball = entitiesObservable.get("ball");
      cast<Set<any>>(ball).add(rigidBody);
    })

    await new Promise((resolve) => setImmediate(resolve));

    const ballEntity = cast<IEntity>(addedEntities.get("ball"));
    expect(ballEntity.addComponent).toHaveBeenCalledWith(rigidBody);
  });
});
