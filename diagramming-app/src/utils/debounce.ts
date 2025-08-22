
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null;

  return function (this: any, ...args: Parameters<T>): void {
    const context = this;
    const later = () => {
      timeout = null;
      func.apply(context, args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, delay);
  };
}
