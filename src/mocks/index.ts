import {cast, IWorld, IEntity, RealEntity, RealComponentConstructor} from '../testUtils';

export class Entity implements IEntity {
  _components = {} as any;
  _componentData = {} as any;
  addComponent = jest.fn((C: RealComponentConstructor<any>, data) => {
    this._components[C.name] = new C(data);
    return cast<RealEntity>(this);
  });

  getComponent(C: RealComponentConstructor<any>) {
    return this._components[C.name];
  }

  remove = jest.fn();
}


export class System {}

export class Component {
  isComponent = true;
  constructor(data: any) {
    Object.assign(this, data);
  }
}

export const Types = {
  String: 'String'
};

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

  registerComponent = jest.fn();
  registerSystem = jest.fn();
}
