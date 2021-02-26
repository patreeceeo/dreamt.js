import * as MOBX from "mobx";
import * as ECSY from "ecsy";

interface IQueryResultsCollection {
  [name: string]: {
    results: ECSY.Entity[];
    changed: ECSY.Entity[];
  }
}

export class RenderState {
  entities: MOBX.ObservableSet<ECSY.Entity> = MOBX.observable.set();
  entityComponentMap: Map<string, MOBX.ObservableSet<ECSY.Entity>> = new Map();

  updateFromQueries = MOBX.action((queries: IQueryResultsCollection) => {
    const queryResults = Object.values(queries);
    const queryNames = Object.keys(queries);
    this.entities.clear();
    queryResults.forEach((result) => {
      result.results.forEach((entity) => this.entities.add(entity))
      result.changed.forEach((entity) => this.entities.add(entity))
    });
    queryNames.forEach((name) => {
      if(!this.entityComponentMap.has(name)) {
        this.entityComponentMap.set(name, MOBX.observable.set(queries[name].results))
      } else {
        this.entityComponentMap.get(name)!.replace(queries[name].results);
      }
    })
  });

  mapEntities<TComponentConstructor extends ECSY.ComponentConstructor<ECSY.Component<any>>, TReturn>(
    cb: (entity: ECSY.Entity, comp: ECSY.Component<any>) => TReturn,
    query: { withComponent: TComponentConstructor }
  ): TReturn[] {
    const result: TReturn[] = [];
    this.entities.forEach((ent)=>{
      const comp = ent.getComponent(query.withComponent);
      if(comp) {
        result.push(cb(ent, comp));
      }
    })
    return result;
  }
}
