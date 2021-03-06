import { Euler, Object3D, Vector3 } from "three";
import { intersectLineWithPlane } from "../math";
import { vector3Pool, eulerPool, object3DPool } from "../pools";
import { scratch } from "../scratch";

export function apply3rdPersonView(
  target: Object3D,
  position: Vector3,
  lookDirection: Euler,
  cameraSetback: number,
  cameraElevation: number,
  bodyCylinderRadius = 0
) {
  const unrestrictedCamera = scratch(0, object3DPool.acquireValue);
  const groundNormal = scratch(0, vector3Pool.acquireValue).set(0, -1, 0);
  let cameraRigAngleX = lookDirection.x;

  if (bodyCylinderRadius > 0) {
    const cameraRigAngle = scratch(0, eulerPool.acquireValue);
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
          position.y - cameraElevation,
          scratch(1, vector3Pool.acquireValue)
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

    target.rotation.copy(unrestrictedCamera.rotation);
  }
}

function apply3rdPersonViewSimple(
  target: Object3D,
  position: Vector3,
  lookDirection: Euler,
  cameraSetback: number
) {
  const fullSetbackDelta = scratch(2, vector3Pool.acquireValue);

  fullSetbackDelta.set(0, 0, cameraSetback).applyEuler(lookDirection);

  target.position.copy(position).sub(fullSetbackDelta);
  target.lookAt(position);
}
