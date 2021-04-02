interface IModelFactory<T> {
  (): T
}

/**
 * Conceived of as a way to synchronize the data in an ECS World instance
 * with a UI, though it doesn't have to be used with an ECS. Using the
 * phrases "underlying system" or just "system" in place of ECS to be more
 * agnostic.
 */
export class ViewModel<TModel> {
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
  }

  set fromViewPartial(partial: Partial<TModel>) {
    this._dirty = true;
    this._fromView = Object.assign({}, this._fromView, partial);
  }

  get toSystem() {
    return this._fromView;
  }

  set fromSystem(model: TModel) {
    this._fromSystem = model;
  }

  get toView() {
    return this._fromSystem;
  }

  get isDirty () {
    return this._dirty;
  }

  clean() {
    this._fromView = this._fromSystem;
    this._dirty = false;
  }

}
