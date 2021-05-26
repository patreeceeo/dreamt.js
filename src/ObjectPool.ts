import {ComponentConstructor, SimpleComponent} from ".";


/**
 * Based on ECSY's implementation. Pay the cost of memory allocation up front by
 * allocating a contigous, homogenous array in memory all-at-once. Allow objects
 * of a certain type to be acquired and released as needed. Prevents the GC from
 * reclaiming this memory.
 */
export class ObjectPool<K extends SimpleComponent<any>> {
  freeList: K[];
  count = 0;
  K: ComponentConstructor<K>;
  isObjectPool = true;
  constructor(K: ComponentConstructor<K>, initialSize = 0) {
    this.freeList = [];
    this.K = K;

    this.expand(initialSize);
  }

  acquire(): K {
    // Grow the list by 20%ish if we're out
    if (this.freeList.length <= 0) {
      this.expand(Math.round(this.count * 0.2) + 1);
    }

    var item = this.freeList.pop();

    return item!;
  }

  acquireValue = (): K["value"] => {
    return this.acquire().value;
  }

  release(item: K) {
    item.reset();
    this.freeList.push(item);
  }

  expand(count: number) {
    for (var n = 0; n < count; n++) {
      var clone = new (this.K as any)();
      clone._pool = this;
      this.freeList.push(clone);
    }
    this.count += count;
  }

  totalSize() {
    return this.count;
  }

  totalFree() {
    return this.freeList.length;
  }

  totalUsed() {
    return this.count - this.freeList.length;
  }
}
