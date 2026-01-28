/**
 * Sentry Error Tracking for AI Engine
 *
 * Cloud Run 환경에서 에러 모니터링
 * 무료 티어 최적화 설정 적용
 */

import * as Sentry from '@sentry/node';
import { version } from '../../package.json';

// Sentry DSN (Public Key - 전송만 가능)
const SENTRY_DSN =
  process.env.SENTRY_DSN ||
  'https://c4cfe13cdda790d1d9a6c3f92c593f39@o4509732473667584.ingest.de.sentry.io/4510731369119824';

let isInitialized = false;

/**
 * Sentry 초기화
 */
export function initSentry(): void {
  if (isInitialized) return;

  const isProd = process.env.NODE_ENV === 'production';

  Sentry.init({
    dsn: SENTRY_DSN,

    // 환경 정보
    environment: isProd ? 'production' : 'development',
    release: `ai-engine@${version}`,

    // 🎯 무료 티어: 샘플링 30% (월 10,000 트랜잭션 제한, ~70% 사용)
    tracesSampleRate: isProd ? 0.3 : 0,

    // Production에서만 활성화
    enabled: isProd,

    // 디버그 비활성화
    debug: false,

    // 추가 컨텍스트
    initialScope: {
      tags: {
        service: 'ai-engine',
        runtime: 'cloud-run',
      },
    },

    // 민감 정보 필터링
    beforeSend(event) {
      // API 키 등 민감 정보 제거
      if (event.request?.headers) {
        delete event.request.headers['x-api-key'];
        delete event.request.headers['authorization'];
      }
      return event;
    },
  });

  isInitialized = true;
  console.log(`✅ Sentry initialized (enabled: ${isProd})`);
}

/**
 * 에러 캡처
 */
export function captureError(error: Error, context?: Record<string, unknown>): string {
  return Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * 메시지 캡처
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): string {
  return Sentry.captureMessage(message, level);
}

/**
 * 사용자 컨텍스트 설정
 */
export function setUser(user: { id?: string; ip?: string }): void {
  Sentry.setUser(user);
}

/**
 * 태그 추가
 */
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

/**
 * 이벤트 플러시 (종료 전 호출)
 */
export async function flushSentry(timeout = 2000): Promise<boolean> {
  return Sentry.flush(timeout);
}

/**
 * Sentry 종료
 */
export async function closeSentry(): Promise<void> {
  await Sentry.close(2000);
}

// Re-export Sentry for direct access
export { Sentry };
