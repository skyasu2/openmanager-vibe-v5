/**
 * 🔧 Polyfills for Next.js 15 (crypto-js 제거 후)
 *
 * 목표: 순수 Node.js crypto 모듈로 간소화
 * 🚨 Vercel 빌드 self 오류 완전 해결
 */

// 🚀 전역 환경 체크
const isNodeEnvironment =
  typeof process !== 'undefined' && process.versions && process.versions.node;
const isBrowserEnvironment = typeof window !== 'undefined';

// 🚨 최우선 self 객체 polyfill (Vercel 빌드 오류 해결)
if (typeof globalThis !== 'undefined') {
  // globalThis에 self 정의 (최우선)
  if (typeof globalThis.self === 'undefined') {
    globalThis.self = globalThis;
  }
}

// 🚨 global 객체에도 self 정의 (Node.js 환경)
if (typeof global !== 'undefined') {
  if (typeof global.self === 'undefined') {
    global.self = global;
  }
}

// 🚨 window 객체에도 self 정의 (브라우저 환경)
if (typeof window !== 'undefined') {
  if (typeof window.self === 'undefined') {
    window.self = window;
  }
}

// 🔐 Node.js crypto 모듈 사용 강제 설정
if (isNodeEnvironment) {
  // Node.js 환경에서 crypto 모듈 사용 강제
  process.env.FORCE_NODE_CRYPTO = 'true';

  // 🚀 서버 사이드에서 self 객체 polyfill (강화)
  if (typeof global !== 'undefined') {
    if (typeof global.self === 'undefined') {
      global.self = global;
    }

    // 🌐 서버 사이드에서 window 객체 polyfill (필요한 경우)
    if (typeof global.window === 'undefined') {
      global.window = global;
    }

    // 🚨 추가 브라우저 API polyfills
    if (typeof global.document === 'undefined') {
      global.document = {
        createElement: () => ({}),
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {},
        removeEventListener: () => {},
      };
    }

    if (typeof global.navigator === 'undefined') {
      global.navigator = {
        userAgent: 'node.js',
        platform: 'node',
        language: 'ko-KR',
      };
    }

    if (typeof global.location === 'undefined') {
      global.location = {
        href: '',
        origin: '',
        pathname: '',
        search: '',
        hash: '',
        hostname: 'localhost',
        port: '',
        protocol: 'https:',
      };
    }

    // 🚨 localStorage/sessionStorage polyfills
    if (typeof global.localStorage === 'undefined') {
      global.localStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        length: 0,
        key: () => null,
      };
    }

    if (typeof global.sessionStorage === 'undefined') {
      global.sessionStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        length: 0,
        key: () => null,
      };
    }
  }
}

// 🌐 브라우저 환경에서 기본 polyfills
if (isBrowserEnvironment) {
  // 브라우저 환경에서 필요한 최소한의 polyfills
  console.log('🌐 브라우저 환경 감지: 기본 polyfills 적용');

  // 🚨 브라우저에서도 self 확실히 정의
  if (typeof self === 'undefined') {
    window.self = window;
  }
} else {
  // Node.js 환경
  console.log('🔧 Node.js 환경 감지: 서버 사이드 렌더링 모드');
  console.log('🚨 Self polyfill 적용 완료');
}

// 🚨 추가 안전장치 - 런타임에서 self 체크
try {
  if (typeof self === 'undefined') {
    if (typeof global !== 'undefined') {
      global.self = global;
    } else if (typeof globalThis !== 'undefined') {
      globalThis.self = globalThis;
    } else if (typeof window !== 'undefined') {
      window.self = window;
    }
  }
} catch (error) {
  console.warn('⚠️ Self polyfill 적용 중 오류:', error);
}

// 🚀 Next.js 15 호환성 설정
export const polyfillsLoaded = true;
export const selfPolyfillApplied = typeof self !== 'undefined';

// 🚨 디버깅용 로그
if (isNodeEnvironment && process.env.NODE_ENV === 'development') {
  console.log('🔧 Polyfills 로드 완료');
  console.log('🚨 Self 정의됨:', typeof self !== 'undefined');
  console.log('🌍 환경:', isNodeEnvironment ? 'Node.js' : 'Browser');
}