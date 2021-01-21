import * as ECSY from "ecsy";
import { DreamtComponentConstructor } from "../../src/EntityManager";
import { RenderState } from "./RenderState";
import _ from "lodash";

interface IERCAttributes {
  renderToDom: (state: RenderState) => void;
  components: {
    [key: string]: DreamtComponentConstructor;
  };
}

export class EntityRenderConnector<
  Entity extends ECSY.Entity = ECSY.Entity,
  SystemConstructor = ECSY.SystemConstructor<ECSY.System<Entity>>
> {
  static makeRenderSystem(attributes: IERCAttributes) {
    class DynamicClass extends ECSY.System {
      static queries = {};
      _state = new RenderState();
      init() {
        attributes.renderToDom(this._state);
      }
      execute() {
        const queries = Object.values(this.queries);
        if (
          _.some(queries, (q) => {
            return (
              q.added && q.added!.length > 0 ||
              q.removed && q.removed!.length > 0 ||
              q.changed && q.changed!.length > 0
            );
          })
        ) {
          this._state.updateFromQueries(queries);
        }
      }
    }

    Object.keys(attributes.components).forEach((key) => {
      (DynamicClass.queries as any)[key] = {
        components: [attributes.components[key]],
        listen: {
          added: true,
          removed: true,
          changed: true,
        },
      };
    });

    return DynamicClass as any;
  }

  RenderSystem: SystemConstructor;

  constructor(world: ECSY.World, attributes: IERCAttributes) {
    this.RenderSystem = EntityRenderConnector.makeRenderSystem(attributes);

    Object.values(attributes.components).forEach((Component) => {
      world.registerComponent(Component);
    });

    world.registerSystem(this.RenderSystem as any, attributes);
  }
}

