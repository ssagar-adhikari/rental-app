import { addBreadcrumb, captureException } from "@/utils/sentry";

type LogContext = Record<string, unknown> | undefined;

function format(category: string, message: string, context: LogContext) {
  if (!context) {
    return [`[${category}] ${message}`];
  }

  return [`[${category}] ${message}`, context];
}

export const logger = {
  debug(category: string, message: string, context?: LogContext) {
    if (__DEV__) {
      console.log(...format(category, message, context));
    }
  },

  info(category: string, message: string, context?: LogContext) {
    if (__DEV__) {
      console.info(...format(category, message, context));
    }

    addBreadcrumb(category, message, context);
  },

  warn(category: string, message: string, context?: LogContext) {
    if (__DEV__) {
      console.warn(...format(category, message, context));
    }

    addBreadcrumb(category, `WARN: ${message}`, context);
  },

  error(category: string, error: unknown, context?: LogContext) {
    if (__DEV__) {
      console.error(`[${category}]`, error, context ?? "");
    }

    captureException(error, {
      tags: { category },
      extra: context as Record<string, unknown> | undefined,
    });
  },
};
