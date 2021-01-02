import {World} from 'ecsy';
import execute from './execute';

function getSpyCallArg(fn: any, callIdx: number, argIdx: number) {
  return (fn as jasmine.Spy).calls.argsFor(callIdx)[argIdx];
}
function getMockCallArg(fn: any, callIdx: number, argIdx: number) {
  return (fn as jest.Mock).mock.calls[callIdx][argIdx];
}

describe("execute", () => {
  it("sets world update rate comensurate with display refresh rate", () => {
    // Because even though rendering happens in its own loop, there's no sense
    // in doing computations that won't effect rendering?
    const freqHz = 60;
    const deltaTime = 1000 / freqHz;
    const world = new World();
    let rafFn: (timestamp: number)=>void;

    spyOn(performance, "now").and.returnValue(0)
    spyOn(window, "requestAnimationFrame");

    world.execute = jest.fn();

    execute(world);

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);

    rafFn = getSpyCallArg(requestAnimationFrame, 0, 0)
    rafFn(deltaTime);

    expect(getMockCallArg(world.execute, 0, 0))
      .toBe(deltaTime)
    expect(getMockCallArg(world.execute, 0, 1))
      .toBe(deltaTime)

    // test self-perpetuation
    expect(getSpyCallArg(requestAnimationFrame, 1, 0)).toBe(rafFn);

  });
});
