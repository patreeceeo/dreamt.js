import * as ECSY from "ecsy";
import { ComponentConstructor } from "../index";
import * as PHX from "phoenix";

// interface ISerializedSocketSession {
//   [entityId: string]: {
//     [componentName: string]: {
//       value: any;
//     };
//   };
// }

class SocketSession {
  _entityMap = new Map<string, ECSY.Entity>();
  _allowedComponentMap = new Map<string, ComponentConstructor>();
  socket: PHX.Socket | null = null;
  channel: PHX.Channel | null = null;

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
    //   const result: ISerializedSocketSession = {};
    //   for(const entry of this.getEntityIterator()) {
    //     const entity = result[entry[0] as string] = {};
    //     for(const Component of this.getAllowedComponentIterator()) {
    //       const comp = entity[Component.name] = {};
    //       comp.value = entity.getComponent(Component).value;
    //     }
    //   }
  }
  clearUpdates() {}

  pushUpdates() {
    if (this.channel) {
      const updates = this.getUpdates();
      this.channel.push("update_entities", {
        body: updates,
      });
      this.clearUpdates();
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
