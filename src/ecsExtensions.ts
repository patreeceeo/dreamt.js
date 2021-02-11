import * as ECSY from "ecsy";
import {cast} from './testUtils';
import logger from './logger';
import { Intersection } from 'utility-types';

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

interface IStandardComponentContents {value: any};

export function updateComponent<T extends {} = IStandardComponentContents>(
  entity: ECSY.Entity,
  Component: ECSY.ComponentConstructor<ECSY.Component<T>>,
  data: T | Intersection<T, IStandardComponentContents>,
  nonStandardContents?: boolean
) {
  if (entity.hasComponent(Component)) {
    const component = entity.getMutableComponent(Component);
    if(!nonStandardContents) {
      cast<IStandardComponentContents>(component).value = data;
    } else {
      Object.assign(component, data);
    }
  } else {
    logger.warn(`Tried to update component ${Component.name} on ${entity.constructor.name}#${entity.id} which does not exist. Data:`, data);
  }
}

export function copyMap<K, V>(target: Map<K, V>, source: Map<K, V>) {
  source.forEach((value, key) => {
    target.set(key, value);
  });
}

