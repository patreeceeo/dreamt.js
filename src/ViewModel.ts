import logger from './logger';
interface IModelFactory<T> {
  (): T
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
  constructor(modelFactory: IModelFactory<TModel>) {
    this._fromView = modelFactory();
    this._fromSystem = modelFactory();
  }

  set fromView(model: TModel) {
    this._dirty = true;
    this._fromView = model;
    logger.debug(`ViewModel<${this._fromView.constructor.name}> data received from view:`, model)
  }

  set fromViewPartial(partial: Partial<TModel>) {
    this.fromView = Object.assign({}, this._fromView, partial);
  }

  get toSystem() {
    const retval = this._fromView;
    logger.debug(`ViewModel<${this._fromView.constructor.name}> data sent to system:`, retval)
    return retval;
  }

  set fromSystem(model: TModel) {
    this._fromSystem = model;
    logger.debug(`ViewModel<${this._fromSystem.constructor.name}> data received from system:`, model)
  }

  get toView() {
    const retval = this._fromSystem;
    logger.debug(`ViewModel<${this._fromView.constructor.name}> data sent to view:`, retval)
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
