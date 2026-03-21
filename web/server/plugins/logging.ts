import { definePlugin } from 'nitro';
import { H3Event, HTTPError } from 'nitro/h3';
import { logger } from '../utils/logger.ts';

export default definePlugin((nitroApp) => {
  // 2. Global Error Handler
  nitroApp.hooks.hook('error', async (error: Error, { event }: { event: H3Event }) => {
    // do not log silent errors
    if (error instanceof HTTPError && error.data?.silent) {
      return;
    }

    // This triggers for all exceptions in your event handlers
    const errorLog = {
      message: error.message,
      stack: error.stack,
      statusCode: error instanceof HTTPError ? error.status : 500,
      path: event.url.pathname,
    };

    logger.error(' [EXCEPTION] ', event, errorLog);
  });
});
