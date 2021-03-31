import { GameLoop } from "./GameLoop";

jest.useFakeTimers();
describe("GameLoop", () => {
  test("start/stop", () => {
    const execute = jest.fn();
    const sut = new GameLoop(execute, 20);

    sut.start();

    jest.advanceTimersByTime((1000 / 20) * 3);

    expect(execute).toHaveBeenCalledTimes(3);
    expect(execute).toHaveBeenCalledWith(50, 50);
    expect(execute).toHaveBeenCalledWith(50, 100);
    expect(execute).toHaveBeenCalledWith(50, 150);

    sut.stop();
    execute.mockClear();

    jest.advanceTimersByTime((1000 / 20) * 2);

    expect(execute).not.toHaveBeenCalled();
  });

  test.todo("adjust");
});
