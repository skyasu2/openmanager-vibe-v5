/**
 * 🔧 SSR 호환성을 위한 전역 폴리필
 * 서버사이드 렌더링에서 브라우저 전용 API 에러 방지
 */

// SSR 환경에서 브라우저 API 접근 시 에러 방지를 위한 타입 확장
// 빈 객체로 대체되어 undefined 에러를 방지합니다.

// SSR 환경에서 브라우저 전용 API 폴리필 구현
if (typeof window === 'undefined') {
  // 전역 객체에 브라우저 API 타입으로 안전하게 할당
  const globalAny = global as typeof globalThis & {
    window?: Record<string, unknown>;
    document?: Record<string, unknown>;
    navigator?: Record<string, unknown>;
    localStorage?: Storage;
    sessionStorage?: Storage;
    self?: typeof globalThis;
  };

  // window 객체 폴리필
  if (!globalAny.window) {
    globalAny.window = {};
  }

  // document 객체 폴리필
  if (!globalAny.document) {
    globalAny.document = {};
  }

  // navigator 객체 폴리필
  if (!globalAny.navigator) {
    globalAny.navigator = {};
  }

  // localStorage 폴리필
  if (!globalAny.localStorage) {
    globalAny.localStorage = {
      getItem: (): string | null => null,
      setItem: (): void => {},
      removeItem: (): void => {},
      clear: (): void => {},
      key: (): string | null => null,
      length: 0,
    };
  }

  // sessionStorage 폴리필
  if (!globalAny.sessionStorage) {
    globalAny.sessionStorage = {
      getItem: (): string | null => null,
      setItem: (): void => {},
      removeItem: (): void => {},
      clear: (): void => {},
      key: (): string | null => null,
      length: 0,
    };
  }

  // self 객체 폴리필 (웹 워커용)
  if (typeof globalThis !== 'undefined' && !globalAny.self) {
    globalAny.self = globalThis;
  }
}

export {};
