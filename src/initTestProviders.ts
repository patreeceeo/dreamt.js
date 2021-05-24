import { provider } from "./provider";
import {
  Euler,
  Plane,
  Quaternion,
  Vector3,
  Vector4,
  Line3,
  Object3D,
} from "three";

[Euler, Plane, Quaternion, Vector3, Vector4, Line3, Object3D].forEach(
  (Klass) => {
    provider.set(Klass.name as any, Klass);
  }
);
