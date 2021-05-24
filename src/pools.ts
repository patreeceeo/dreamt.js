import {ObjectPool} from 'ecsy/src/ObjectPool';
import { Euler, Plane, Quaternion, Vector3, Vector4, Line3, Object3D } from "three";
import {provider} from './provider';

const eulers = new ObjectPool<Euler>(provider.get("Euler") as any)
const planes = new ObjectPool<Plane>(provider.get("Plane") as any)
const quaterions = new ObjectPool<Quaternion>(provider.get("Quaternion") as any)
const vector3 = new ObjectPool<Vector3>(provider.get("Vector3") as any)
const vector4 = new ObjectPool<Vector4>(provider.get("Vector4") as any)
const line3 = new ObjectPool<Line3>(provider.get("Line3") as any)
const object3D = new ObjectPool<Object3D>(provider.get("Object3D") as any)

const scratchPad = new Map<[number, () => any], any>();
export function scratch<T>(index: number, acquireFn: () => T): T {
  const key = [index, acquireFn] as [number, () => T];
  const result = scratchPad.get(key) || acquireFn()
  scratchPad.set(key, result)
  return result;
}

export function acquireEuler() {
  return eulers.acquire();
}
export function acquirePlane() {
  return planes.acquire();
}
export function acquireQuaternion() {
  return quaterions.acquire();
}
export function acquireVector3() {
  return vector3.acquire();
}
export function acquireVector4() {
  return vector4.acquire();
}
export function acquireLine3() {
  return line3.acquire();
}
export function acquireObject3D() {
  return object3D.acquire();
}
