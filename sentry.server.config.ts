// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // 🎯 무료 티어: 샘플링 10% (월 5,000 이벤트 제한)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,

  // Production에서만 활성화
  enabled: process.env.NODE_ENV === "production",

  debug: false,
});
