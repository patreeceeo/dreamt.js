import * as ECSY from "ecsy";
import { ComponentConstructor, Component } from "./index";
import { get, set, merge } from "lodash";
import { updateComponent } from "./ecsExtensions";

export interface IEntityComponentData {
  [entityId: string]: {
    [componentId: string]: {
      // TODO allow any shape, perhaps by adding an optional comparator
      // parameter somewhere...
      value: any;
    };
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

export function getComponentValue(compo: Component<any>) {
  const result = {} as any;
  const ownProps = Object.getOwnPropertyNames(compo);
  ownProps.forEach((key) => {
    if (key !== "isComponent") {
      result[key] = (compo as any)[key];
    }
  });
  return result;
}

/**
 * The primary use cases is networked games using (Web)sockets. Capable of
 * producing and consuming messages which do any combination of:
 *
 * 1. Create entities
 * 2. Add components
 * 3. Update components
 * 4. Remove components
 * 5. Remove entities
 *
 * Comparing its _local_ World with a cache, it produces a message containing a
 * _diff_. The _diff_ contains two kinds of operations:
 *
 * _upsert_: Either creates an entity or adds a component to an existing entity,
 * or both. It can also update a component's data. When comparing components, it
 * first passes the components through an associated identity function, if
 * present, otherwise it uses `component.value`. Comparison is then performed
 * using `===`.
 *
 * _remove_: Either removes a component from an entity or removes an entire entity.
 *
 * When consuming a message, it applies the message's diff to its World instance.
 *
 * Wether it's producing or consuming messages, it will modify the cache _in
 * place_ so that the diff operations it's producing or consuming aren't re-produced.
 *
 * Before it will actually do anything, users of this class must opt-in specific
 * entities as well as specific component types. Performance can be optimized by
 * carefully choosing which entities and component types to opt-in for each
 * instance of this class.
 */
class Correspondent {
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

  static updateCache(
    cache: IEntityComponentData,
    diff: IEntityComponentDiff
  ) {
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
    const output = {};
    const path = ["", ""];
    for (const [entityId, entity] of this.getEntityIterator()) {
      path[0] = entityId;
      for (const [
        componentId,
        Component,
      ] of this.getAllowedComponentIterator()) {
        const identifyValue =
          this._identifyComponentValueMap.get(componentId) ||
          this._defaultIdentifyValue;
        const compo = entity.getComponent(Component);
        const valueIdentity = identifyValue(compo as any);
        path[1] = componentId;
        const inputValue = get(input, path);
        if (
          compo &&
          (inputValue === undefined ||
            identifyValue(inputValue) !== valueIdentity)
        ) {
          set(output, path, getComponentValue(compo as any));
        }
      }
    }
    return output;
  }

  /** Should not have side-effects */
  _getRemoves(input: IEntityComponentData): IEntityComponentFlags {
    const output: IEntityComponentFlags = {};
    const path = ["", ""];
    Object.keys(input).forEach((entityId) => {
      path[0] = entityId;
      const entity = this.getEntityById(entityId);
      if (entity?.alive) {
        const entityData = input[entityId];
        Object.keys(entityData).forEach((componentId) => {
          path[1] = componentId;
          const Component = this.getComponentById(componentId);
          if (!entity.hasComponent(Component!)) {
            set(output, path, true);
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
    const path = ["", ""];
    Object.entries(diff.upsert).forEach(([entityId, entityData]) => {
      path[0] = entityId;
      Object.entries(entityData).forEach(([componentId, componentData]) => {
        path[1] = componentId;
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

  produce(cache: IEntityComponentData): IEntityComponentDiff {
    return this.getDiff(cache);
  }

  consume(diff: IEntityComponentDiff): Correspondent {
    this.applyDiff(diff);
    return this;
  }
}

export default Correspondent;
