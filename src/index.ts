import { Logger } from "sitka";
export {
    System,
    Not,
    Component,
    SystemStateComponent,
    TagComponent,
    Types,
    createType,
    copyValue,
    cloneValue,
    copyArray,
    cloneArray,
    copyJSON,
    cloneJSON,
    copyCopyable,
    cloneClonable,
} from "ecsy";
import { DreamtWorld, DreamtEntity } from "./ecsExtensions";

export const World = DreamtWorld;
export const _Entity = DreamtEntity;
export { copyMap } from "./ecsExtensions";

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
