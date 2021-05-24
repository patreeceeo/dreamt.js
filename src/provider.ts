import { Euler, Plane, Quaternion, Vector3, Vector4, Line3, Object3D } from "three";
import invariant from "invariant";

class Provider {
  _values: {
    Euler?: Euler;
    Plane?: Plane;
    Quaternion?: Quaternion;
    Vector3?: Vector3;
    Vector4?: Vector4;
    Line3?: Line3;
    Object3D?: Object3D;
  } = {};

  get(name: keyof Provider["_values"]) {
    invariant(
      this._values[name],
      `Needed a "${name}" but no such thing has been provided`
    );

    return this._values[name]!;
  }

  set(name: keyof Provider["_values"], value: any) {
    this._values[name] = value;
  }
}

export const provider = new Provider();
