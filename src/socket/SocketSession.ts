import * as ECSY from "ecsy";
import { ComponentConstructor } from "../index";
import * as PHX from "phoenix";
import {get, set} from 'lodash';

interface IUpdates {
  [entityId: string]: {
    [componentId: string]: {
      value: any;
    };
  };
}

class SocketSession {
  _entityMap = new Map<string, ECSY.Entity>();
  _allowedComponentMap = new Map<string, ComponentConstructor>();
  socket: PHX.Socket | null = null;
  channel: PHX.Channel | null = null;
  _lastUpdate: IUpdates | null = null;

  setEntityById(id: string, entity: ECSY.Entity) {
    this._entityMap.set(id, entity);
  }

  getEntityById(id: string): ECSY.Entity | undefined {
    return this._entityMap.get(id);
  }

  removeEntityById(id: string) {
    this._entityMap.delete(id);
  }

  getEntityIterator(): Iterable<[string, ECSY.Entity]> {
    return this._entityMap.entries();
  }

  allowComponent(id: string, Component: ComponentConstructor) {
    this._allowedComponentMap.set(id, Component);
  }

  disallowComponent(id: string) {
    this._allowedComponentMap.delete(id);
  }

  getAllowedComponentIterator(): Iterable<[string, ComponentConstructor]> {
    return this._allowedComponentMap.entries();
  }

  getUpdates() {
    const result: IUpdates = {};
    const path = ['' ,'' , 'value'];
    for (const [entityId, entity] of this.getEntityIterator()) {
      path[0] = entityId;
      for (const [componentId, Component] of this.getAllowedComponentIterator()) {
        const currentValue = (entity.getComponent(Component) as any)?.value;
        path[1] = componentId;
        if(get(this._lastUpdate, path) !== currentValue) {
          set(result, path, currentValue);
        }
      }
    }
    this._lastUpdate = result;
    return result;
  }

  pushUpdates() {
    if (this.channel) {
      const updates = this.getUpdates();
      this.channel.push("update_entities", {
        body: updates,
      });
    }
  }

  connect(topic: string) {
    if (!this.socket) {
      this.socket = new PHX.Socket("/socket");
      this.socket.connect();
      this.channel = this.socket.channel(topic);
    }
  }
}

export default SocketSession;
