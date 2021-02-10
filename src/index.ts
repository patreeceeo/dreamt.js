import { Logger } from "sitka";
import * as ESCY from "ecsy";
import { extendEntity } from "./ecsExtensions";
export { copyMap } from "./ecsExtensions";

const { Entity, ...restOfESCY } = ESCY;

const EntityExt = extendEntity(Entity);

export default {
  Entity: EntityExt,
  ...restOfESCY,
};

export { EntityRenderConnector, RenderState } from "./render";

export class Example {
  /* Private Instance Fields */

  private _logger: Logger;

  /* Constructor */

  constructor() {
    this._logger = Logger.getLogger({ name: this.constructor.name });
  }

  /* Public Instance Methods */

  /**
   * Example method
   *
   * @param param whatever
   * @param {boolean} test what happens when jsdoc/ts disagree?
   * @param {boolean} test2 what happens when jsdoc/ts agree?
   * @returns whatever
   */
  public exampleMethod(param: string, test: any, test2: boolean): string {
    void test;
    void test2;
    this._logger.debug("Received: " + param);
    return param;
  }
}
