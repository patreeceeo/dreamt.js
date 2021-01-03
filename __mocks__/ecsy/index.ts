import {cast, IWorld, IEntity, RealEntity, RealComponentConstructor} from '../../src/testUtils';

export class Entity implements IEntity {
  addComponent = jest.fn((c: RealComponentConstructor<any>) => {
    void c;
    return cast<RealEntity>(this);
  });
}

export class World implements IWorld {
  entities = new Map<string, Entity>();

  createEntity = jest.fn((name: string) => {
    const entity = new Entity();
    this.entities.set(name, entity);
    return cast<RealEntity>(entity);
  })

  __getEntities(): Map<string, Entity> {
    return this.entities;
  }
}
