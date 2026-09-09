interface RefreshOptions<T> {
  revision: () => number;
  renew: () => Promise<T>;
  apply: (value: T) => void;
  clear: () => void;
}

export function createSessionRefresh<T>(options: RefreshOptions<T>) {
  let pending: Promise<boolean> | null = null;
  return function refresh(): Promise<boolean> {
    if (!pending) {
      const revision = options.revision();
      pending = options
        .renew()
        .then(value => {
          if (revision !== options.revision()) return false;
          options.apply(value);
          return true;
        })
        .catch(() => {
          if (revision === options.revision()) options.clear();
          return false;
        })
        .finally(() => {
          pending = null;
        });
    }
    return pending;
  };
}
