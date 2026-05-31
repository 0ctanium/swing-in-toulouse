(function initScrapLog(global) {
  const PREFIX = "[Swing Scrap]";

  global.ScrapExt = global.ScrapExt || {};
  global.ScrapExt.log = {
    info(...args) {
      console.log(PREFIX, ...args);
    },
    warn(...args) {
      console.warn(PREFIX, ...args);
    },
    error(...args) {
      console.error(PREFIX, ...args);
    },
  };
})(globalThis);
