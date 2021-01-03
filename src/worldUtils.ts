import {Entity, World, Component, ComponentConstructor} from 'ecsy';
import {autorun, ObservableMap, ObservableSet} from 'mobx';

export type DreamtComponentConstructor<T = any> = ComponentConstructor<Component<T>>

type ObservableEntityMap = ObservableMap<string, ObservableSet<DreamtComponentConstructor>>;

export type EntityMap = Map<string, Set<DreamtComponentConstructor>> | ObservableEntityMap;

export function addEntities(world: World, addMap: EntityMap) {
  for(const entry of addMap.entries()) {
    const entity = world.createEntity(entry[0]);
    addComponents(entity, entry[1]);
  }
}

function addComponents(entity: Entity, components: Set<DreamtComponentConstructor>) {
  components.forEach((c) => {
    entity.addComponent(c);
  });
}


export function manageEntities(world: World, entitiesObservable: ObservableEntityMap) {
  autorun(() => {
    addEntities(world, entitiesObservable);
  })
}
