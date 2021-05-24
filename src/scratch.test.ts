import { scratch } from "./scratch";

test("scratch", () => {
  const robotFactory = jest.fn(() => ({}));

  expect(scratch(1, robotFactory)).toBe(scratch(1, robotFactory));
  expect(scratch(2, robotFactory)).toBe(scratch(2, robotFactory));
  expect(scratch(1, robotFactory)).not.toBe(scratch(2, robotFactory));
  expect(robotFactory).toHaveBeenCalledTimes(2);
});
