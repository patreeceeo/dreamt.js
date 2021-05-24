export class ObjectPool {
  T: any;
  constructor(T: any) {
    this.T = T;
  }

  acquire() {
    return new this.T();
  }
}
