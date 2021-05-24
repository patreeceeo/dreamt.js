import { lazyFactory } from "./lazy";

test("lazyFactory", () => {
  const robotFactory = jest.fn(() => ({}));

  const lazyRobotFactory = lazyFactory(robotFactory);

  expect(lazyRobotFactory()).toBe(lazyRobotFactory());
  expect(robotFactory).toHaveBeenCalledTimes(1);
});
