import { GameLoop } from "./GameLoop";
import { _window } from "./globals";

jest.mock("./globals", () => {
  return {
    _window: {
      addEventListener(type: string, listener: any) {
        if (type === "blur") {
          (this as any).capturedBlurListener = listener;
        } else if (type === "focus") {
          (this as any).capturedFocusListener = listener;
        }
      },
    },
  };
});

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

  test("opt: pauseOnWindowBlur", () => {
    const execute = jest.fn();

    const sut = new GameLoop(execute, 20, { pauseOnWindowBlur: true });

    sut.start();

    (_window as any).capturedBlurListener();

    jest.advanceTimersByTime((1000 / 20) * 3);

    expect(execute).not.toHaveBeenCalled();

    (_window as any).capturedFocusListener();

    jest.advanceTimersByTime((1000 / 20) * 3);

    expect(execute).toHaveBeenCalledTimes(3);
  });

  test.todo("adjust");
});
