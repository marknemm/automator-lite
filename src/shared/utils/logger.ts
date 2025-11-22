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
  debug: (...args: any[]): void => {
    if (DEBUG) console.debug(...args);
  },

  /**
   * Logs an informational message.
   *
   * @param args The arguments to log.
   */
  info: (...args: any[]): void => {
    console.info(...args);
  },

  /**
   * Logs a warning message.
   *
   * @param args The arguments to log.
   */
  warn: (...args: any[]): void => {
    console.warn(...args);
  },

  /**
   * Logs an error message.
   *
   * @param args The arguments to log.
   */
  error: (...args: any[]): void => {
    console.error(...args);
  },

};
