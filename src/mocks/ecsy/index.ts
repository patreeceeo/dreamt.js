import {cast, IWorld, IEntity, RealWorld, RealEntity, RealComponentConstructor} from '../../testUtils';

export class Entity implements IEntity {
  alive = false;
  _components = {} as {[key: string]: RealComponentConstructor<any>};

  addComponent = jest.fn((Class: RealComponentConstructor<any>, data) => {
    const instance = new Class(data);
    this._components[Class.name] = instance;
    return cast<RealEntity>(this);
  });

  removeComponent(Class: RealComponentConstructor<any>) {
    delete this._components[Class.name];
    return cast<RealEntity>(this);
  }

  getComponent = cast<RealEntity["getComponent"]>((C: RealComponentConstructor<any>) => {
    return this._components[C.name];
  })

  getMutableComponent = this.getComponent

  hasComponent(C: RealComponentConstructor<any>) {
    return !!this._components[C.name];
  }

  remove = jest.fn(() => {
    this.alive = false;
  });
}


export class System {}

export class Component {
  isComponent = true;
  constructor(data: any) {
    Object.assign(this, data);
  }
}

export const Types = {
  String: 'String',
  Number: 'Number'
};

export class World implements IWorld {
  entities = new Map<string, Entity>();

  createEntity = jest.fn((name: string) => {
    const entity = new Entity();
    entity.alive = true;
    this.entities.set(name, entity);
    return cast<RealEntity>(entity);
  })

  __getEntities(): Map<string, Entity> {
    return this.entities;
  }

  registerComponent = cast<RealWorld["registerComponent"]>(jest.fn(() => this));
  registerSystem = cast<RealWorld["registerSystem"]>(jest.fn(() => this));
}
