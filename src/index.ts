export {
    _Entity as Entity,
    System,
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

import { Component, ComponentConstructor as ComponentConstructorECSY } from 'ecsy';

export type ComponentConstructor<T extends Component<any> = Component<any>> = ComponentConstructorECSY<T>;

export { addComponent, removeComponent, replaceComponent, updateComponent, copyMap } from "./ecsExtensions";

export { EntityRenderConnector, RenderState } from "./render";

export const Correspondent = require('./Correspondent');
