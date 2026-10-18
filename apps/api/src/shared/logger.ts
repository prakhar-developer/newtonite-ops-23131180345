type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => console.log(formatMessage('info', msg, meta)),
  warn: (msg: string, meta?: Record<string, unknown>) => console.warn(formatMessage('warn', msg, meta)),
  error: (msg: string, meta?: Record<string, unknown>) => console.error(formatMessage('error', msg, meta)),
  debug: (msg: string, meta?: Record<string, unknown>) => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(formatMessage('debug', msg, meta));
    }
  },
};
