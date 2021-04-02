import logger from './logger';
interface IModelFactory<T> {
  (): T
}

interface IOptions {
  debug?: boolean
}

/**
 * Conceived of as a way to synchronize the data in an ECS World instance
 * with a UI, though it doesn't have to be used with an ECS. Using the
 * phrases "underlying system" or just "system" in place of ECS to be more
 * agnostic.
 */
export class ViewModel<TModel extends Object | Array<any> | number | string | boolean> {
  _fromView: TModel;
  _fromSystem: TModel;
  _dirty = false;
  _options: IOptions;

  _logDebugMsg(msg: string, ...args: any[]) {
    if(this._options.debug)
      logger.debug(msg, ...args)
  }

  constructor(modelFactory: IModelFactory<TModel>, options: IOptions = {}) {
    this._fromView = modelFactory();
    this._fromSystem = modelFactory();
    this._options = options;
  }

  set fromView(model: TModel) {
    this._dirty = true;
    this._fromView = model;
    this._logDebugMsg(`ViewModel<${this._fromView.constructor.name}> data received from view:`, JSON.stringify(model))
  }

  set fromViewPartial(partial: Partial<TModel>) {
    this.fromView = Object.assign({}, this._fromView, partial);
  }

  get toSystem() {
    const retval = this._fromView;
    this._logDebugMsg(`ViewModel<${this._fromView.constructor.name}> data sent to system:`, JSON.stringify(retval))
    return retval;
  }

  set fromSystem(model: TModel) {
    this._fromSystem = model;
    this._logDebugMsg(`ViewModel<${this._fromSystem.constructor.name}> data received from system:`, JSON.stringify(model))
  }

  get toView() {
    const retval = this._fromSystem;
    this._logDebugMsg(`ViewModel<${this._fromView.constructor.name}> data sent to view:`, JSON.stringify(retval))
    return retval;
  }

  get isDirty () {
    return this._dirty;
  }

  clean() {
    this._fromView = this._fromSystem;
    this._dirty = false;
  }

}
