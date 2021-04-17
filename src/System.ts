import {System as EcsySystem} from 'ecsy';

export abstract class System extends EcsySystem {
  /** Should be called before the system is unregistered */
  dispose() {}
  /** Should be called after the system is re-registered */
  reinit() {}
}
