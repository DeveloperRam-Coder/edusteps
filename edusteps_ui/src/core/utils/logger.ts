const isDev = import.meta.env?.DEV === true;

const sanitizeLog = (v: unknown) => String(v ?? '').replace(/[\r\n]/g, ' ');

export const logger = {
  log: (...args: unknown[]) => { if (isDev) console.log(...args.map(sanitizeLog)); },
  error: (...args: unknown[]) => { if (isDev) console.error(...args.map(sanitizeLog)); },
  warn: (...args: unknown[]) => { if (isDev) console.warn(...args.map(sanitizeLog)); },
  info: (...args: unknown[]) => { if (isDev) console.info(...args.map(sanitizeLog)); },
  debug: (...args: unknown[]) => { if (isDev) console.debug(...args.map(sanitizeLog)); },
};

export const errorLogger = {
  log: (message: string, error?: unknown) => {
    const e = error as any;
    const safeMsg = sanitizeLog(message);
    if (isDev) {
      console.error(safeMsg, error);
    } else {
      console.error(safeMsg, { name: sanitizeLog(e?.name), message: sanitizeLog(e?.message), status: e?.response?.status });
    }
  },
};
