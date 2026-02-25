/**
 * Logger utility - Supprime les logs en production
 * 3.3 - Console.log en production
 */

export const logger = {
  log: (...args: any[]) => {
    if (__DEV__) console.log(...args);
  },
  warn: (...args: any[]) => {
    if (__DEV__) console.warn(...args);
  },
  error: (...args: any[]) => {
    // Toujours logger les erreurs, même en production
    console.error(...args);
  },
  info: (...args: any[]) => {
    if (__DEV__) console.info(...args);
  },
  debug: (...args: any[]) => {
    if (__DEV__) console.debug(...args);
  },
};

export default logger;
