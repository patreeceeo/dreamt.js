import * as ECSY from "ecsy";
import { ComponentConstructor } from "../index";

class SocketSession {
  _entityMap = new Map<number | string, ECSY.Entity>();
  _allowedComponentSet = new Set<ComponentConstructor>();

  setEntityById(entity: ECSY.Entity, id: number | string = entity.id) {
    this._entityMap.set(id, entity);
  }

  getEntityById(id: number | string) {
    return this._entityMap.get(id);
  }

  removeEntityById(idOrEntity: number | string | ECSY.Entity) {
    const id: number | string = (idOrEntity as ECSY.Entity).id
      ? (idOrEntity as ECSY.Entity).id
      : (idOrEntity as number | string);
    this._entityMap.delete(id);
  }

  getEntityIterator(): Iterable<[number | string, ECSY.Entity]> {
    return this._entityMap.entries();
  }

  allowComponent(Component: ComponentConstructor) {
    this._allowedComponentSet.add(Component);
  }

  disallowComponent(Component: ComponentConstructor) {
    this._allowedComponentSet.delete(Component);
  }

  getAllowedComponentIterator(): Iterable<ComponentConstructor> {
    return this._allowedComponentSet.values();
  }
}

export default SocketSession;
