import { ObjectPool } from "ecsy/src/ObjectPool";
import {
  Euler,
  Plane,
  Quaternion,
  Vector3,
  Vector4,
  Line3,
  Object3D,
} from "three";
import { provider } from "./provider";
import { lazyFactory } from "./lazy";

const mapPool = new ObjectPool<Map<any, any>>(Map as any);
const getEulerPool = lazyFactory(() => new ObjectPool<Euler>(provider.get("Euler") as any));
const getPlanePool = lazyFactory(() => new ObjectPool<Plane>(provider.get("Plane") as any));
const getQuaterionPool = lazyFactory(() => new ObjectPool<Quaternion>(
  provider.get("Quaternion") as any
));
const getVector3Pool = lazyFactory(() => new ObjectPool<Vector3>(provider.get("Vector3") as any));
const getVector4Pool = lazyFactory(() => new ObjectPool<Vector4>(provider.get("Vector4") as any));
const getLine3Pool = lazyFactory(() => new ObjectPool<Line3>(provider.get("Line3") as any));
const getObject3DPool = lazyFactory(() => new ObjectPool<Object3D>(provider.get("Object3D") as any));

export function acquireMap() {
  return mapPool.acquire();
}
export function acquireEuler() {
  return getEulerPool().acquire();
}
export function acquirePlane() {
  return getPlanePool().acquire();
}
export function acquireQuaternion() {
  return getQuaterionPool().acquire();
}
export function acquireVector3() {
  return getVector3Pool().acquire();
}
export function acquireVector4() {
  return getVector4Pool().acquire();
}
export function acquireLine3() {
  return getLine3Pool().acquire();
}
export function acquireObject3D() {
  return getObject3DPool().acquire();
}
