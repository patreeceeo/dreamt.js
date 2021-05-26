import { SimpleComponent, Component } from "./index";
import { ObjectPool } from "./ObjectPool";

test("ObjectPool", () => {
  var id = 0;

  class T extends Component<any> implements SimpleComponent<any> {
    id: number;
    value: any;
    constructor() {
      super();
      this.id = id++;
    }
  }

  var pool = new ObjectPool<T>(T);
  var components: T[] = [];

  // Create 10 components

  for (let i = 0; i < 10; i++) {
    components.push(pool.acquire());
  }

  expect(pool.totalSize()).toBe(12);
  expect(pool.totalFree()).toBe(2);
  expect(pool.totalUsed()).toBe(10);

  // Object Pool doesn't guarantee the order of the retrieved components
  // But each attribute should be different, so we check all against all
  for (let i = 0; i < 10; i++) {
    for (let j = i + 1; j < 10; j++) {
      expect(components[i].id).not.toBe(components[j].id);
    }
  }

  // Release 3 components
  function removeElement(pos: number) {
    pool.release(components[pos]);
    components.splice(pos, 1);
  }

  removeElement(0);
  removeElement(1);
  removeElement(2);

  expect(pool.totalSize()).toBe(12);
  expect(pool.totalFree()).toBe(5);
  expect(pool.totalUsed()).toBe(7);

  // Create new components
  for (let i = 0; i < 3; i++) {
    components.push(pool.acquire());
  }

  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      expect(components[i].id).not.toBe(components[j].id);
    }
  }

  expect(pool.totalSize()).toBe(12);
  expect(pool.totalFree()).toBe(2);
  expect(pool.totalUsed()).toBe(10);
});
