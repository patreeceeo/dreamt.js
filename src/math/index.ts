import {Euler, Quaternion, Vector2, Vector3, Vector4} from "three";

const q1 = new Quaternion();
const v1 = new Vector3();
const vUp = new Vector3(0, 1, 0);

export function vectorRoundTo(v: Vector2 | Vector3 | Vector4, decimalPlace = 0) {
  const factor = Math.pow(10, decimalPlace);
  v.multiplyScalar(factor).round().divideScalar(factor);
}

export function measureEulerBetweenVectors(target: Euler, vecA: Vector3, vecB: Vector3, qRotIntermediate = q1) {
  qRotIntermediate.setFromUnitVectors(vecA, vecB);
  target.setFromQuaternion(qRotIntermediate);
}

export function calculateEulerAngleBetweenPoints(target: Euler, pointA: Vector3, pointB: Vector3, v0Angle = vUp) {
  v1.copy(pointB).sub(pointA).normalize();
  measureEulerBetweenVectors(target, v0Angle, v1)
}

