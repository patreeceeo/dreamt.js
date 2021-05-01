export {
    _Entity as Entity,
    Not,
    Component,
    SystemStateComponent,
    TagComponent,
    Types,
    World,
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

export { System } from './System';

import { Component, ComponentConstructor as ComponentConstructorECSY } from 'ecsy';

export type ComponentConstructor<T extends Component<any> = Component<any>> = ComponentConstructorECSY<T>;

export { addComponent, removeComponent, replaceComponent, updateComponent } from "./ecsExtensions";

export { Correspondent, IEntityComponentData, IEntityComponentDiff, IEntityComponentFlags } from './Correspondent';

export { GameLoop } from './GameLoop';

export { DualModel } from './DualModel';

export { useStateFromComponentMap } from './reactHooks';

export * as camera from './camera';

