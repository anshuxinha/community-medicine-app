import {
  CLOUD_LEARNING_SAVE_DEBOUNCE_MS,
  createDebouncedTask,
} from "../debouncedTask";

describe("createDebouncedTask", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("coalesces rapid schedules into one run", () => {
    const fn = jest.fn();
    const task = createDebouncedTask(fn, CLOUD_LEARNING_SAVE_DEBOUNCE_MS);
    task.schedule();
    task.schedule();
    task.schedule();
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(CLOUD_LEARNING_SAVE_DEBOUNCE_MS - 1);
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("flush runs the pending task immediately", () => {
    const fn = jest.fn();
    const task = createDebouncedTask(fn, CLOUD_LEARNING_SAVE_DEBOUNCE_MS);
    task.schedule();
    task.flush();
    expect(fn).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(CLOUD_LEARNING_SAVE_DEBOUNCE_MS);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("flush is a no-op when nothing is pending", () => {
    const fn = jest.fn();
    const task = createDebouncedTask(fn, CLOUD_LEARNING_SAVE_DEBOUNCE_MS);
    task.flush();
    expect(fn).not.toHaveBeenCalled();
  });

  test("cancel drops a pending run", () => {
    const fn = jest.fn();
    const task = createDebouncedTask(fn, CLOUD_LEARNING_SAVE_DEBOUNCE_MS);
    task.schedule();
    task.cancel();
    jest.advanceTimersByTime(CLOUD_LEARNING_SAVE_DEBOUNCE_MS);
    expect(fn).not.toHaveBeenCalled();
  });
});
