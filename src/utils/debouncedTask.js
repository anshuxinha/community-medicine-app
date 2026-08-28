export const CLOUD_LEARNING_SAVE_DEBOUNCE_MS = 700;

export const createDebouncedTask = (fn, delayMs) => {
  let timer = null;
  let pending = false;

  const run = () => {
    pending = false;
    return fn();
  };

  const schedule = () => {
    pending = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      run();
    }, delayMs);
  };

  const flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (!pending) return undefined;
    return run();
  };

  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    pending = false;
  };

  const isPending = () => pending;

  return { schedule, flush, cancel, isPending };
};
