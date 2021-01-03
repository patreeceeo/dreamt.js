import {Entity, World} from 'ecsy';
import {observable, runInAction} from 'mobx';
import {addEntities, manageEntities, DreamtComponentConstructor, EntityMap} from './worldUtils';

function mockEntity(): Partial<Entity> {
  return {
    addComponent: jest.fn()
  };
}

describe("worldUtils", () => {
  test("addEntities", () => {
    const c1 = {} as DreamtComponentConstructor;
    const c2 = {} as DreamtComponentConstructor;
    const added = new Map();
    const toBeAdded: EntityMap = new Map([
      ['a', new Set()],
      ['b', new Set([c1])],
      ['c', new Set([c1, c2])]
    ]);
    const world = new World();
    spyOn(world, "createEntity").and.callFake(
      (name: string) => {
        const entity = mockEntity();
        added.set(name, entity)
        return entity as Entity;
      }
    )

    addEntities(world as World, toBeAdded);

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

    spyOn(world, "createEntity");

    manageEntities(world, entitiesObservable);

    runInAction(() =>{
      entitiesObservable.set("ball", ball);
    })

    await new Promise((resolve) => setImmediate(resolve));

    expect(world.createEntity).toHaveBeenCalledWith('ball');
  });
});
