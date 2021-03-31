interface IExecuteFn {
  (deltaMs: number, timeMs: number): void;
}

export class GameLoop {
  _executeFn: IExecuteFn;
  _frequencyHz: number;
  _intervalId: any;

  constructor(executeFn: IExecuteFn, frequencyHz: number) {
    this._executeFn = executeFn;
    this._frequencyHz = frequencyHz;
  }

  start() {
    const intervalMs = 1000 / this._frequencyHz;
    let timeMs = 0;
    this._intervalId = setInterval(() => {
      // TODO naively incrementing time by interval duration
      // get more accuracy with performance.now()?
      timeMs += intervalMs;
      this._executeFn(intervalMs, timeMs);
    }, intervalMs);
  }

  stop() {
    clearInterval(this._intervalId);
  }
}
