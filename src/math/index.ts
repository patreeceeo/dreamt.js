import {
  Euler,
  Vector2,
  Vector3,
  Vector4,
} from "three";

import * as objectPools from '../pools';

const q0 = objectPools.scratch(0, objectPools.acquireQuaternion);
const v0 = objectPools.scratch(0, objectPools.acquireVector3);
const e0 = objectPools.scratch(0, objectPools.acquireEuler);
const p0 = objectPools.scratch(0, objectPools.acquirePlane);
const l0 = objectPools.scratch(0, objectPools.acquireLine3);

export const vUp = Object.freeze(objectPools.acquireVector3().set(0, 1, 0));

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
  qRotIntermediate = q0
) {
  qRotIntermediate.setFromUnitVectors(vecA, vecB);
  target.setFromQuaternion(qRotIntermediate);
}

export function calculateEulerBetweenPoints(
  pointA: Vector3,
  pointB: Vector3,
  target = e0,
  v0Angle = vUp
) {
  v0.copy(pointB).sub(pointA).normalize();
  measureEulerBetweenVectors(target, v0Angle, v0);
  return target;
}

export function intersectLineWithPlane(
  linePointA: Vector3,
  linePointB: Vector3,
  planeNormal: Vector3,
  planeConstant: number,
  target = v0
): Vector3 | null {
  l0.set(linePointA, linePointB);
  p0.set(planeNormal, planeConstant);
  return p0.intersectLine(l0, target);
}

