import { ObjectPool } from "./ObjectPool";
import { Component } from '.';
import {
  Euler,
  Plane,
  Quaternion,
  Vector3,
  Vector4,
  Line3,
  Object3D,
} from "three";
import { provider } from "./provider";
import { lazyFactory } from "./lazy";

class MapPoolItem extends Component<Map<any, any>> {
  value: Map<any, any>;
  constructor() {
    super();
    this.value = new Map();
  }

  reset() {
    this.value.clear();
  }
}

class EulerComponent extends Component<Euler> {
  value: Euler;
  constructor() {
    super();
    this.value = new (provider.get("Euler") as any)();
  }

  reset() {
    this.value.set(0, 0, 0);
  }
}

class PlaneComponent extends Component<Plane> {
  value: Plane;
  constructor() {
    super();
    this.value = new (provider.get("Plane") as any)();
  }

  reset() {
    this.value.setComponents(0, 0, 0, 0);
  }
}

class QuaternionComponent extends Component<Quaternion> {
  value: Quaternion;
  constructor() {
    super();
    this.value = new (provider.get("Quaternion") as any)();
  }

  reset() {
    this.value.set(0, 0, 0, 0);
  }
}

class Vector3Component extends Component<Vector3> {
  value: Vector3;
  constructor() {
    super();
    this.value = new (provider.get("Vector3") as any)();
  }

  reset() {
    this.value.set(0, 0, 0);
  }
}

class Vector4Component extends Component<Vector4> {
  value: Vector4;
  constructor() {
    super();
    this.value = new (provider.get("Vector4") as any)();
  }

  reset() {
    this.value.set(0, 0, 0, 0);
  }
}

class Line3Component extends Component<Line3> {
  value: Line3;
  constructor() {
    super();
    this.value = new (provider.get("Line3") as any)();
  }

  reset() {
    this.value.start.set(0, 0, 0);
    this.value.end.set(0, 0, 0)
  }
}

class Object3DComponent extends Component<Object3D> {
  value: Object3D;
  static getDefault = lazyFactory(() => new (provider.get("Object3D") as any));
  constructor() {
    super();
    this.value = new (provider.get("Object3D") as any)();
  }

  reset() {
    this.value.copy(Object3DComponent.getDefault())
  }
}

export const mapPool = new ObjectPool<MapPoolItem>(MapPoolItem);
export const eulerPool = new ObjectPool<EulerComponent>(EulerComponent);
export const planePool = new ObjectPool<PlaneComponent>(PlaneComponent);
export const quaterionPool = new ObjectPool<QuaternionComponent>(QuaternionComponent);
export const vector3Pool = new ObjectPool<Vector3Component>(Vector3Component);
export const vector4Pool = new ObjectPool<Vector4Component>(Vector4Component);
export const line3Pool = new ObjectPool<Line3Component>(Line3Component);
export const object3DPool = new ObjectPool<Object3DComponent>(Object3DComponent);

