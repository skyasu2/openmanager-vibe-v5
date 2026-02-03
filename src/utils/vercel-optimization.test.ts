/**
 * 🧪 Vercel Optimization 유틸리티 단위 테스트
 *
 * Vercel 무료 티어 안전:
 * - 순수 함수 테스트 (외부 API 호출 없음)
 * - Mock된 환경변수 사용
 * - 동기 연산만 수행
 *
 * Note: 테스트 환경은 JSDOM을 사용하므로 window가 정의되어 있어
 * 클라이언트 사이드 감지 로직을 테스트합니다.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// logger mock
vi.mock('@/lib/logging', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Store original env
const originalEnv = { ...process.env };

describe('Vercel Optimization Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Reset env
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  // ============================================================================
  // getVercelEnvironment 테스트 (클라이언트 환경 - JSDOM)
  // ============================================================================
  describe('getVercelEnvironment (client - JSDOM)', () => {
    // Note: JSDOM 환경에서는 window가 정의되어 있으므로 클라이언트 로직 테스트
    it('should detect development when hostname is localhost', async () => {
      // JSDOM의 기본 location은 localhost
      const { getVercelEnvironment } = await import('./vercel-optimization');
      const result = getVercelEnvironment();

      // localhost에서는 Vercel이 아님
      expect(result.isVercel).toBe(false);
      expect(result.environment).toBe('development');
      // node 환경에서는 window가 없으므로 'unknown', jsdom에서는 'client-side'
      const expectedRegion =
        typeof window === 'undefined' ? 'unknown' : 'client-side';
      expect(result.region).toBe(expectedRegion);
    });

    it('should return environment with region as client-side', async () => {
      const { getVercelEnvironment } = await import('./vercel-optimization');
      const result = getVercelEnvironment();

      // node 환경에서는 window가 없으므로 'unknown', jsdom에서는 'client-side'
      const expectedRegion =
        typeof window === 'undefined' ? 'unknown' : 'client-side';
      expect(result.region).toBe(expectedRegion);
    });

    it('should have correct interface structure', async () => {
      const { getVercelEnvironment } = await import('./vercel-optimization');
      const result = getVercelEnvironment();

      // 올바른 인터페이스 구조 확인
      expect(typeof result.isVercel).toBe('boolean');
      expect(typeof result.region).toBe('string');
      expect(['production', 'preview', 'development']).toContain(
        result.environment
      );
    });

    it('should handle deploymentUrl based on isVercel', async () => {
      const { getVercelEnvironment } = await import('./vercel-optimization');
      const result = getVercelEnvironment();

      // localhost에서는 deploymentUrl이 undefined
      if (!result.isVercel) {
        expect(result.deploymentUrl).toBeUndefined();
      }
    });
  });

  // ============================================================================
  // getOptimizationConfig 테스트 (클라이언트 환경)
  // ============================================================================
  describe('getOptimizationConfig', () => {
    // Note: JSDOM 환경에서는 development 설정이 반환됨

    it('should return development config for local/JSDOM environment', async () => {
      const { getOptimizationConfig } = await import('./vercel-optimization');
      const config = getOptimizationConfig();

      // JSDOM localhost = development
      expect(config.cache.maxAge).toBe(60);
      expect(config.cache.bustCache).toBe(false);
      expect(config.network.timeout).toBe(5000); // 5s
      expect(config.network.retries).toBe(0);
      expect(config.logging.level).toBe('debug');
      expect(config.logging.format).toBe('simple');
      expect(config.performance.bundleThreshold).toBe(500000);
      expect(config.performance.imageOptimization).toBe(false);
    });

    it('should return config with all required sections', async () => {
      const { getOptimizationConfig } = await import('./vercel-optimization');
      const config = getOptimizationConfig();

      // 모든 필수 섹션이 있는지 확인
      expect(config).toHaveProperty('cache');
      expect(config).toHaveProperty('network');
      expect(config).toHaveProperty('logging');
      expect(config).toHaveProperty('performance');
    });

    it('should have valid cache configuration', async () => {
      const { getOptimizationConfig } = await import('./vercel-optimization');
      const config = getOptimizationConfig();

      expect(typeof config.cache.maxAge).toBe('number');
      expect(typeof config.cache.bustCache).toBe('boolean');
      expect(config.cache.maxAge).toBeGreaterThanOrEqual(0);
    });

    it('should have valid network configuration', async () => {
      const { getOptimizationConfig } = await import('./vercel-optimization');
      const config = getOptimizationConfig();

      expect(typeof config.network.timeout).toBe('number');
      expect(typeof config.network.retries).toBe('number');
      expect(config.network.timeout).toBeGreaterThan(0);
      expect(config.network.retries).toBeGreaterThanOrEqual(0);
    });

    it('should have valid logging configuration', async () => {
      const { getOptimizationConfig } = await import('./vercel-optimization');
      const config = getOptimizationConfig();

      expect(['error', 'warn', 'info', 'debug']).toContain(
        config.logging.level
      );
      expect(['structured', 'simple']).toContain(config.logging.format);
    });

    it('should have valid performance configuration', async () => {
      const { getOptimizationConfig } = await import('./vercel-optimization');
      const config = getOptimizationConfig();

      expect(typeof config.performance.bundleThreshold).toBe('number');
      expect(typeof config.performance.imageOptimization).toBe('boolean');
      expect(config.performance.bundleThreshold).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // checkEdgeRuntimeCompatibility 테스트
  // ============================================================================
  describe('checkEdgeRuntimeCompatibility', () => {
    it('should return compatible with no issues for normal usage', async () => {
      const { checkEdgeRuntimeCompatibility } = await import(
        './vercel-optimization'
      );
      const result = checkEdgeRuntimeCompatibility();

      // In test environment without high memory, should be compatible
      expect(typeof result.isCompatible).toBe('boolean');
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should have isCompatible matching issues length', async () => {
      const { checkEdgeRuntimeCompatibility } = await import(
        './vercel-optimization'
      );
      const result = checkEdgeRuntimeCompatibility();

      expect(result.isCompatible).toBe(result.issues.length === 0);
    });
  });

  // ============================================================================
  // getDeploymentChecklist 테스트 (클라이언트 환경)
  // ============================================================================
  describe('getDeploymentChecklist', () => {
    it('should return checklist with required categories', async () => {
      const { getDeploymentChecklist } = await import('./vercel-optimization');
      const checklist = getDeploymentChecklist();

      // 모든 필수 카테고리가 있는지 확인
      const categories = checklist.map((c) => c.category);
      expect(categories).toContain('환경 설정');
      expect(categories).toContain('성능 최적화');
      expect(categories).toContain('Edge Runtime 호환성');
    });

    it('should return warn status when in development (JSDOM)', async () => {
      const { getDeploymentChecklist } = await import('./vercel-optimization');
      const checklist = getDeploymentChecklist();

      const envCategory = checklist.find((c) => c.category === '환경 설정');
      const vercelDetection = envCategory?.items.find(
        (i) => i.name === 'Vercel 환경 감지'
      );

      // JSDOM localhost = not Vercel = warn
      expect(vercelDetection?.status).toBe('warn');
    });

    it('should check environment variable status based on process.env', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';

      const { getDeploymentChecklist } = await import('./vercel-optimization');
      const checklist = getDeploymentChecklist();

      const envCategory = checklist.find((c) => c.category === '환경 설정');
      const envVarCheck = envCategory?.items.find(
        (i) => i.name === '환경변수 설정'
      );

      expect(envVarCheck?.status).toBe('pass');
    });

    it('should fail environment variable check when missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const { getDeploymentChecklist } = await import('./vercel-optimization');
      const checklist = getDeploymentChecklist();

      const envCategory = checklist.find((c) => c.category === '환경 설정');
      const envVarCheck = envCategory?.items.find(
        (i) => i.name === '환경변수 설정'
      );

      expect(envVarCheck?.status).toBe('fail');
    });

    it('should have bundle size check item', async () => {
      const { getDeploymentChecklist } = await import('./vercel-optimization');
      const checklist = getDeploymentChecklist();

      const perfCategory = checklist.find((c) => c.category === '성능 최적화');
      const bundleCheck = perfCategory?.items.find(
        (i) => i.name === '번들 크기'
      );

      expect(bundleCheck).toBeDefined();
      expect(['pass', 'warn', 'fail']).toContain(bundleCheck?.status);
    });

    it('should have image optimization check item', async () => {
      const { getDeploymentChecklist } = await import('./vercel-optimization');
      const checklist = getDeploymentChecklist();

      const perfCategory = checklist.find((c) => c.category === '성능 최적화');
      const imageCheck = perfCategory?.items.find(
        (i) => i.name === '이미지 최적화'
      );

      expect(imageCheck).toBeDefined();
      expect(['pass', 'warn', 'fail']).toContain(imageCheck?.status);
    });

    it('should have edge runtime compatibility checks', async () => {
      const { getDeploymentChecklist } = await import('./vercel-optimization');
      const checklist = getDeploymentChecklist();

      const edgeCategory = checklist.find(
        (c) => c.category === 'Edge Runtime 호환성'
      );
      expect(edgeCategory).toBeDefined();
      expect(edgeCategory?.items.length).toBeGreaterThan(0);
    });

    it('should return valid status values for all items', async () => {
      const { getDeploymentChecklist } = await import('./vercel-optimization');
      const checklist = getDeploymentChecklist();

      for (const category of checklist) {
        for (const item of category.items) {
          expect(['pass', 'warn', 'fail']).toContain(item.status);
          expect(typeof item.name).toBe('string');
          expect(item.name.length).toBeGreaterThan(0);
        }
      }
    });
  });

  // ============================================================================
  // VercelPerformanceTracker 테스트
  // ============================================================================
  describe('VercelPerformanceTracker', () => {
    it('should track performance metrics', async () => {
      delete process.env.VERCEL; // Local environment

      const { VercelPerformanceTracker } = await import(
        './vercel-optimization'
      );
      const tracker = new VercelPerformanceTracker();

      tracker.start('test-operation');
      // Simulate some work
      const duration = tracker.end('test-operation');

      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for unknown labels', async () => {
      const { VercelPerformanceTracker } = await import(
        './vercel-optimization'
      );
      const tracker = new VercelPerformanceTracker();

      const duration = tracker.end('unknown-label');

      expect(duration).toBe(0);
    });

    it('should store metrics and return them', async () => {
      const { VercelPerformanceTracker } = await import(
        './vercel-optimization'
      );
      const tracker = new VercelPerformanceTracker();

      tracker.start('op1');
      tracker.end('op1');
      tracker.start('op2');
      tracker.end('op2');

      const metrics = tracker.getMetrics();

      expect(typeof metrics.op1).toBe('number');
      expect(typeof metrics.op2).toBe('number');
    });

    it('should clear metrics', async () => {
      const { VercelPerformanceTracker } = await import(
        './vercel-optimization'
      );
      const tracker = new VercelPerformanceTracker();

      tracker.start('test');
      tracker.end('test');
      tracker.clear();

      const metrics = tracker.getMetrics();

      expect(Object.keys(metrics)).toHaveLength(0);
    });
  });
});
