import { Camera, Euler, Object3D, Vector3 } from "three";
import { intersectLineWithPlane } from "../math";

const v1 = new Vector3();
const v2 = new Vector3();
const groundNormal = new Vector3(0, -1, 0);
const e1 = new Euler();
const o1 = new Object3D();

export function apply3rdPersonView(
  target: Camera,
  position: Vector3,
  lookDirection: Euler,
  cameraSetback: number,
  cameraElevation: number,
  bodyCylinderRadius = 0
) {
  const cameraRigAngle = e1.copy(lookDirection);

  if (bodyCylinderRadius > 0) {
    const minAngle = -Math.atan(cameraElevation / bodyCylinderRadius);
    cameraRigAngle.x = Math.max(
      cameraRigAngle.x,
      minAngle
    );
  }

  const fullSetbackDelta = v1
    .set(0, 0, cameraSetback)
    .applyEuler(cameraRigAngle);
  const fullSetback = v2.subVectors(position, fullSetbackDelta);

  const groundIntersection =
    cameraRigAngle.x < 0
      ? intersectLineWithPlane(
          position,
          fullSetback,
          groundNormal,
          position.y - cameraElevation
        )
      : null;

  const targetPosition = groundIntersection
    ? groundIntersection.distanceTo(position) < cameraSetback
      ? groundIntersection
      : fullSetback
    : fullSetback;

  const unrestrictedCamera = o1;
  const fullSetbackUnrestrictedDelta = v1
    .set(0, 0, cameraSetback)
    .applyEuler(lookDirection);

  unrestrictedCamera.position.copy(position).add(fullSetbackUnrestrictedDelta)
  unrestrictedCamera.lookAt(position);

  target.position.copy(targetPosition!);
  target.rotation.copy(unrestrictedCamera.rotation);
}
