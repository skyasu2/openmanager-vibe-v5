/**
 * 격리된 테스트 환경 관리자 v2.0
 * OpenManager Vibe v5 - 테스트 환경 완전 격리 구현
 */

import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';

export interface IsolationConfig {
  resetModules?: boolean;
  resetGlobals?: boolean;
  resetEnvironment?: boolean;
  resetTimers?: boolean;
  resetConsole?: boolean;
  preserveEnv?: string[];
  mockModules?: string[];
}

export interface TestEnvironmentSnapshot {
  env: NodeJS.ProcessEnv;
  globals: Record<string, any>;
  timestamp: number;
}

export class IsolatedTestEnvironment {
  private static instance: IsolatedTestEnvironment;
  private snapshots = new Map<string, TestEnvironmentSnapshot>();
  private originalEnv: NodeJS.ProcessEnv;
  private isolationConfig: IsolationConfig;
  private testCounter = 0;

  private constructor(config: IsolationConfig = {}) {
    this.isolationConfig = {
      resetModules: true,
      resetGlobals: true,
      resetEnvironment: true,
      resetTimers: true,
      resetConsole: true,
      preserveEnv: ['NODE_ENV', 'VITEST', 'CI'],
      mockModules: [],
      ...config,
    };

    this.originalEnv = { ...process.env };
    this.setupIsolation();
  }

  public static getInstance(config?: IsolationConfig): IsolatedTestEnvironment {
    if (!IsolatedTestEnvironment.instance) {
      IsolatedTestEnvironment.instance = new IsolatedTestEnvironment(config);
    }
    return IsolatedTestEnvironment.instance;
  }

  private setupIsolation(): void {
    beforeEach(() => {
      this.testCounter++;
      this.createSnapshot(`test-${this.testCounter}`);
      this.resetTestEnvironment();
    });

    afterEach(() => {
      this.restoreSnapshot(`test-${this.testCounter}`);
      this.cleanupTestEnvironment();
    });

    beforeAll(() => {
      this.createSnapshot('global-start');
      this.setupTestGlobals();
    });

    afterAll(() => {
      this.restoreSnapshot('global-start');
      this.finalCleanup();
    });
  }

  createSnapshot(id: string): void {
    const snapshot: TestEnvironmentSnapshot = {
      env: { ...process.env },
      globals: this.captureCurrentGlobals(),
      timestamp: Date.now(),
    };

    this.snapshots.set(id, snapshot);
  }

  restoreSnapshot(id: string): void {
    const snapshot = this.snapshots.get(id);
    if (!snapshot) {
      console.warn(`⚠️ 스냅샷 '${id}'를 찾을 수 없습니다.`);
      return;
    }

    if (this.isolationConfig.resetEnvironment) {
      this.restoreEnvironment(snapshot.env);
    }

    if (this.isolationConfig.resetGlobals) {
      this.restoreGlobals(snapshot.globals);
    }
  }

  private captureCurrentGlobals(): Record<string, any> {
    const globalObject =
      typeof globalThis !== 'undefined' ? globalThis : global;
    return {
      fetch: globalObject.fetch,
      localStorage: globalObject.localStorage,
      sessionStorage: globalObject.sessionStorage,
    };
  }

  public resetTestEnvironment(): void {
    if (this.isolationConfig.resetEnvironment) {
      this.resetEnvironmentVariables();
    }

    if (this.isolationConfig.resetGlobals) {
      this.resetGlobalObjects();
    }

    if (this.isolationConfig.resetModules) {
      vi.resetModules();
    }

    if (this.isolationConfig.resetTimers) {
      vi.clearAllTimers();
      vi.resetAllMocks();
    }

    if (this.isolationConfig.resetConsole) {
      this.resetConsole();
    }
  }

  private resetEnvironmentVariables(): void {
    for (const key of Object.keys(process.env)) {
      if (!this.isolationConfig.preserveEnv?.includes(key)) {
        delete process.env[key];
      }
    }

    const testEnvVars = {
      NODE_ENV: 'test',
      VITEST: 'true',
      FORCE_MOCK_REDIS: 'true',
      FORCE_MOCK_GOOGLE_AI: 'true',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
      SUPABASE_URL: 'https://test-project.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      TEST_ISOLATION: 'true',
      DISABLE_HEALTH_CHECK: 'true',
    };

    Object.assign(process.env, testEnvVars);
  }

  private resetGlobalObjects(): void {
    const globalObject =
      typeof globalThis !== 'undefined' ? globalThis : global;

    globalObject.fetch = vi.fn();

    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };

    // localStorage와 sessionStorage를 안전하게 설정
    try {
      Object.defineProperty(globalObject, 'localStorage', {
        value: localStorageMock,
        writable: true,
        configurable: true,
      });
    } catch (error) {
      // 이미 정의된 경우 무시
    }

    try {
      Object.defineProperty(globalObject, 'sessionStorage', {
        value: { ...localStorageMock },
        writable: true,
        configurable: true,
      });
    } catch (error) {
      // 이미 정의된 경우 무시
    }
  }

  private resetConsole(): void {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  }

  private restoreEnvironment(env: NodeJS.ProcessEnv): void {
    for (const key of Object.keys(process.env)) {
      if (!this.isolationConfig.preserveEnv?.includes(key)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, env);
  }

  private restoreGlobals(globals: Record<string, any>): void {
    const globalObject =
      typeof globalThis !== 'undefined' ? globalThis : global;

    for (const [key, value] of Object.entries(globals)) {
      try {
        if (key === 'localStorage' || key === 'sessionStorage') {
          Object.defineProperty(globalObject, key, {
            value: value,
            writable: true,
            configurable: true,
          });
        } else {
          globalObject[key] = value;
        }
      } catch (error) {
        // 읽기 전용 속성인 경우 무시
        console.warn(
          `⚠️ Cannot restore global property '${key}':`,
          error.message
        );
      }
    }
  }

  private setupTestGlobals(): void {
    if (typeof window !== 'undefined') {
      window.ResizeObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      }));

      window.IntersectionObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      }));

      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    }
  }

  private cleanupTestEnvironment(): void {
    vi.clearAllMocks();
    vi.clearAllTimers();

    if (typeof window !== 'undefined') {
      const events = ['resize', 'scroll', 'click', 'keydown', 'keyup'];
      events.forEach(event => {
        window.removeEventListener(event, () => {});
      });
    }

    if (global.gc) {
      global.gc();
    }
  }

  private finalCleanup(): void {
    this.snapshots.clear();
    process.env = this.originalEnv;
    vi.restoreAllMocks();
    vi.resetModules();
    this.testCounter = 0;
  }

  getIsolationStatus(): {
    snapshots: number;
    testCounter: number;
    memoryUsage: NodeJS.MemoryUsage;
  } {
    return {
      snapshots: this.snapshots.size,
      testCounter: this.testCounter,
      memoryUsage: process.memoryUsage(),
    };
  }
}

export const isolatedTestEnvironment = IsolatedTestEnvironment.getInstance({
  resetModules: true,
  resetGlobals: true,
  resetEnvironment: true,
  resetTimers: true,
  resetConsole: true,
  preserveEnv: ['NODE_ENV', 'VITEST', 'CI', 'GITHUB_ACTIONS'],
  mockModules: ['sharp', 'onnxruntime-node', 'puppeteer'],
});

export function withIsolation<T>(
  fn: () => T | Promise<T>,
  config?: Partial<IsolationConfig>
): Promise<T> {
  const env = IsolatedTestEnvironment.getInstance(config);
  const isolationId = `isolation-${Date.now()}`;

  env.createSnapshot(isolationId);

  return Promise.resolve(fn()).finally(() => {
    env.restoreSnapshot(isolationId);
  });
}

export function resetTestEnvironment(): void {
  const env = IsolatedTestEnvironment.getInstance();
  env.resetTestEnvironment();
}
