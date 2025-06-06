/**
 * 🧪 Vitest 설정 파일
 */

import { vi } from 'vitest';

// 브라우저 전역 객체 모의
Object.defineProperty(global, 'window', {
  value: {},
  writable: true,
});

Object.defineProperty(global, 'document', {
  value: {},
  writable: true,
});

// matchMedia 모의
Object.defineProperty(global.window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
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

// localStorage 모의
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(global.window, 'localStorage', {
  value: localStorageMock,
});

// fetch 모의
global.fetch = vi.fn();

// 환경 변수 설정
if (!process.env.NODE_ENV) {
  (process.env as any).NODE_ENV = 'test';
}
