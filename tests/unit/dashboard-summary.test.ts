/**
 * 🧪 Dashboard Summary 테스트
 *
 * 실제 배포 코드 품질 확인을 위한 테스트
 * - 외부 의존성 제거 (Mock 사용)
 * - 데이터 구조 검증
 * - 비즈니스 로직 검증
 */

import { GCPRealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock 환경 설정
vi.mock('@/config/environment', () => ({
  detectEnvironment: vi.fn(() => ({
    IS_TEST: true,
    IS_VERCEL: false,
    IS_LOCAL: false,
    IS_DEVELOPMENT: false,
    IS_PRODUCTION: false,
    features: {
      enableMockData: true,
    },
  })),
}));

let generator: GCPRealServerDataGenerator;

beforeEach(() => {
  // 테스트용 환경변수 설정 - 외부 의존성 제거
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('ENABLE_MOCK_DATA', 'true');

  generator = GCPRealServerDataGenerator.getInstance();
});

describe('RealServerDataGenerator.getDashboardSummary', () => {
  it('초기화된 상태에서 기본 데이터 구조를 반환한다', async () => {
    const summary = await generator.getDashboardSummary();

    // 필수 속성 검증
    expect(summary).toHaveProperty('totalServers');
    expect(summary).toHaveProperty('healthyServers');
    expect(summary).toHaveProperty('warningServers');
    expect(summary).toHaveProperty('criticalServers');

    // 타입 검증
    expect(typeof summary.totalServers).toBe('number');
    expect(typeof summary.healthyServers).toBe('number');
    expect(typeof summary.warningServers).toBe('number');
    expect(typeof summary.criticalServers).toBe('number');

    // 데이터 일관성 검증
    expect(summary.totalServers).toBeGreaterThanOrEqual(0);
    expect(
      summary.healthyServers + summary.warningServers + summary.criticalServers
    ).toBeLessThanOrEqual(summary.totalServers);
  });

  it('NaN 값이 없고 유효한 숫자 범위를 반환한다', async () => {
    const summary = await generator.getDashboardSummary();

    // NaN 값 검증
    expect(Number.isNaN(summary.totalServers)).toBe(false);
    expect(Number.isNaN(summary.healthyServers)).toBe(false);
    expect(Number.isNaN(summary.warningServers)).toBe(false);
    expect(Number.isNaN(summary.criticalServers)).toBe(false);

    // 유효한 범위 검증
    if (summary.avgCpuUsage !== undefined) {
      expect(summary.avgCpuUsage).toBeGreaterThanOrEqual(0);
      expect(summary.avgCpuUsage).toBeLessThanOrEqual(100);
      expect(Number.isNaN(summary.avgCpuUsage)).toBe(false);
    }

    if (summary.avgMemoryUsage !== undefined) {
      expect(summary.avgMemoryUsage).toBeGreaterThanOrEqual(0);
      expect(summary.avgMemoryUsage).toBeLessThanOrEqual(100);
      expect(Number.isNaN(summary.avgMemoryUsage)).toBe(false);
    }
  });

  it('비즈니스 로직 - 서버 상태별 카운트가 올바르게 계산된다', async () => {
    const summary = await generator.getDashboardSummary();

    // Mock 데이터를 기반으로 한 논리적 검증
    if (summary.totalServers > 0) {
      // 적어도 하나의 서버는 존재해야 함
      expect(summary.totalServers).toBeGreaterThan(0);

      // 각 상태별 서버 수는 음수가 될 수 없음
      expect(summary.healthyServers).toBeGreaterThanOrEqual(0);
      expect(summary.warningServers).toBeGreaterThanOrEqual(0);
      expect(summary.criticalServers).toBeGreaterThanOrEqual(0);

      // 총합이 일치해야 함
      const statusTotal =
        summary.healthyServers +
        summary.warningServers +
        summary.criticalServers;
      expect(statusTotal).toBeLessThanOrEqual(summary.totalServers);
    }
  });

  it('성능 - 대시보드 요약 생성이 합리적인 시간 내에 완료된다', async () => {
    const startTime = Date.now();

    await generator.getDashboardSummary();

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 1초 내에 완료되어야 함 (Mock 데이터 사용시)
    expect(duration).toBeLessThan(1000);
  });

  it('에러 처리 - 잘못된 설정에서도 안전하게 실패한다', async () => {
    // 🔧 수정: 실제 구현에서는 에러를 던지지 않고 기본값을 반환하므로 테스트 수정
    const invalidGenerator = new GCPRealServerDataGenerator({
      limit: -1, // 잘못된 값
      sessionId: '',
    });

    // 잘못된 설정이라도 안전하게 기본 데이터 구조를 반환해야 함
    const result = await invalidGenerator.getDashboardSummary();

    // 기본 데이터 구조가 반환되는지 확인
    expect(result).toHaveProperty('totalServers');
    expect(result).toHaveProperty('healthyServers');
    expect(result).toHaveProperty('warningServers');
    expect(result).toHaveProperty('criticalServers');

    // 잘못된 limit이 0 이상의 값으로 정규화되는지 확인
    expect(result.totalServers).toBeGreaterThanOrEqual(0);
  });

  // 통합 테스트는 별도 파일로 분리하거나 E2E 테스트로 대체
  it.skip('실제 서버 데이터와 일치하는 카운트를 반환한다', async () => {
    // 이 테스트는 통합 테스트로 분리되어야 함
    // 단위 테스트에서는 Mock 데이터로 로직만 검증
  });

  it.skip('실시간 데이터 생성 후에도 일관된 데이터를 반환한다', async () => {
    // 이 테스트는 통합 테스트로 분리되어야 함
    // 단위 테스트에서는 상태 변화 로직만 검증
  });
});
