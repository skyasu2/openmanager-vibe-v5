/**
 * 🔧 Polyfills for Next.js 15 (crypto-js 제거 후)
 *
 * 목표: 순수 Node.js crypto 모듈로 간소화
 * 🚨 Vercel 빌드 self 오류 완전 해결
 *
 * Note: This file intentionally uses `as unknown as T` assertions for runtime
 * environment patching. Polyfills modify global objects in ways TypeScript
 * cannot fully type.
 */

import { logger } from '@/lib/logging';

// 🚀 전역 환경 체크
const isNodeEnvironment =
  typeof process !== 'undefined' && process.versions && process.versions.node;
const isBrowserEnvironment = typeof window !== 'undefined';

// 🚨 최우선 self 객체 polyfill (Vercel 빌드 오류 해결)
if (typeof globalThis !== 'undefined') {
  // globalThis에 self 정의 (최우선)
  if (typeof globalThis.self === 'undefined') {
    (globalThis as unknown as Record<string, unknown>).self = globalThis;
  }
}

// 🚨 global 객체에도 self 정의 (Node.js 환경)
if (typeof global !== 'undefined') {
  const g = global as unknown as Record<string, unknown>;
  if (typeof g.self === 'undefined') {
    g.self = global;
  }
}

// 🚨 window 객체에도 self 정의 (브라우저 환경)
if (typeof window !== 'undefined') {
  const w = window as unknown as Record<string, unknown>;
  if (typeof w.self === 'undefined') {
    w.self = window;
  }
}

// 🚀 브라우저 환경에서 Edge case 처리
if (isBrowserEnvironment) {
  // Edge Runtime에서 missing globals 처리
  const win = window as unknown as Record<string, unknown>;

  // globalThis fallback
  if (typeof win.globalThis === 'undefined') {
    win.globalThis = window;
  }

  // self fallback
  if (typeof win.self === 'undefined') {
    win.self = window;
  }
}

// 🚀 서버사이드 환경 처리 (SSR/SSG)
if (isNodeEnvironment && !isBrowserEnvironment) {
  const glob = global as unknown as Record<string, unknown>;

  // 전역 window 객체 모킹 (필요한 경우만)
  if (typeof glob.window === 'undefined') {
    glob.window = global;
  }

  // Document 객체 모킹 (DOM 관련 라이브러리용)
  if (typeof glob.document === 'undefined') {
    glob.document = {
      createElement: () => ({}),
      createElementNS: () => ({}),
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementById: () => null,
      getElementsByClassName: () => [],
      getElementsByTagName: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
      head: { appendChild: () => {} },
      body: { appendChild: () => {} },
      documentElement: { style: {} },
    };
  }

  // Navigator 객체 모킹
  if (typeof glob.navigator === 'undefined') {
    glob.navigator = {
      userAgent: 'Node.js Server',
      platform: 'server',
      language: 'en',
    };
  }

  // Location 객체 모킹
  if (typeof glob.location === 'undefined') {
    glob.location = {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: '',
      hostname: 'localhost',
      port: '3000',
      protocol: 'http:',
    };
  }
}

// 🔐 Crypto 모듈 Polyfill (Node.js와 브라우저 통합)
if (typeof globalThis !== 'undefined') {
  const glob = globalThis as unknown as Record<string, unknown>;

  // 🚀 Node.js 환경에서 crypto 모듈 사용
  if (isNodeEnvironment && !glob.crypto) {
    void (async () => {
      try {
        // Node.js crypto 모듈을 브라우저 호환 형태로 노출
        const crypto = await import('node:crypto');

        // Web Crypto API 호환 인터페이스 제공
        glob.crypto = {
          // getRandomValues는 Web Crypto API와 호환되게
          getRandomValues: <T extends ArrayBufferView>(arr: T): T => {
            if (arr && 'length' in arr) {
              const typedArray = arr as unknown as Uint8Array;
              const length = typedArray.length;
              const randomBytes = crypto.randomBytes(length);
              for (let i = 0; i < length; i++) {
                const byte = randomBytes[i];
                if (byte !== undefined) {
                  typedArray[i] = byte;
                }
              }
            }
            return arr;
          },

          // Node.js crypto 함수들을 직접 노출
          randomUUID: crypto.randomUUID,
          subtle: undefined, // SubtleCrypto는 복잡하므로 제외

          // 추가 헬퍼 함수들
          randomBytes: crypto.randomBytes,
          createHash: crypto.createHash,
          createHmac: crypto.createHmac,
        };

        logger.info('Node.js crypto 모듈을 글로벌 crypto로 설정완료');
      } catch (error) {
        logger.warn('Node.js crypto 모듈 로드 실패:', error);
      }
    })();
  }

  // 🚀 브라우저 환경에서 crypto 확인
  if (isBrowserEnvironment && !glob.crypto) {
    logger.warn('브라우저에서 crypto API를 사용할 수 없습니다.');
  }
}

// 🚀 추가 Edge Runtime 호환성 개선
if (typeof globalThis !== 'undefined') {
  const glob = globalThis as unknown as Record<string, unknown>;

  // Edge Runtime에서 필요한 globals 보장
  if (typeof glob.self === 'undefined') {
    glob.self = globalThis;
  }

  if (typeof glob.window === 'undefined' && isBrowserEnvironment) {
    glob.window = globalThis;
  }
}

const gt = globalThis as unknown as Record<string, unknown>;
logger.info('Polyfills 로드 완료:', {
  environment: isNodeEnvironment
    ? 'Node.js'
    : isBrowserEnvironment
      ? 'Browser'
      : 'Unknown',
  hasGlobalCrypto: typeof gt.crypto !== 'undefined',
  hasSelf: typeof gt.self !== 'undefined',
  hasWindow: typeof gt.window !== 'undefined',
});
