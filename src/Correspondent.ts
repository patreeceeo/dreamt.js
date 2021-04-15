import * as ECSY from "ecsy";
import { ComponentConstructor, Component } from "./index";

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

export function extractComponentProps(
  compo: Component<any>,
  schema: ECSY.ComponentSchema
) {
  const result = {} as any;
  if (!schema) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "Trying to use a component without a schema with extractComponentProps."
      );
    }
    return;
  }
  Object.keys(schema).forEach((key) => {
    result[key] = (compo as any)[key];
  });
  return result;
}

interface IComponentOptsFull<TData> {
  write: (compo: Component<TData>) => any;
  read: (compo: Component<TData>, data: TData) => void;
  writeCache: (data: any) => any;
  allow: (compo: Component<TData>) => boolean;
}

type IComponentOpts<TData> = Partial<IComponentOptsFull<TData>>;

interface IGlobalOpts {
  isMine?: (entity: ECSY.Entity) => boolean;
}

// TODO(optimization) object pooling
// TODO(feat) add callback option that allows dynamically determining whether to network a component given all the components on the entity
// TODO(optimization) use Three's approach to tracking when objects change: onChange callbacks
// TODO(optimization) map string constants to integers
// TODO(refactor) investigate advantages of other ECS libs like BitECS

/**
 * A message producer and consumer for diff/delta-based networking of Entities.
 * How it works: Comparing the local game state with a cached representation of
 * the game state, it produces a diff. The diff contains two kinds of operations:
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
  static isEmptyDiff(diff: IEntityComponentDiff) {
    return (
      Object.keys(diff.remove).length === 0 &&
      Object.keys(diff.upsert).length === 0
    );
  }

  static createEmptyDiff(): IEntityComponentDiff {
    return {
      upsert: {},
      remove: {},
    };
  }

  static setUpsert(
    target: IEntityComponentDiff,
    entityId: string,
    componentData: any
  ) {
    target.upsert[entityId] = componentData;
    return target;
  }

  static getUpsert(target: IEntityComponentDiff, entityId: string) {
    return target.upsert[entityId];
  }

  _knownEntityMap = new Map<string, ECSY.Entity>();
  _isMineMap = new Map<string, boolean>();
  _componentMap = new Map<string, ComponentConstructor>();
  _componentOptsMap = new Map<string, IComponentOpts<any>>();
  _defaultComponentOpts: IComponentOptsFull<any> = {
    write: (c: any) => c?.value,
    writeCache: (v: any) => v,
    read: (c: any, value: any) => {
      if (c) {
        c.value = value;
      }
    },
    allow: (_compo) => true,
  };

  _world: ECSY.World;
  _options: IGlobalOpts;

  diff: IEntityComponentDiff = {
    upsert: {},
    remove: {},
  };

  constructor(world: ECSY.World, options: IGlobalOpts = {}) {
    this._world = world;
    this._options = options;
  }

  registerEntity(id: string, entity: ECSY.Entity, isMine = true) {
    this._knownEntityMap.set(id, entity);
    this._isMineMap.set(id, isMine);
  }

  getEntityById(id: string): ECSY.Entity | undefined {
    return this._knownEntityMap.get(id);
  }

  unregisterEntity(id: string) {
    this._knownEntityMap.delete(id);
  }

  getEntityIterator(): Iterable<[string, ECSY.Entity]> {
    return this._knownEntityMap.entries();
  }

  /** For convenience */
  isMine(entity: ECSY.Entity) {
    return this._options?.isMine?.call(null, entity) || false;
  }

  /** For convenience */
  createEntity(id: string, isMine = true) {
    const entity = this._world.createEntity(id);
    this.registerEntity(id, entity, isMine);
    return entity;
  }

  /** For convenience */
  removeEntityById(id: string) {
    this.getEntityById(id)?.remove();
    this._knownEntityMap.delete(id);
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
  registerComponent<TData>(
    id: string,
    Component: ComponentConstructor<Component<TData>>,
    opts?: IComponentOpts<TData>
  ) {
    this._componentMap.set(id, Component);
    if (opts) {
      this._componentOptsMap.set(id, opts);
    }
    return this;
  }

  getComponentById(id: string): ComponentConstructor | undefined {
    return this._componentMap.get(id);
  }

  getComponentIterator(): Iterable<[string, ComponentConstructor]> {
    return this._componentMap.entries();
  }

  getComponentOpt<K extends keyof IComponentOpts<any>>(
    componentId: string,
    optName: K
  ): IComponentOptsFull<any>[K] {
    const opts = this._componentOptsMap.get(componentId);
    return opts && opts[optName]
      ? (opts[optName] as IComponentOptsFull<any>[K])
      : this._defaultComponentOpts[optName];
  }

  /** Should not have side-effects TODO make this a pure function rather than a method? */
  _getUpserts(cache: IEntityComponentData): IEntityComponentData {
    const output: IEntityComponentData = {};
    for (const [entityId, entity] of this._knownEntityMap.entries()) {
      if (this._isMineMap.get(entityId)) {
        for (const [componentId, Component] of this.getComponentIterator()) {
          const allow = this.getComponentOpt(componentId, "allow");
          const compo = entity.getComponent(Component);
          if (allow(compo!)) {
            const writeCache = this.getComponentOpt(componentId, "writeCache");
            const write = this.getComponentOpt(componentId, "write");
            const valueIdentity = writeCache(write(compo as any));
            const cacheValue = cache[entityId]
              ? cache[entityId][componentId]
              : undefined;
            if (
              compo &&
              (cacheValue === undefined || cacheValue !== valueIdentity)
            ) {
              output[entityId] = output[entityId] || {};
              output[entityId][componentId] = write(compo);
            }
          }
        }
      }
    }
    return output;
  }

  /** Should not have side-effects */
  _getRemoves(cache: IEntityComponentData): IEntityComponentFlags {
    const output: IEntityComponentFlags = {};
    Object.keys(cache).forEach((entityId) => {
      const entity = this.getEntityById(entityId);
      if (entity?.alive) {
        const entityData = cache[entityId];
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
   * @returns Target.
   */
  produceDiff(cache: IEntityComponentData): IEntityComponentDiff {
    this.diff.upsert = this._getUpserts(cache);
    this.diff.remove = this._getRemoves(cache);
    return this.diff;
  }

  /**
   * Applies diff to the allow-listed components of registered entities
   * mentioned therein. Additionally, it will create entities mentioned in
   * `message` and add their components if necessary. Conversely, it will remove
   * entities that are ommitted by `message`.
   */
  consumeDiff(diff: IEntityComponentDiff): Correspondent {
    Object.entries(diff.upsert).forEach(([entityId, entityData]) => {
      const entity =
        this.getEntityById(entityId) || this.createEntity(entityId, false);

      Object.entries(entityData).forEach(([componentId, componentData]) => {
        const Component = this.getComponentById(componentId)!;

        if (!Component) {
          console.info("Nothing registered for componentId", componentId);
          return;
        }

        const read = this.getComponentOpt(componentId, "read");
        const normalComponentData = {};
        read(normalComponentData as any, componentData);
        if (!entity.hasComponent(Component)) {
          entity.addComponent(Component, normalComponentData);
        } else {
          const write = this.getComponentOpt(componentId, "write");
          // TODO invariant(Component) since component types should be static,
          // therefore the same across all clients. But what if components are
          // allow-listed conditionally?
          const compo = entity.getComponent(Component);

          if (write(normalComponentData as any) !== write(compo!)) {
            const mutable = entity.getMutableComponent(Component);
            read(mutable!, componentData);
          }
        }
      });

      if (this.isMine(entity)) {
        this._isMineMap.set(entityId, true);
      }
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
    return this;
  }

  updateCache(
    cache: IEntityComponentData,
    diff: IEntityComponentDiff
  ): Correspondent {
    Object.entries(diff.upsert).forEach(([entityId, entityData]) => {
      if (this._isMineMap.get(entityId)) {
        Object.entries(entityData).forEach(([componentId, componentData]) => {
          if (this.getComponentById(componentId)) {
            const writeCache = this.getComponentOpt(componentId, "writeCache");
            cache[entityId] = cache[entityId] || {};
            cache[entityId][componentId] = writeCache(componentData);
          }
        });
      }
    });

    Object.entries(diff.remove).forEach(([entityId, entityData]) => {
      if (this._isMineMap.get(entityId)) {
        if (entityData === true) {
          delete cache[entityId];
        } else {
          Object.entries(entityData).forEach(
            ([componentId, shouldBeRemoved]) => {
              if (shouldBeRemoved) {
                delete cache[entityId][componentId];
              }
            }
          );
        }
      }
    });
    return this;
  }
}
