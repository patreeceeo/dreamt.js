import logger from "./logger";
import debounce from "debounce";

interface IModelFactory<T> {
  (): T;
}

interface IOptions {
  debug?: boolean;
  debounceRequestMs?: number
}

/**
 * Conceived of as a way to synchronize the data in an ECS with a UI, though it
 * can be used in any situation in which a user needs to interact with a system
 * asynchronously. The user's desired state of the system is modeled using the
 * same data structure which represents the actual state of the system. The
 * system can then act on the user's input and update the model of its actual
 * state as it sees fit. The responsibility of keeping the model of the user's
 * desires in sync with the actual system state is on the user interface. The
 * system uses a dirty flag to know if the desired state has changed since the
 * last call to `clean()`.
 */
export class DualModel<
  TModel extends Object | Array<any> | number | string | boolean
> {
  _request: TModel;
  _actual: TModel;
  _dirty = false;
  _options: IOptions;

  _logDebugMsg(msg: string, ...args: any[]) {
    if (this._options.debug) logger.debug(msg, ...args);
  }

  constructor(modelFactory: IModelFactory<TModel>, options: IOptions = {}) {
    this._request = modelFactory();
    this._actual = modelFactory();
    this._options = options;
    if(this._options.debounceRequestMs) {
      this.setRequest = debounce(this.setRequest.bind(this), this._options.debounceRequestMs);
    }
  }

  setRequest(model: TModel) {
    this._request = model;
    this.setDirty();
    this._logDebugMsg(
      `ViewModel<${this._actual.constructor.name}> set request:`,
      JSON.stringify(model)
    );
  }

  setRequestPart(partial: Partial<TModel>) {
    this.setRequest(Object.assign({}, this._request, partial));
  }

  get request() {
    const retval = this._request;
    this._logDebugMsg(
      `ViewModel<${this._request.constructor.name}> got request:`,
      JSON.stringify(retval)
    );
    return retval;
  }

  setActual(model: TModel) {
    this._actual = model;
    this._logDebugMsg(
      `ViewModel<${this._actual.constructor.name}> set actual:`,
      JSON.stringify(model)
    );
  }

  get actual() {
    const retval = this._actual;
    this._logDebugMsg(
      `ViewModel<${this._actual.constructor.name}> data sent to view:`,
      JSON.stringify(retval)
    );
    return retval;
  }

  get isDirty() {
    return this._dirty;
  }

  setDirty() {
    this._dirty = true;
  }

  clean() {
    this._request = this._actual;
    this._dirty = false;
  }
}
