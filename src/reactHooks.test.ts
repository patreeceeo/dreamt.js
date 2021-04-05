import { act, renderHook } from "@testing-library/react-hooks";
import { useStateFromComponentMap } from "./reactHooks";
import * as ECSY from "ecsy";

class Component1 extends ECSY.Component<any> {
  static schema = {
    value: { type: ECSY.Types.Number },
  };
}
class Component2 extends ECSY.Component<any> {
  static schema = {
    value: { type: ECSY.Types.Number },
  };
}

test("useStateFromComponentMap", () => {
  const world = new ECSY.World()
    .registerComponent(Component1)
    .registerComponent(Component2);

  const entity = world
    .createEntity()
    .addComponent(Component1, { value: 1 })
    .addComponent(Component2, { value: 2 });

  const map = {
    c1: Component1,
    c2: Component2,
  };

  const { result, rerender } = renderHook(() =>
    useStateFromComponentMap(entity, map)
  );

  expect(result.current[0]).toEqual({ c1: 1, c2: 2 });

  (entity.getMutableComponent(Component1) as any).value = 11;
  (entity.getMutableComponent(Component2) as any).value = 22;

  act(result.current[1]);

  rerender();

  expect(result.current[0]).toEqual({ c1: 11, c2: 22 });
});
