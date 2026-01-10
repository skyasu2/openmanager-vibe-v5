/**
 * 🌍 Runtime Environment Detection Utilities
 *
 * 서버/클라이언트 환경 감지를 위한 공통 유틸리티
 * Next.js의 isomorphic 환경에서 안전하게 사용 가능
 *
 * @example
 * ```ts
 * import { isServer, isClient, canUseDOM } from '@/lib/runtime/environment';
 *
 * if (isServer) {
 *   // Node.js 전용 코드 (fs, path 등)
 * }
 *
 * if (canUseDOM) {
 *   // DOM API 사용 가능 (window, document 등)
 * }
 * ```
 */

/**
 * 서버 환경 여부 (Node.js)
 * - SSR, API Routes, getServerSideProps 등에서 true
 * - 브라우저에서 false
 */
import { logger } from '@/lib/logging';
export const isServer: boolean = typeof window === 'undefined';

/**
 * 클라이언트 환경 여부 (브라우저)
 * - 브라우저에서 true
 * - SSR, API Routes 등에서 false
 */
export const isClient: boolean = !isServer;

/**
 * DOM API 사용 가능 여부
 * - window, document 등 DOM API 접근 가능할 때 true
 * - SSR 중에는 false
 */
export const canUseDOM: boolean =
  typeof window !== 'undefined' &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined';

/**
 * Web Worker 환경 여부
 */
export const isWebWorker: boolean =
  typeof self !== 'undefined' &&
  typeof (self as { WorkerGlobalScope?: unknown }).WorkerGlobalScope !==
    'undefined';

/**
 * 개발 환경 여부
 */
export const isDevelopment: boolean = process.env.NODE_ENV === 'development';

/**
 * 프로덕션 환경 여부
 */
export const isProduction: boolean = process.env.NODE_ENV === 'production';

/**
 * 테스트 환경 여부
 */
export const isTest: boolean = process.env.NODE_ENV === 'test';

/**
 * Vercel 배포 환경 여부
 */
export const isVercel: boolean = process.env.VERCEL === '1';

/**
 * 환경 정보 객체 (디버깅용)
 */
export const environmentInfo = {
  isServer,
  isClient,
  canUseDOM,
  isWebWorker,
  isDevelopment,
  isProduction,
  isTest,
  isVercel,
  nodeEnv: process.env.NODE_ENV,
} as const;

/**
 * 서버 전용 코드 실행 래퍼
 * @param fn 서버에서만 실행할 함수
 * @returns 서버에서는 함수 실행 결과, 클라이언트에서는 undefined
 */
export function runOnServer<T>(fn: () => T): T | undefined {
  if (isServer) {
    return fn();
  }
  return undefined;
}

/**
 * 클라이언트 전용 코드 실행 래퍼
 * @param fn 클라이언트에서만 실행할 함수
 * @returns 클라이언트에서는 함수 실행 결과, 서버에서는 undefined
 */
export function runOnClient<T>(fn: () => T): T | undefined {
  if (isClient) {
    return fn();
  }
  return undefined;
}

/**
 * 서버에서 동적으로 Node.js 모듈 로드
 * 클라이언트 번들에 포함되지 않음
 *
 * @example
 * ```ts
 * const fs = requireServerModule<typeof import('fs')>('fs');
 * const path = requireServerModule<typeof import('path')>('path');
 * ```
 */
export function requireServerModule<T>(moduleName: string): T | null {
  if (!isServer) {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(moduleName) as T;
  } catch {
    logger.warn(`[environment] Failed to load server module: ${moduleName}`);
    return null;
  }
}
