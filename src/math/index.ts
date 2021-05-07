import {
  Euler,
  Plane,
  Quaternion,
  Vector2,
  Vector3,
  Vector4,
  Line3,
} from "three";

const q1 = new Quaternion();
const v1 = new Vector3();
const e1 = new Euler();
const p1 = new Plane();
const l1 = new Line3();

export const vUp = Object.freeze(new Vector3(0, 1, 0));

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
  qRotIntermediate = q1
) {
  qRotIntermediate.setFromUnitVectors(vecA, vecB);
  target.setFromQuaternion(qRotIntermediate);
}

export function calculateEulerBetweenPoints(
  pointA: Vector3,
  pointB: Vector3,
  target = e1,
  v0Angle = vUp
) {
  v1.copy(pointB).sub(pointA).normalize();
  measureEulerBetweenVectors(target, v0Angle, v1);
  return target;
}

export function intersectLineWithPlane(
  linePointA: Vector3,
  linePointB: Vector3,
  planeNormal: Vector3,
  planeConstant: number,
  target = v1
): Vector3 | null {
  l1.set(linePointA, linePointB);
  p1.set(planeNormal, planeConstant);
  return p1.intersectLine(l1, target);
}

