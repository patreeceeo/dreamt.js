import * as ECSY from "ecsy";

export function replaceComponent(
  entity: ECSY.Entity,
  Component: ECSY.ComponentConstructor<any>,
  data?: any
) {
  if (entity.hasComponent(Component)) {
    entity.removeComponent(Component);
  }
  if (data !== undefined) {
    entity.addComponent(Component, data);
  } else {
    entity.addComponent(Component);
  }
}

export function copyMap<K, V>(target: Map<K, V>, source: Map<K, V>) {
  source.forEach((value, key) => {
    target.set(key, value);
  });
}

export class DreamtEntity extends ECSY._Entity {
  replaceComponent(Component: ECSY.ComponentConstructor<any>, data: any) {
    replaceComponent(this, Component, data);
  }
}

export class DreamtWorld extends ECSY.World<DreamtEntity> {
  constructor(options = {}) {
    options = Object.assign({entityClass: DreamtEntity}, options);
    super(options);
  }
};
