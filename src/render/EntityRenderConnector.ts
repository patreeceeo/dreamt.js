import * as ECSY from "ecsy";
import { RenderState } from "./RenderState";
import _ from "lodash";
import { ComponentConstructor } from '../';


interface IERCAttributes {
  renderToDom: (state: RenderState) => void;
  components: {
    [key: string]: ComponentConstructor;
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
        const queryResults = Object.values(this.queries);
        const shouldUpdateState =
          _.some(queryResults, (result) => {
            return (
              result.added &&   result.added!.length > 0 ||
              result.removed && result.removed!.length > 0 ||
              result.changed && result.changed!.length > 0
            );
          });

        if(shouldUpdateState) {
          this._state.updateFromQueries(this.queries);
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

