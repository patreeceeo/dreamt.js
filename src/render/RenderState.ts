import * as MOBX from "mobx";
import * as ECSY from "ecsy";

export class RenderState {
  entities: MOBX.ObservableSet<ECSY.Entity> = MOBX.observable.set();

  updateFromQueries = MOBX.action((queries: { results: ECSY.Entity[] }[]) => {
    this.entities.clear();
    queries.forEach((q) => q.results.forEach((e) => this.entities.add(e)));
  });

  forEachEntity(
    cb: (entity: ECSY.Entity, comp: ECSY.Component<any>) => void,
    query: { withComponent: ECSY.ComponentConstructor<ECSY.Component<any>> }
  ) {
    this.entities.forEach((ent)=>{
      const comp = ent.getComponent(query.withComponent);
      if(comp) {
        cb(ent, comp);
      }
    })
  }
}
