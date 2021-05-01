import {Vector2, Vector3, Vector4} from "three";

export function vectorRoundTo(v: Vector2 | Vector3 | Vector4, decimalPlace = 0) {
  const factor = Math.pow(10, decimalPlace);
  v.multiplyScalar(factor).round().divideScalar(factor);
}
