import * as MOBX from "mobx";
import * as ECSY from "ecsy";

export class RenderState {
  entities: MOBX.ObservableSet<ECSY.Entity> = MOBX.observable.set();

  updateFromQueries = MOBX.action((queries: { results: ECSY.Entity[] }[]) => {
    this.entities.clear();
    queries.forEach((q) => q.results.forEach((e) => this.entities.add(e)));
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
