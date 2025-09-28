/**
 * Logs and throws an error.
 *
 * @param err The error to log and throw.
 * @throws The provided error after logging it to the console.
 */
export function logAndThrow(err: any): never {
  console.error(err);
  throw (err instanceof Error)
    ? err
    : new Error(String(err));
}
