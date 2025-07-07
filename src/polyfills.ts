/**
 * 🔧 Polyfills for Next.js 15 (crypto-js 제거 후)
 *
 * 목표: 순수 Node.js crypto 모듈로 간소화
 */

// 🚀 전역 환경 체크
const isNodeEnvironment =
  typeof process !== 'undefined' && process.versions && process.versions.node;
const isBrowserEnvironment = typeof window !== 'undefined';

// 🔐 Node.js crypto 모듈 사용 강제 설정
if (isNodeEnvironment) {
  // Node.js 환경에서 crypto 모듈 사용 강제
  process.env.FORCE_NODE_CRYPTO = 'true';

  // 🚀 서버 사이드에서 self 객체 polyfill
  if (typeof global !== 'undefined' && typeof global.self === 'undefined') {
    (global as any).self = global;
  }

  // 🌐 서버 사이드에서 window 객체 polyfill (필요한 경우)
  if (typeof global !== 'undefined' && typeof global.window === 'undefined') {
    global.window = global as any;
  }
}

// 🌐 브라우저 환경에서 기본 polyfills
if (isBrowserEnvironment) {
  // 브라우저 환경에서 필요한 최소한의 polyfills
  console.log('🌐 브라우저 환경 감지: 기본 polyfills 적용');

  // 필요한 경우 추가 polyfills 여기에 추가
} else {
  // Node.js 환경
  console.log('🔧 Node.js 환경 감지: 서버 사이드 렌더링 모드');
}

// 🚀 Next.js 15 호환성 설정
export const polyfillsLoaded = true;
