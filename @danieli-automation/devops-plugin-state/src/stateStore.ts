export type StoreCreator<T> = (set: (value: Partial<T>) => void, get: () => T) => T;

export function createInMemoryStore<T extends Record<string, unknown>>(initialState: T) {
  let state = { ...initialState };

  return {
    getState: () => state,
    setState: (patch: Partial<T>) => {
      state = { ...state, ...patch };
      return state;
    }
  };
}