const DEBUG = process.env.NODE_ENV !== 'production';

/**
 * A simple logging utility.
 */
export const log = {

  /**
   * Logs a debug message.
   *
   * This message is only logged if the environment is `development`.
   *
   * @param args The arguments to log.
   */
  debug: DEBUG ? console.debug.bind(console) : () => {},

  /**
   * Logs an informational message.
   *
   * @param args The arguments to log.
   */
  info: console.info.bind(console),

  /**
   * Logs a warning message.
   *
   * @param args The arguments to log.
   */
  warn: console.warn.bind(console),

  /**
   * Logs an error message.
   *
   * @param args The arguments to log.
   */
  error: console.error.bind(console),

  /**
   * Logs and throws an error.
   *
   * @param err The error to log and throw.
   * @throws The provided error after logging it to the console.
   */
  throw: (err: any): never => {
    log.error(err);
    throw (err instanceof Error)
      ? err
      : new Error(String(err));
  },

};

export default log;
