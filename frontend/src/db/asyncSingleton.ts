export function createAsyncSingleton<T>(factory: () => Promise<T>) {
  let instance: T | null = null;
  let pending: Promise<T> | null = null;

  return async function getSingleton(): Promise<T> {
    if (instance) {
      return instance;
    }

    if (pending) {
      return pending;
    }

    pending = factory()
      .then((value) => {
        instance = value;
        pending = null;
        return value;
      })
      .catch((error) => {
        pending = null;
        throw error;
      });

    return pending;
  };
}
