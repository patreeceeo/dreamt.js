import * as ECSY from "ecsy";
import { ComponentConstructor } from "../index";
import * as PHX from "phoenix";
import { get, set } from "lodash";
import { updateComponent } from "../ecsExtensions";

interface IEntityComponentState {
  [entityId: string]: {
    [componentId: string]: {
      // TODO allow any shape, perhaps by adding an optional comparator
      // parameter somewhere...
      value: any;
    };
  };
}

interface IUpdateEntitiesMessage {
  body: IEntityComponentState;
}

class NetworkTransporter {
  _entityMap = new Map<string, ECSY.Entity>();
  _allowedComponentMap = new Map<string, ComponentConstructor>();
  _socket: PHX.Socket | null = null;
  _channel: PHX.Channel | null = null;
  _lastKnownState: IEntityComponentState = {};
  _world: ECSY.World;

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
   * Put together data representing the state of local registered entities and
   * their allow-listed components. Assumes that its return value will be
   * immediately and reliably sent over the socket.
   */
  _getOutgoing(): IEntityComponentState {
    const result: IEntityComponentState = {};
    const path = ["", "", "value"];
    for (const [entityId, entity] of this.getEntityIterator()) {
      path[0] = entityId;
      for (const [
        componentId,
        Component,
      ] of this.getAllowedComponentIterator()) {
        const currentValue = (entity.getComponent(Component) as any)?.value;
        path[1] = componentId;
        if (get(this._lastKnownState, path) !== currentValue) {
          set(result, path, currentValue);
        }
      }
    }
    // TODO move to pushUpdates and pass _lastKnownState as a formal parameter
    // also rename to getDifference and make it a function?
    this._lastKnownState = result;
    return result;
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
    const mentions: IEntityComponentState = {};
    const updates = message.body;
    Object.entries(updates).forEach(([entityId, entityData]) => {
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
        } else if(entity) {
          entity.addComponent(Component, componentData);
        } else {
          const newEntity = this._world
            .createEntity(entityId)
            .addComponent(Component, componentData);
          this.registerEntity(entityId, newEntity);
        }
        set(this._lastKnownState, path, componentData);
        set(mentions, path, true);
      });
    });

    for (const [entityId, entity] of this.getEntityIterator()) {
      path[0] = entityId;

      if(!mentions[entityId]) {
        entity.remove();
        this.unregisterEntity(entityId);
      } else {
        for (const [
          componentId,
          Component,
        ] of this.getAllowedComponentIterator()) {
          path[1] = componentId;
          if(!get(mentions, path)) {
            entity.removeComponent(Component);
          }
        }
      }
    }
  }

  /**
   * Send data over the socket representing changes since last call
   * WRT the allow-listed components of all registered entities.
   */
  pushUpdates() {
    if (this._channel) {
      const updates = this._getOutgoing();
      const message: IUpdateEntitiesMessage = {
        body: updates,
      };
      this._channel.push("update_entities", message);
    }
  }

  connect(topic: string) {
    if (!this._socket) {
      this._socket = new PHX.Socket("/socket");
      this._socket.connect();
      this._channel = this._socket.channel(topic);
      this._channel.on("update_entities", this._handleIncoming);
    }
  }
}

export default NetworkTransporter;
