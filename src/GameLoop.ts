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
      _window.addEventListener("blur", this.stop.bind(this));
      _window.addEventListener("focus", this._justStart.bind(this));
    }
  }

  _justStart() {
    const intervalMs = 1000 / this._frequencyHz;
    let timeMs = 0;
    this._intervalId = setInterval(() => {
      // TODO naively incrementing time by interval duration
      // get more accuracy with performance.now()?
      timeMs += intervalMs;
      this._executeFn(intervalMs, timeMs);

      this._tickCallbacks.forEach((cb) => {
        cb(intervalMs, timeMs);
      })
    }, intervalMs);
  }

  stop() {
    clearInterval(this._intervalId);
  }

  useTick(callback: IExecuteFn) {
    const savedCallback = useRef<IExecuteFn>();

    useEffect(() => {
      if (savedCallback.current && savedCallback.current != callback) {
        const indexToRemove = this._tickCallbacks.indexOf(savedCallback.current)
        this._tickCallbacks.splice(indexToRemove, 1)
      }

      savedCallback.current = callback;

      this._tickCallbacks.push(callback);
    }, [callback]);
  }
}
