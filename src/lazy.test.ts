import {lazyFactory} from "./lazy";

test("lazyFactory", () => {
  function robotFactory () {
    return {};
  }

  const lazyRobotFactory = lazyFactory(robotFactory);

  expect(lazyRobotFactory()).toBe(lazyRobotFactory());
});
