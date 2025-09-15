/**
 * Creates a debounced version of the provided function.
 *
 * @param func - The function to debounce.
 * @param delay - Delay in milliseconds before execution.
 * @returns A new throttled function that will execute after `delay` ms.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func.apply(this, args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, delay);
  };
}
