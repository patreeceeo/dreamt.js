import * as ECSY from "ecsy";
import { ComponentConstructor } from "../index";
import * as PHX from "phoenix";
import {get, set} from 'lodash';

interface IEntityComponentState {
  [entityId: string]: {
    [componentId: string]: {
      value: any;
    };
  };
}

interface IUpdateEntitiesMessage {
  body: IEntityComponentState
}

class SocketSession {
  _entityMap = new Map<string, ECSY.Entity>();
  _allowedComponentMap = new Map<string, ComponentConstructor>();
  _socket: PHX.Socket | null = null;
  _channel: PHX.Channel | null = null;
  _lastKnownState: IEntityComponentState = {};

  _handlePresenceState() {
  }

  _handlePresenceDiff() {
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

  disallowComponent(id: string) {
    this._allowedComponentMap.delete(id);
  }

  getAllowedComponentIterator(): Iterable<[string, ComponentConstructor]> {
    return this._allowedComponentMap.entries();
  }

  getUpdates(): IEntityComponentState {
    const result: IEntityComponentState = {};
    const path = ['' ,'' , 'value'];
    for (const [entityId, entity] of this.getEntityIterator()) {
      path[0] = entityId;
      for (const [componentId, Component] of this.getAllowedComponentIterator()) {
        const currentValue = (entity.getComponent(Component) as any)?.value;
        path[1] = componentId;
        if(get(this._lastKnownState, path) !== currentValue) {
          set(result, path, currentValue);
        }
      }
    }
    this._lastKnownState = result;
    return result;
  }

  /**
  * Handle updates recieved via the socket connection, applying updates to
  * the allow-listed components of registered entities mentioned therein.
  */
  _handleUpdates(message: IUpdateEntitiesMessage) {
    const path = ['' ,'' , 'value'];
    const updates = message.body;
    for (const [entityId, entity] of this.getEntityIterator()) {
      path[0] = entityId;
      for (const [componentId, Component] of this.getAllowedComponentIterator()) {
        path[1] = componentId;
        const component = entity.getComponent(Component);
        const newValue = get(updates, path);
        if(component) {
          (component as any).value = newValue;
        }
        if(this._lastKnownState) {
          set(this._lastKnownState, path, newValue);
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
      const updates = this.getUpdates();
      const message: IUpdateEntitiesMessage = {
        body: updates,
      }
      this._channel.push("update_entities", message);
    }
  }

  connect(topic: string) {
    if (!this._socket) {
      this._socket = new PHX.Socket("/socket");
      this._socket.connect();
      this._channel = this._socket.channel(topic);
      this._channel.on("presence_state", this._handlePresenceState);
      this._channel.on("presence_diff", this._handlePresenceDiff);
      this._channel.on("update_entities", this._handleUpdates);
    }
  }
}

export default SocketSession;
