import * as Sentry from "@sentry/react";

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      if (import.meta.env.MODE === "development") {
        return null;
      }
      return event;
    },
  });
};

export { Sentry };
