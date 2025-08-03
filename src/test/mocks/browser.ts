/**
 * 🌐 브라우저 API Mock
 * DOM, BOM API들을 Mock으로 제공
 */

import { vi } from 'vitest';

// 브라우저 환경에서만 실행
if (typeof window === 'undefined') {
  console.warn('browser.ts: Skipping browser mocks in Node environment');
  export {};
} else {
  // ===============================
  // 🎯 Media Query Mock
  // ===============================
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // ===============================
  // 🔍 Observer APIs Mock
  // ===============================
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  global.MutationObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => []),
  }));

  // ===============================
  // 📜 Scroll APIs Mock
  // ===============================
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: vi.fn(),
  });

  Object.defineProperty(window, 'scroll', {
    writable: true,
    value: vi.fn(),
  });

  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    writable: true,
    value: vi.fn(),
  });

  // ===============================
  // 📱 Navigator APIs Mock
  // ===============================
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
      write: vi.fn().mockResolvedValue(undefined),
      read: vi.fn().mockResolvedValue([]),
    },
  });

  Object.defineProperty(navigator, 'share', {
    writable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });

  Object.defineProperty(navigator, 'permissions', {
    writable: true,
    value: {
      query: vi.fn().mockResolvedValue({ state: 'granted' }),
    },
  });

  // ===============================
  // 🔊 Audio/Video APIs Mock
  // ===============================
  global.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  global.HTMLMediaElement.prototype.pause = vi.fn();
  global.HTMLMediaElement.prototype.load = vi.fn();

  // ===============================
  // 📐 Geometry APIs Mock
  // ===============================
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    top: 0,
    right: 100,
    bottom: 100,
    left: 0,
    toJSON: vi.fn(),
  }));

  Range.prototype.getBoundingClientRect = vi.fn(() => ({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    toJSON: vi.fn(),
  }));

  // ===============================
  // 💾 Storage APIs Mock
  // ===============================
  const mockStorage = () => {
    let store: Record<string, string> = {};

    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      key: vi.fn((index: number) => Object.keys(store)[index] || null),
      get length() {
        return Object.keys(store).length;
      },
    };
  };

  Object.defineProperty(window, 'localStorage', {
    writable: true,
    value: mockStorage(),
  });

  Object.defineProperty(window, 'sessionStorage', {
    writable: true,
    value: mockStorage(),
  });

  // ===============================
  // 🌍 Location Mock
  // ===============================
  const locationMock: Location = {
    href: 'http://localhost:3000/',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    toString: vi.fn(() => 'http://localhost:3000/'),
    ancestorOrigins: {
      length: 0,
      item: () => null,
      contains: () => false,
      [Symbol.iterator]: function* () {},
    } as DOMStringList,
  };

  Object.defineProperty(window, 'location', {
    value: locationMock,
    writable: true,
    enumerable: true,
    configurable: true,
  });

  // ===============================
  // 📡 Network APIs Mock
  // ===============================
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: vi.fn().mockResolvedValue({}),
    text: vi.fn().mockResolvedValue(''),
    blob: vi.fn().mockResolvedValue(new Blob()),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    headers: new Headers(),
    url: 'https://mock-api.test',
    redirected: false,
    type: 'basic' as const,
    clone: vi.fn(),
  });

  const EventSourceMock = vi.fn().mockImplementation(() => ({
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    readyState: 1,
    url: 'https://mock-sse.test',
    withCredentials: false,
    CONNECTING: 0,
    OPEN: 1,
    CLOSED: 2,
  }));

  // 정적 프로퍼티 추가
  interface EventSourceConstructor {
    new (url: string | URL, eventSourceInitDict?: EventSourceInit): EventSource;
    readonly CONNECTING: 0;
    readonly OPEN: 1;
    readonly CLOSED: 2;
  }

  Object.defineProperty(EventSourceMock, 'CONNECTING', {
    value: 0,
    writable: false,
    enumerable: true,
    configurable: false,
  });
  Object.defineProperty(EventSourceMock, 'OPEN', {
    value: 1,
    writable: false,
    enumerable: true,
    configurable: false,
  });
  Object.defineProperty(EventSourceMock, 'CLOSED', {
    value: 2,
    writable: false,
    enumerable: true,
    configurable: false,
  });

  global.EventSource = EventSourceMock as unknown as EventSourceConstructor;

  const WebSocketMock = vi.fn().mockImplementation(() => ({
    close: vi.fn(),
    send: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: 1,
    url: 'ws://mock-websocket.test',
    protocol: '',
    extensions: '',
    bufferedAmount: 0,
    binaryType: 'blob' as const,
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
  }));

  // 정적 프로퍼티 추가
  interface WebSocketConstructor {
    new (url: string | URL, protocols?: string | string[]): WebSocket;
    readonly CONNECTING: 0;
    readonly OPEN: 1;
    readonly CLOSING: 2;
    readonly CLOSED: 3;
  }

  Object.defineProperty(WebSocketMock, 'CONNECTING', {
    value: 0,
    writable: false,
    enumerable: true,
    configurable: false,
  });
  Object.defineProperty(WebSocketMock, 'OPEN', {
    value: 1,
    writable: false,
    enumerable: true,
    configurable: false,
  });
  Object.defineProperty(WebSocketMock, 'CLOSING', {
    value: 2,
    writable: false,
    enumerable: true,
    configurable: false,
  });
  Object.defineProperty(WebSocketMock, 'CLOSED', {
    value: 3,
    writable: false,
    enumerable: true,
    configurable: false,
  });

  global.WebSocket = WebSocketMock as unknown as WebSocketConstructor;
} // 브라우저 환경 체크 종료
