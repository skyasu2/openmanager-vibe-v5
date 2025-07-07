/**
 * 🔧 SSR 호환성을 위한 전역 폴리필
 * 서버사이드 렌더링에서 브라우저 전용 API 에러 방지
 */

// self 객체 폴리필 (웹 워커용)
if (typeof globalThis !== 'undefined') {
  // @ts-ignore
  globalThis.self = globalThis.self || globalThis;
}

// window 객체 폴리필 (서버사이드용)
if (typeof window === 'undefined') {
  // @ts-ignore
  global.window = {};
}

// document 객체 폴리필 (서버사이드용)
if (typeof document === 'undefined') {
  // @ts-ignore
  global.document = {};
}

// navigator 객체 폴리필 (서버사이드용)
if (typeof navigator === 'undefined') {
  // @ts-ignore
  global.navigator = {};
}

// localStorage 폴리필 (서버사이드용)
if (typeof localStorage === 'undefined') {
  // @ts-ignore
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  };
}

// sessionStorage 폴리필 (서버사이드용)
if (typeof sessionStorage === 'undefined') {
  // @ts-ignore
  global.sessionStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  };
}

export {};
