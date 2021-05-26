import { mapPool } from "./pools";

const scratchPad: Map<() => any, Map<number, any>> = mapPool.acquireValue();

export function scratch<T>(index: number, acquireFn: () => T): T {
  const typedScratchPad = scratchPad.get(acquireFn) || mapPool.acquireValue();
  const result = (typedScratchPad && typedScratchPad.get(index)) || acquireFn();
  typedScratchPad.set(index, result);
  scratchPad.set(acquireFn, typedScratchPad);
  return result;
}
