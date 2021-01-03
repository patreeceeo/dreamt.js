import type {World as RealWorld, Entity as RealEntity, ComponentConstructor as RealComponentConstructor} from 'ecsy';

export {RealWorld, RealEntity, RealComponentConstructor};

export function cast<TOut>(o: any): TOut {
  return o as TOut;
}

export interface IWorld extends Partial<RealWorld> {
  __getEntities(): Map<string, IEntity>
}


export interface IEntity extends Partial<RealEntity> {}
