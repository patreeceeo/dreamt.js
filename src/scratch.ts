import { acquireMap } from "./pools";

const scratchPad: Map<() => any, Map<number, any>> = acquireMap();

export function scratch<T>(index: number, acquireFn: () => T): T {
  const typedScratchPad = scratchPad.get(acquireFn) || acquireMap();
  const result = (typedScratchPad && typedScratchPad.get(index)) || acquireFn();
  typedScratchPad.set(index, result);
  scratchPad.set(acquireFn, typedScratchPad);
  return result;
}
