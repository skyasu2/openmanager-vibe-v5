/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 🔧 Polyfills for Next.js 15 (crypto-js 제거 후)
 *
 * 목표: 순수 Node.js crypto 모듈로 간소화
 * 🚨 Vercel 빌드 self 오류 완전 해결
 * 
 * Note: 'any' types are intentionally used for runtime environment setup
 */

// 🚀 전역 환경 체크
const isNodeEnvironment =
  typeof process !== 'undefined' && process.versions && process.versions.node;
const isBrowserEnvironment = typeof window !== 'undefined';

// 🚨 최우선 self 객체 polyfill (Vercel 빌드 오류 해결)
if (typeof globalThis !== 'undefined') {
  // globalThis에 self 정의 (최우선)
  if (typeof globalThis.self === 'undefined') {
    (globalThis as any).self = globalThis;
  }
}

// 🚨 global 객체에도 self 정의 (Node.js 환경)
if (typeof global !== 'undefined') {
  if (typeof (global as any).self === 'undefined') {
    (global as any).self = global;
  }
}

// 🚨 window 객체에도 self 정의 (브라우저 환경)
if (typeof window !== 'undefined') {
  if (typeof (window as any).self === 'undefined') {
    (window as any).self = window;
  }
}

// 🚀 브라우저 환경에서 Edge case 처리
if (isBrowserEnvironment) {
  // Edge Runtime에서 missing globals 처리
  const win = window as any;

  // globalThis fallback
  if (typeof win.globalThis === 'undefined') {
    win.globalThis = win;
  }

  // self fallback
  if (typeof win.self === 'undefined') {
    win.self = win;
  }
}

// 🚀 서버사이드 환경 처리 (SSR/SSG)
if (isNodeEnvironment && !isBrowserEnvironment) {
  const glob = global as any;

  // 전역 window 객체 모킹 (필요한 경우만)
  if (typeof glob.window === 'undefined') {
    glob.window = glob;
  }

  // Document 객체 모킹 (DOM 관련 라이브러리용)
  if (typeof glob.document === 'undefined') {
    glob.document = {
      createElement: () => ({}),
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
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
  const glob = globalThis as any;

  // 🚀 Node.js 환경에서 crypto 모듈 사용
  if (isNodeEnvironment && !glob.crypto) {
    void (async () => {
      try {
        // Node.js crypto 모듈을 브라우저 호환 형태로 노출
        const crypto = await import('crypto');

        // Web Crypto API 호환 인터페이스 제공
        glob.crypto = {
          // getRandomValues는 Web Crypto API와 호환되게
          getRandomValues: (arr: any) => {
            if (arr && arr.length) {
              const randomBytes = crypto.randomBytes(arr.length);
              for (let i = 0; i < arr.length; i++) {
                arr[i] = randomBytes[i];
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

        console.log('✅ Node.js crypto 모듈을 글로벌 crypto로 설정완료');
      } catch (error) {
        console.warn('⚠️ Node.js crypto 모듈 로드 실패:', error);
      }
    })();
  }

  // 🚀 브라우저 환경에서 crypto 확인
  if (isBrowserEnvironment && !glob.crypto) {
    console.warn('⚠️ 브라우저에서 crypto API를 사용할 수 없습니다.');
  }
}

// 🚀 추가 Edge Runtime 호환성 개선
if (typeof globalThis !== 'undefined') {
  const glob = globalThis as any;

  // Edge Runtime에서 필요한 globals 보장
  if (typeof glob.self === 'undefined') {
    glob.self = glob;
  }

  if (typeof glob.window === 'undefined' && isBrowserEnvironment) {
    glob.window = glob;
  }
}

console.log('🚀 Polyfills 로드 완료:', {
  environment: isNodeEnvironment
    ? 'Node.js'
    : isBrowserEnvironment
      ? 'Browser'
      : 'Unknown',
  hasGlobalCrypto: typeof (globalThis as any)?.crypto !== 'undefined',
  hasSelf: typeof (globalThis as any)?.self !== 'undefined',
  hasWindow: typeof (globalThis as any)?.window !== 'undefined',
});
