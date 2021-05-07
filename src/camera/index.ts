import { Camera, Euler, Vector3 } from "three";
import { intersectLineWithPlane } from "../math";

const v1 = new Vector3();
const v2 = new Vector3();
const groundNormal = new Vector3(0, -1, 0);

export function apply3rdPersonView(
  target: Camera,
  position: Vector3,
  lookDirection: Euler,
  cameraSetback: number,
  cameraElevation: number
) {
  const fullSetbackDelta = v1
    .set(0, 0, cameraSetback)
    .applyEuler(lookDirection);
  const fullSetback = v2.subVectors(position, fullSetbackDelta);

  const groundIntersection =
    lookDirection.x < 0
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

  target.position.copy(targetPosition!);
  target.lookAt(position);
}
