import { GameLoop } from "./GameLoop";
import { _window } from "./globals";
import { renderHook } from '@testing-library/react-hooks';

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

    jest.advanceTimersByTime(20 * 3);

    expect(execute).toHaveBeenCalledTimes(3);
    expect(execute).toHaveBeenCalledWith(20, 20);
    expect(execute).toHaveBeenCalledWith(20, 40);
    expect(execute).toHaveBeenCalledWith(20, 60);

    sut.stop();
    execute.mockClear();

    jest.advanceTimersByTime(20 * 2);

    expect(execute).not.toHaveBeenCalled();
  });

  test("opt: pauseOnWindowBlur", () => {
    const execute = jest.fn();
    const sut = new GameLoop(execute, 20, { pauseOnWindowBlur: true });

    sut.start();
    (_window as any).capturedBlurListener();
    jest.advanceTimersByTime(20 * 3);

    expect(execute).not.toHaveBeenCalled();

    (_window as any).capturedFocusListener();

    jest.advanceTimersByTime(20 * 3);

    expect(execute).toHaveBeenCalledTimes(3);

    // Time should pick up where it left off

    (_window as any).capturedBlurListener();
    (_window as any).capturedFocusListener();
    jest.advanceTimersByTime(20 * 3);

    expect(execute).toHaveBeenCalledWith(20, 6 * 20)
  });

  test("useTick hook", () => {
    const sut = new GameLoop(()=>{}, 20);
    const spy1 = jest.fn();
    const spy2 = jest.fn();

    const {rerender, unmount} = renderHook(({callback}) => sut.useTick(callback), {initialProps: { callback: spy1 }})

    sut.start();

    jest.advanceTimersByTime(20 * 3);

    expect(spy1).toHaveBeenCalledTimes(3);

    rerender({callback: spy2});
    spy1.mockClear();

    jest.advanceTimersByTime(20 * 3);

    expect(spy2).toHaveBeenCalledTimes(3);
    expect(spy1).not.toHaveBeenCalled();

    // remove callback on unmount
    spy1.mockClear();
    spy2.mockClear();

    unmount();
    rerender({callback: spy1});

    jest.advanceTimersByTime(20 * 3);

    expect(spy1).toHaveBeenCalledTimes(3);
    expect(spy2).not.toHaveBeenCalled();
  });

  test.todo("adjust");
});
