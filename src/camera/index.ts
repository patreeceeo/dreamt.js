import { Euler, Object3D, Vector3 } from "three";
import { intersectLineWithPlane } from "../math";

const v1 = new Vector3();
const groundNormal = new Vector3(0, -1, 0);
const e1 = new Euler();
const o1 = new Object3D();

export function apply3rdPersonView(
  target: Object3D,
  position: Vector3,
  lookDirection: Euler,
  cameraSetback: number,
  cameraElevation: number,
  bodyCylinderRadius = 0
) {
  const unrestrictedCamera = o1;
  let cameraRigAngleX = lookDirection.x;

  if (bodyCylinderRadius > 0) {
    const cameraRigAngle = e1;
    const minAngle = -Math.atan(cameraElevation / bodyCylinderRadius);

    cameraRigAngle.copy(lookDirection);
    cameraRigAngleX = Math.max(lookDirection.x, minAngle);
    cameraRigAngle.x = cameraRigAngleX;
    apply3rdPersonViewSimple(target, position, cameraRigAngle, cameraSetback);
  } else {
    apply3rdPersonViewSimple(target, position, lookDirection, cameraSetback);
  }

  const groundIntersection =
    cameraRigAngleX < 0
      ? intersectLineWithPlane(
          position,
          target.position,
          groundNormal,
          position.y - cameraElevation
        )
      : null;

  if (groundIntersection) {
    target.position.copy(groundIntersection);
  }

  if (groundIntersection || cameraRigAngleX !== lookDirection.x) {
    apply3rdPersonViewSimple(
      unrestrictedCamera,
      position,
      lookDirection,
      -cameraSetback
    );

    target.rotation.copy(unrestrictedCamera.rotation)
  }
}

function apply3rdPersonViewSimple(
  target: Object3D,
  position: Vector3,
  lookDirection: Euler,
  cameraSetback: number
) {
  const fullSetbackDelta = v1;

  fullSetbackDelta.set(0, 0, cameraSetback).applyEuler(lookDirection);

  target.position.copy(position).sub(fullSetbackDelta);
  target.lookAt(position);
}
