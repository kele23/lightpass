import consola from 'consola';
import { H3Event } from 'nitro/h3';

export const logger = {
  info: (message: string, event?: H3Event, data?: any) => log('info', message, event, data),
  error: (message: string, event?: H3Event, data?: any) => log('error', message, event, data),
  warn: (message: string, event?: H3Event, data?: any) => log('warn', message, event, data),
};

function log(level: 'info' | 'error' | 'warn', message: string, event?: H3Event, data?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    request: event
      ? {
          method: event.req?.method,
          url: event.url?.pathname + event.url?.search,
          headers: event.req?.headers,
        }
      : 'No Request Context',
    data,
  };

  switch (level) {
    case 'info':
      consola.info(JSON.stringify(logEntry));
      break;
    case 'error':
      consola.error(JSON.stringify(logEntry));
      break;
    case 'warn':
      consola.warn(JSON.stringify(logEntry));
      break;
  }
}
