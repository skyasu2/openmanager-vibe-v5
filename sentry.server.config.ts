// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

// Sentry DSN (Public Key - 전송만 가능, 읽기 불가)
const SENTRY_DSN =
  process.env.SENTRY_DSN ||
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  'https://c4cfe13cdda790d1d9a6c3f92c593f39@o4509732473667584.ingest.de.sentry.io/4510731369119824';

Sentry.init({
  dsn: SENTRY_DSN,

  // 🎯 무료 티어: 샘플링 10% (월 5,000 이벤트 제한)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

  // Production에서만 활성화
  enabled: process.env.NODE_ENV === 'production',

  debug: false,
});
