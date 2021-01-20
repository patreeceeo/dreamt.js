import * as MOBX from "mobx";
import * as ECSY from "ecsy";

export class RenderState {
  entities: MOBX.ObservableSet<ECSY.Entity> = MOBX.observable.set();

  updateFromQueries = MOBX.action(
    (queries: { results: ECSY.Entity[]}[]) => {
      this.entities.clear();
      queries.forEach((q) => q.results.forEach((e) => this.entities.add(e)));
    }
  );
}
