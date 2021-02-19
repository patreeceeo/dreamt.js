import * as ECSY from "ecsy";
import logger from './logger';

export function addComponent<T>(entity: ECSY.Entity, Component: ECSY.ComponentConstructor<ECSY.Component<T>>, data?: T) {
  if (data !== undefined) {
    entity.addComponent(Component, data);
  } else {
    entity.addComponent(Component);
  }
}

export function removeComponent<T>(entity: ECSY.Entity, Component: ECSY.ComponentConstructor<ECSY.Component<T>>, forceImmediate?: boolean) {
  entity.removeComponent(Component, forceImmediate);
}

export function replaceComponent<T>(
  entity: ECSY.Entity,
  Component: ECSY.ComponentConstructor<ECSY.Component<T>>,
  data?: T
) {
  if (entity.hasComponent(Component)) {
    entity.removeComponent(Component);
  }
  addComponent(entity, Component, data);
}

export function updateComponent<T extends {}>(
  entity: ECSY.Entity,
  Component: ECSY.ComponentConstructor<ECSY.Component<T>>,
  data: T,
) {
  if (entity.hasComponent(Component)) {
    const component = entity.getMutableComponent(Component);
    Object.assign(component, data);
  } else {
    logger.warn(`Tried to update component ${Component.name} on ${entity.constructor.name}#${entity.id} which does not exist. Data:`, data);
  }
}

export function copyMap<K, V>(target: Map<K, V>, source: Map<K, V>) {
  source.forEach((value, key) => {
    target.set(key, value);
  });
}

