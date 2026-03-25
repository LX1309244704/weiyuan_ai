/**
 * 日志工具
 * 生产环境静默，开发环境输出
 */

const isDev = process.env.NODE_ENV !== 'production';

const logger = {
  log: (...args) => {
    if (isDev) console.log(...args);
  },
  error: (...args) => {
    if (isDev) console.error(...args);
  },
  warn: (...args) => {
    if (isDev) console.warn(...args);
  },
  info: (...args) => {
    if (isDev) console.info(...args);
  },
  debug: (...args) => {
    if (isDev) console.debug(...args);
  }
};

module.exports = logger;