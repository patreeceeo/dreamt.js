import * as ECSY from "ecsy";
import { ComponentConstructor, Component } from "./index";
import { merge } from "lodash";
import { updateComponent } from "./ecsExtensions";

export interface IEntityComponentData {
  [entityId: string]: {
    [componentId: string]: any;
  };
}
export interface IEntityComponentFlags {
  [entityId: string]:
    | boolean
    | {
        [componentId: string]: boolean;
      };
}
export interface IEntityComponentDiff {
  upsert: IEntityComponentData;
  remove: IEntityComponentFlags;
}

export interface IUpdateEntitiesMessage {
  body: IEntityComponentDiff;
}

// TODO may need to do object pooling for optimization

export function getComponentValue(compo: Component<any>, schema: ComponentConstructor<any>["schema"]) {
  const result = {} as any;
  if(!schema) {
    if(process.env.NODE_ENV === "development") {
      console.warn("Trying to use a component without a schema with Correspondent. This won't work.")
    }
    return;
  }
  Object.keys(schema).forEach((key) => {
    result[key] = (compo as any)[key];
  });
  return result;
}

/**
 * A possibly novel approach to wire formatting data in server-backed networked
 * games. How it works: Comparing the local game state with a cached
 * representation of the game state, it produces a diff. The diff contains two
 * kinds of operations:
 *
 * ### upsert
 *
 * Either creates an entity or adds a component to an existing entity, or both.
 * It can also update a component's data. In the following example
 *
 * ```
 * {
 *   upsert: {
 *     megaMan: {
 *       velocity: { value: 6 }
 *     }
 *   }
 * }
 * ```
 *
 * Would be the resulting diff if Mega Man's velocity is 6 while the cache says
 * it's some other integer. When another client is applying this diff to its
 * game state, it would set Mega Man's velocity to 6, adding the velocity
 * component if necessary, and also creating the Mega Man entity if necessary.
 *
 * When comparing components, it first passes each component through an
 * associated identity function, if available, otherwise it grabs
 * `component.value`. Either way, it assumes the resulting values should be
 * compared by reference (`===` in JavaScript.) This is handy for when a by
 * reference comparison would be misleading. For example, if the velocity
 * component were an array:
 *
 * ```
 * {
 *   upsert: {
 *     megaMan: {
 *       velocity: [3, 7]
 *     }
 *   }
 * }
 * ```
 *
 * Then two velocity components would never appear equal even if they contain
 * the same value. An identity function that concatinates the numbers in to a JS
 * string would solve this, since JS strings are equal by reference if and only
 * if they contain the same value. remove
 *
 * Either removes a component from an entity or removes an entire entity. Example:
 *
 * ```
 * {
 *   remove: {
 *     megaMan: {
 *       velocity: true
 *     },
 *     drWily: true
 *   }
 * }
 * ```
 *
 * Would remove the velocity component from Mega Man, and remove the Dr. Wily
 * component altogether.
 *
 * In addition to producing and consuming diffs, it provides a static function
 * that will update the cache given a diff. The cache tells it what the world
 * looked like last time so it knows what's changed when producing a diff. The
 * cache is its memory.
 *
 * It has a reference to the entire game state (the world, in ECS parlance) but
 * it doesn't concern itself with every component of every entity. That could be
 * too expensive in terms of CPU and network usage. Instead the system that's
 * using it must tell it what entities to care about. It also must be told what
 * types of components to care about. We supply it with a string identifier for
 * each entity and each component type which it uses when producing and consuming diffs.
 */
export class Correspondent {
  _entityMap = new Map<string, ECSY.Entity>();
  _allowedComponentMap = new Map<string, ComponentConstructor>();
  _identifyComponentValueMap = new Map<
    string,
    (c: ComponentConstructor) => any
  >();
  _defaultIdentifyValue = (c?: ComponentConstructor & { value: any }) =>
    c?.value;
  _parallelWorldModel: IEntityComponentData = {};
  _world: ECSY.World;

  static updateCache(cache: IEntityComponentData, diff: IEntityComponentDiff) {
    merge(cache, diff.upsert);

    Object.entries(diff.remove).forEach(([entityId, entityData]) => {
      if (entityData === true) {
        delete cache[entityId];
      } else {
        Object.entries(entityData).forEach(([componentId, shouldBeRemoved]) => {
          if (shouldBeRemoved) {
            delete cache[entityId][componentId];
          }
        });
      }
    });
  }

  constructor(world: ECSY.World) {
    this._world = world;
  }

  registerEntity(id: string, entity: ECSY.Entity) {
    this._entityMap.set(id, entity);
  }

  getEntityById(id: string): ECSY.Entity | undefined {
    return this._entityMap.get(id);
  }

  unregisterEntity(id: string) {
    this._entityMap.delete(id);
  }

  getEntityIterator(): Iterable<[string, ECSY.Entity]> {
    return this._entityMap.entries();
  }

  /** For convenience */
  createEntity(id: string) {
    const newEntity = this._world.createEntity(id);
    this.registerEntity(id, newEntity);
    return newEntity;
  }

  /** For convenience */
  removeEntityById(id: string) {
    this.getEntityById(id)?.remove();
    this.unregisterEntity(id);
  }

  /** For convenience */
  removeComponentById(entityId: string, componentId: string) {
    const Component = this.getComponentById(componentId);
    this.getEntityById(entityId)?.removeComponent(Component!);
  }

  /**
   * Add component of the given type to the allow list, meaning the data of any
   * instances of registered entities will be sent and recieved over the socket.
   * TODO should allowed components only be passed in constructor?
   */
  allowComponent(
    id: string,
    Component: ComponentConstructor,
    identifyValue?: (c: ComponentConstructor) => any
  ) {
    this._allowedComponentMap.set(id, Component);
    if (identifyValue) {
      this._identifyComponentValueMap.set(id, identifyValue);
    }
    return this;
  }

  getComponentById(id: string): ComponentConstructor | undefined {
    return this._allowedComponentMap.get(id);
  }

  disallowComponent(id: string) {
    this._allowedComponentMap.delete(id);
  }

  getAllowedComponentIterator(): Iterable<[string, ComponentConstructor]> {
    return this._allowedComponentMap.entries();
  }

  /** Should not have side-effects TODO make this a pure function rather than a method? */
  _getUpserts(input: IEntityComponentData): IEntityComponentData {
    const output: IEntityComponentData = {};
    for (const [entityId, entity] of this.getEntityIterator()) {
      for (const [
        componentId,
        Component,
      ] of this.getAllowedComponentIterator()) {
        const identifyValue =
          this._identifyComponentValueMap.get(componentId) ||
          this._defaultIdentifyValue;
        const compo = entity.getComponent(Component);
        const valueIdentity = identifyValue(compo as any);
        const inputValue = input[entityId]
          ? input[entityId][componentId]
          : undefined;
        if (
          compo &&
          (inputValue === undefined ||
            identifyValue(inputValue) !== valueIdentity)
        ) {
          output[entityId] = output[entityId] || {};
          output[entityId][componentId] = getComponentValue(compo as any, Component.schema);
        }
      }
    }
    return output;
  }

  /** Should not have side-effects */
  _getRemoves(input: IEntityComponentData): IEntityComponentFlags {
    const output: IEntityComponentFlags = {};
    Object.keys(input).forEach((entityId) => {
      const entity = this.getEntityById(entityId);
      if (entity?.alive) {
        const entityData = input[entityId];
        Object.keys(entityData).forEach((componentId) => {
          const Component = this.getComponentById(componentId);
          if (!entity.hasComponent(Component!)) {
            output[entityId] = output[entityId] || {};
            (output[entityId] as any)[componentId] = true;
          }
        });
      } else {
        output[entityId] = true;
      }
    });
    return output;
  }

  /**
   * Get the operations necessary to bring the network up-to-date with the local
   * world instance.
   *
   * @param input Represents the network's world (entities and components)
   * @returns The operations AKA a diff.
   */
  getDiff(input: IEntityComponentData): IEntityComponentDiff {
    return {
      upsert: this._getUpserts(input),
      remove: this._getRemoves(input),
    };
  }

  /**
   * Applies diff to the allow-listed components of registered entities
   * mentioned therein. Additionally, it will create entities mentioned in
   * `message` and add their components if necessary. Conversely, it will remove
   * entities that are ommitted by `message`.
   */
  applyDiff(diff: IEntityComponentDiff) {
    Object.entries(diff.upsert).forEach(([entityId, entityData]) => {
      Object.entries(entityData).forEach(([componentId, componentData]) => {
        const entity = this.getEntityById(entityId);
        const Component = this.getComponentById(componentId)!;
        // TODO invariant(Component) since component types should be static,
        // therefore the same across all clients. But what if components are
        // allow-listed conditionally?
        if (entity?.hasComponent(Component)) {
          updateComponent(entity, Component!, componentData);
        } else if (entity) {
          entity.addComponent(Component, componentData);
        } else {
          this.createEntity(entityId).addComponent(Component, componentData);
        }
      });
    });

    Object.entries(diff.remove).forEach(([entityId, entityData]) => {
      if (entityData === true) {
        this.removeEntityById(entityId);
      } else {
        Object.entries(entityData).forEach(([componentId, shouldBeRemoved]) => {
          if (shouldBeRemoved) {
            this.removeComponentById(entityId, componentId);
          }
        });
      }
    });
  }

  // rename to produceDiff?
  produce(cache: IEntityComponentData): IEntityComponentDiff {
    return this.getDiff(cache);
  }

  // rename to consumeDiff?
  consume(diff: IEntityComponentDiff): Correspondent {
    this.applyDiff(diff);
    return this;
  }
}
