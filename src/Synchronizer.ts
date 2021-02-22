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
    if(key !== "isComponent") {
      result[key] = (compo as any)[key];
    }
  });
  return result;
}

/**
 * The primary use cases is networked games using (Web)sockets, but can be used
 * in any cases that require keeping two (or more*) instances of an ECS World in
 * sync with each other, one step at a time.
 *
 * How does it work?
 * =================
 *
 *
 * It assumes that the communication protocol can be exposed as two functions:
 * One for handling incoming messages, and one for pushing messages. This
 * generalization will henceforth be referred to as a _pipe_.
 *
 * The action may begin with a method call. First it compares its _local_ World
 * with its model of the _parallel_ World that exists on the other side of the
 * pipe.
 *
 * The comparison as well as the result is called a _diff_. A _diff_ contains
 * two kinds of operations:
 *
 * _upsert_: Either creates an entity or adds a component to an existing
 * entity, or both. It can also update a component's data. When comparing
 * components, it first passes the components through an associated identity
 * function, if present, otherwise it uses `component.value`. Comparison is
 * then performed using `===`.
 *
 * _remove_: Either removes a component from an entity or removes an entire
 * entity.
 *
 * Once the diff is complete, it's pushed through the pipe.
 *
 * The other way the action can begin is when its on the receiving end of a
 * message. In this case it applies received diffs to its World instance.
 *
 * After pushing or receiving a diff, that diff is also applied to the model so
 * that those same operations aren't included in a future diff.
 *
 * ## Opting In ##
 *
 * Users of this class must opt-in specific entities and component types before
 * it will actually do anything. Performance can be optimized by carefully
 * choosing which entities and component types to opt-in for each instance of
 * this class.
 *
 * * Aside on N-way communication: In actuality there may be _many_ parallel
 * Worlds that are being kept in sync, and thus N-way communication, but that
 * can be acheived by a service on the other end of the pipe that gathers and
 * distributes messages for many World instances, thus in the scope of this
 * class we can be lazy and pretend there's only two-way with one parallel
 * World.
 *
 */
class Synchronizer {
  _entityMap = new Map<string, ECSY.Entity>();
  _allowedComponentMap = new Map<string, ComponentConstructor>();
  _identifyComponentValueMap = new Map<
    string,
    (c: ComponentConstructor) => any
  >();
  _defaultIdentifyValue = (c?: ComponentConstructor & { value: any }) => c?.value;
  _parallelWorldModel: IEntityComponentData = {};
  _world: ECSY.World;
  _pushMessage: (messageType: string, message: IUpdateEntitiesMessage) => void;

  constructor(
    world: ECSY.World,
    pushMessage: (messageType: string, message: IUpdateEntitiesMessage) => void,
    addHandler: (
      messageType: string,
      handler: (m: IUpdateEntitiesMessage) => void
    ) => void
  ) {
    this._world = world;
    this._pushMessage = pushMessage;
    addHandler("update_entities", this._handleIncoming);
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

  /**
   * Should not have side-effects
   * TODO make this a pure function rather than a method?
   */
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
        if (compo && (inputValue === undefined || identifyValue(inputValue) !== valueIdentity)) {
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
   * Get the operations necessary to bring the network up-to-date with the
   * local world instance.
   *
   * @param input represents the network's world (entities and components)
   * @returns the operations AKA a diff.
   */
  getDiff(input: IEntityComponentData): IEntityComponentDiff {
    return {
      upsert: this._getUpserts(input),
      remove: this._getRemoves(input),
    };
  }

  /**
   * Handle updates recieved via the socket connection, applying them to
   * the allow-listed components of registered entities mentioned therein.
   * Additionally, it will create entities mentioned in `message` and add
   * their components if necessary. Conversely, it will remove entities that
   * are ommitted by `message`.
   */
  _handleIncoming(message: IUpdateEntitiesMessage) {
    const path = ["", ""];
    const diff = message.body;
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

    this._applyDiffToModel(diff);
  }

  // TODO make pure
  _applyDiffToModel(diff: IEntityComponentDiff) {
    merge(this._parallelWorldModel, diff.upsert);

    Object.entries(diff.remove).forEach(([entityId, entityData]) => {
      if (entityData === true) {
        delete this._parallelWorldModel[entityId];
      } else {
        Object.entries(entityData).forEach(([componentId, shouldBeRemoved]) => {
          if (shouldBeRemoved) {
            delete this._parallelWorldModel[entityId][componentId];
          }
        });
      }
    });
  }

  getDiffToBePushed() {
    return this.getDiff(this._parallelWorldModel);
  }

  /**
   * Send data over the socket representing changes since last call
   * WRT the allow-listed components of all registered entities.
   */
  pushDiff() {
    const diff = this.getDiffToBePushed();
    const message: IUpdateEntitiesMessage = {
      body: diff,
    };
    this._pushMessage("update_entities", message);
    this._applyDiffToModel(diff);
  }
}

export default Synchronizer;
