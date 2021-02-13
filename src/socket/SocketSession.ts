import * as ECSY from 'ecsy';

class SocketSession {
  _entityMap = new Map<number | string, ECSY.Entity>();
  setEntityById(entity: ECSY.Entity, id: number | string = entity.id) {
    this._entityMap.set(id, entity);
  }
  getEntityById(id: number | string) {
    return this._entityMap.get(id);
  }
  removeEntityById(id: number | string) {
    this._entityMap.delete(id);
  }
}

export default SocketSession;
