import type {World as RealWorld, Entity as RealEntity, ComponentConstructor as RealComponentConstructor} from 'ecsy';

export {RealWorld, RealEntity, RealComponentConstructor};

export function cast<TOut>(o: any): TOut {
  return o as TOut;
}

export interface IWorld extends Partial<RealWorld> {
  __getEntities(): Map<string, IEntity>
}


export interface IEntity extends Partial<RealEntity> {}


export const asyncActivity = (delayMs = 0) => new Promise((resolve) => setTimeout(resolve, delayMs));

export function getSpyCallArg(fn: any, callIdx: number, argIdx: number) {
  return (fn as jasmine.Spy).calls.argsFor(callIdx)[argIdx];
}
export function getMockCallArg(fn: any, callIdx: number, argIdx: number) {
  return (fn as jest.Mock).mock.calls[callIdx][argIdx];
}
