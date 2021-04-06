import { _window } from "./globals";
import { useEffect, useRef } from "react";

interface IExecuteFn {
  (deltaMs: number, timeMs: number): void;
}

interface IOptions {
  pauseOnWindowBlur?: boolean;
}

export class GameLoop {
  _started = false;
  _executeFn: IExecuteFn;
  _frequencyHz: number;
  _options: IOptions;
  _intervalId: any;
  _tickCallbacks: IExecuteFn[] = [];
  _timeMs = 0;

  constructor(
    executeFn: IExecuteFn,
    frequencyHz: number,
    options: IOptions = {}
  ) {
    this._executeFn = executeFn;
    this._frequencyHz = frequencyHz;
    this._options = options;
  }

  start() {
    this._justStart();

    if (this._options.pauseOnWindowBlur) {
      _window.addEventListener("blur", this.pause.bind(this));
      _window.addEventListener("focus", this._justStart.bind(this));
    }
  }

  _justStart() {
    const intervalMs = 1000 / this._frequencyHz;
    this._intervalId = setInterval(() => {
      // TODO naively incrementing time by interval duration
      // get more accuracy with performance.now()?
      this._timeMs += intervalMs;
      this._executeFn(intervalMs, this._timeMs);

      this._tickCallbacks.forEach((cb) => {
        cb(intervalMs, this._timeMs);
      })
    }, intervalMs);
  }

  pause() {
    clearInterval(this._intervalId);
  }

  stop() {
    this._timeMs = 0;
    clearInterval(this._intervalId);
  }

  useTick(callback: IExecuteFn) {
    const savedCallback = useRef<IExecuteFn>();

    useEffect(() => {
      if (savedCallback.current && savedCallback.current != callback) {
        removeEventListener(this._tickCallbacks, savedCallback.current)
      }

      savedCallback.current = callback;

      this._tickCallbacks.push(callback);

      return () => {
        removeEventListener(this._tickCallbacks, callback)
      }
    }, [callback]);
  }
}

function removeEventListener(stack: any[], callback: any) {
  for (var i = 0, l = stack.length; i < l; i++) {
    if (stack[i] === callback){
      stack.splice(i, 1);
      return;
    }
  }
};
