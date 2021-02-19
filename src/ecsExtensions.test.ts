import {updateComponent} from "./ecsExtensions";
import * as ECSY from 'ecsy';
import {cast} from './testUtils';

class Component extends ECSY.Component<any> {
  static schema = {
    value: { type: ECSY.Types.Number }
  };
}

class AnswerComponent extends ECSY.Component<any> {
  static schema = {
    answer: { type: ECSY.Types.Number }
  };
}

class BogusComponent extends ECSY.Component<any> {}

test("updateComponent", () => {
  const world = new ECSY.World()
    .registerComponent(ECSY.Component);

  const entity = world.createEntity()
    .addComponent(Component, { value: 42 })
    .addComponent(AnswerComponent, { answer: 42 });

  const valueBefore = cast<any>(entity.getComponent(Component)).value;
  const answerBefore = cast<any>(entity.getComponent(AnswerComponent)).answer;

  // TODO simplify this API
  updateComponent(entity, Component, { value: 43 });
  updateComponent(entity, AnswerComponent, {answer: 43});
  updateComponent(entity, BogusComponent, {value: "hjkl"});

  const valueAfter = cast<any>(entity.getComponent(Component)).value;
  const answerAfter = cast<any>(entity.getComponent(AnswerComponent)).answer;

  expect(valueBefore).toBe(42);
  expect(valueAfter).toBe(43);
  expect(answerBefore).toBe(42);
  expect(answerAfter).toBe(43);
});
