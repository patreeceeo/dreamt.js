import { Entity } from "ecsy";
import { useState, useCallback } from "react";
import { ComponentConstructor } from "./";

function getComponentValue(
  entity: Entity,
  Component: ComponentConstructor,
  includeRemoved?: boolean
) {
  const component = entity.getComponent(Component, includeRemoved);

  // TODO perhaps getValue methods should be defined on components
  return component ? (component as any).value : null;
}

type ShapeOf<T, V> = {
  [K in keyof T]: V;
};

interface IShape {
  [key: string]: any;
}

/**
 * Use only for state/components that change infrequently, or which alter the
 * structure of the scene graph. For animations, pass a ref and mutate the THREE
 * objects directly.
 */
export function useStateFromComponentMap<TShape extends IShape>(
  entity: Entity,
  ComponentMap: ShapeOf<TShape, ComponentConstructor>,
  includeRemoved?: boolean
): [ShapeOf<TShape, any>, () => void] {
  const [state, setState] = useState<any>(getInitialState());

  return [
    state,
    useCallback(syncWithComponents, [
      ComponentMap,
      includeRemoved,
      state,
      setState,
    ]),
  ];

  function getInitialState() {
    const result = {} as any;

    Object.entries(ComponentMap).forEach(([key, Component]) => {
      result[key] = getComponentValue(entity, Component, includeRemoved);
    });

    return result;
  }

  function syncWithComponents() {
    const newState = {} as any;
    let dirty = false;

    Object.entries(ComponentMap).forEach(([key, Component]) => {
      const newValue = getComponentValue(entity, Component, includeRemoved);
      if (newValue !== state[key]) {
        dirty = true;
      }
      newState[key] = newValue;
    });

    if (dirty) {
      setState(newState);
    }
  }
}
