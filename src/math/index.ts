import { Euler, Vector2, Vector3, Vector4 } from "three";
import { lazyFactory } from "../lazy";
import {
  acquireLine3,
  acquirePlane,
  acquireQuaternion,
  acquireVector3,
  acquireEuler,
  scratch,
} from "../pools";

export const getUpVector = lazyFactory(() =>
  Object.freeze(acquireVector3().set(0, 1, 0))
);

export function vectorRoundTo(
  v: Vector2 | Vector3 | Vector4,
  decimalPlace = 0
) {
  const factor = Math.pow(10, decimalPlace);
  v.multiplyScalar(factor).round().divideScalar(factor);
}

export function measureEulerBetweenVectors(
  target: Euler,
  vecA: Vector3,
  vecB: Vector3,
  qRotIntermediate = scratch(0, acquireQuaternion)
) {
  qRotIntermediate.setFromUnitVectors(vecA, vecB);
  target.setFromQuaternion(qRotIntermediate);
}

export function calculateEulerBetweenPoints(
  pointA: Vector3,
  pointB: Vector3,
  target = scratch(0, acquireEuler),
  v0Angle = getUpVector()
) {
  const normalVector = scratch(0, acquireVector3);
  normalVector.copy(pointB).sub(pointA).normalize();
  measureEulerBetweenVectors(target, v0Angle, normalVector);
  return target;
}

export function intersectLineWithPlane(
  linePointA: Vector3,
  linePointB: Vector3,
  planeNormal: Vector3,
  planeConstant: number,
  target = scratch(0, acquireVector3)
): Vector3 | null {
  const line = scratch(0, acquireLine3);
  const plane = scratch(0, acquirePlane);
  line.set(linePointA, linePointB);
  plane.set(planeNormal, planeConstant);
  return plane.intersectLine(line, target);
}
