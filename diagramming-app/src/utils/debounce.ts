export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debouncedFunc = function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func.apply(this, args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, delay);
  };

  debouncedFunc.cancel = () => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
  };

  return debouncedFunc;
}