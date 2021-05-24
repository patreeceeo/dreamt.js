
export function lazyFactory<T>(factory: () => T) {
  return (() => {
    let instance: T;
    return () => {
      instance = instance || factory();
      return instance;
    }
  })()
}
