// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // 🎯 무료 티어 최적화: Replay 비활성화 (이벤트 절약)
  integrations: [],

  // 🎯 무료 티어: 샘플링 10% (월 5,000 이벤트 제한)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,

  // 🎯 Replay 비활성화 (무료 티어 제한)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // 개발 환경에서만 에러 전송
  enabled: process.env.NODE_ENV === "production",

  debug: false,
});
