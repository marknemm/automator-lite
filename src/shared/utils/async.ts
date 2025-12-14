import type { Nullish } from 'utility-types';

/**
 * Delays execution for a specified number of milliseconds.
 *
 * @param ms The number of milliseconds to delay. Default is `0`.
 * @returns A promise that resolves after the specified delay.
 * @throws An {@link Error} if the specified delay is negative.
 */
export async function delay(ms: number | Nullish = 0): Promise<void> {
  if (!ms) ms = 0;
  if (ms < 0) throw new Error(`Delay duration must be non-negative; was given ${ms}.`);

  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes an asynchronous closure immediately.
 *
 * @param closure The asynchronous closure to execute.
 * @returns The result of the closure.
 */
export async function exec<T>(
  closure: (...args: any[]) => Promise<T>,
  ...args: any[]
): Promise<T> {
  return await closure(...args);
}
