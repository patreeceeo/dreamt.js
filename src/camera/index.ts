import {Camera, Euler, Vector3} from "three";

const v1 = new Vector3();

export function apply3rdPersonView(target: Camera, position: Vector3, lookDirection: Euler, amount: number) {
  v1.set(0, 0, amount).applyEuler(lookDirection);
  target.position.copy(position).sub(v1)
  target.lookAt(position);
}
