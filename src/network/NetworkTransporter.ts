import * as ECSY from "ecsy";
import { ComponentConstructor } from "../index";
import { get, set, merge } from "lodash";
import { updateComponent } from "../ecsExtensions";

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

/**
 * TODO rename to WorldSynchronizer?
 * Responsible for:
 *
 * A. Sending to the server operations necessary to bring it up-to-date with
 * the local `World` instance.
 * B. Recieving and applying operations from the server.
 * C. Maintaining its model of entities and components as they exist on the
 * server. This is done during or after A and B.
 *
 * Designed to be used from within a system or game loop. Without any
 * intervention it will only do B and C. The system or game loop must tell it
 * when to gather and send updates.
 *
 * The system or game loop must also tell it what entities and component types
 * to care about. It will only send and apply updates to components of those
 * types on those specific entities.
 */
class NetworkTransporter {
  _entityMap = new Map<string, ECSY.Entity>();
  _allowedComponentMap = new Map<string, ComponentConstructor>();
  _serverWorldModel: IEntityComponentData = {};
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
   */
  allowComponent(id: string, Component: ComponentConstructor) {
    this._allowedComponentMap.set(id, Component);
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
    const path = ["", "", "value"];
    for (const [entityId, entity] of this.getEntityIterator()) {
      path[0] = entityId;
      for (const [
        componentId,
        Component,
      ] of this.getAllowedComponentIterator()) {
        const currentValue = (entity.getComponent(Component) as any)?.value;
        path[1] = componentId;
        if (get(input, path) !== currentValue && currentValue !== undefined) {
          set(output, path, currentValue);
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

    this._applyDiffToServerModel(diff);
  }

  // TODO make pure
  _applyDiffToServerModel(diff: IEntityComponentDiff) {
    merge(this._serverWorldModel, diff.upsert);

    Object.entries(diff.remove).forEach(([entityId, entityData]) => {
      if (entityData === true) {
        delete this._serverWorldModel[entityId];
      } else {
        Object.entries(entityData).forEach(([componentId, shouldBeRemoved]) => {
          if (shouldBeRemoved) {
            delete this._serverWorldModel[entityId][componentId];
          }
        });
      }
    });
  }

  getDiffToBePushed() {
    return this.getDiff(this._serverWorldModel);
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
    this._applyDiffToServerModel(diff);
  }
}

export default NetworkTransporter;
