/**
 * Polls a function until a condition is met.
 *
 * @param fn - Async function to call on each poll
 * @param isComplete - Predicate that returns true when polling should stop
 * @param options - Polling configuration
 * @returns The final result that satisfied isComplete
 */
export async function pollUntilComplete<T>(
  fn: () => Promise<T>,
  isComplete: (result: T) => boolean,
  options?: {
    /** Polling interval in ms. Default: 2000 */
    interval?: number;
    /** Maximum number of poll attempts. Default: 150 */
    maxAttempts?: number;
    /** Called on each poll with the current result */
    onProgress?: (result: T) => void;
  },
): Promise<T> {
  const interval = options?.interval ?? 2000;
  const maxAttempts = options?.maxAttempts ?? 150;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await fn();

    options?.onProgress?.(result);

    if (isComplete(result)) {
      return result;
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  // Return the last result even if not complete
  const finalResult = await fn();
  options?.onProgress?.(finalResult);
  return finalResult;
}
