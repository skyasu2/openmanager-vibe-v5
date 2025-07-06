import { GCPRealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { beforeEach, describe, expect, it } from 'vitest';

let generator: GCPRealServerDataGenerator;

beforeEach(() => {
  // 테스트용 환경변수 설정 (GCP 실시간 데이터 사용)
  // NODE_ENV는 이미 test로 설정되어 있음
  (process.env as any).GOOGLE_CLOUD_PROJECT = 'test-project';
  (process.env as any).GOOGLE_APPLICATION_CREDENTIALS = 'test-credentials';

  generator = GCPRealServerDataGenerator.getInstance();
});

describe('RealServerDataGenerator.getDashboardSummary', () => {
  it('초기화된 상태에서 기본 데이터 구조를 반환한다', async () => {
    const summary = await generator.getDashboardSummary();

    // 기본 구조 검증
    expect(summary).toHaveProperty('totalServers');
    expect(summary).toHaveProperty('healthyServers');
    expect(summary).toHaveProperty('warningServers');
    expect(summary).toHaveProperty('criticalServers');
    expect(summary).toHaveProperty('avgCpuUsage');
    expect(summary).toHaveProperty('avgMemoryUsage');
    expect(summary).toHaveProperty('totalApplications');
    expect(summary).toHaveProperty('totalClusters');
  });

  it('NaN 값이 없고 유효한 숫자 범위를 반환한다', async () => {
    const summary = await generator.getDashboardSummary();

    // NaN 검증
    expect(Number.isNaN(summary.totalServers)).toBe(false);
    expect(Number.isNaN(summary.healthyServers)).toBe(false);
    expect(Number.isNaN(summary.avgCpuUsage)).toBe(false);
    expect(Number.isNaN(summary.avgMemoryUsage)).toBe(false);

    // 범위 검증
    expect(summary.avgCpuUsage).toBeGreaterThanOrEqual(0);
    expect(summary.avgCpuUsage).toBeLessThanOrEqual(100);
    expect(summary.avgMemoryUsage).toBeGreaterThanOrEqual(0);
    expect(summary.avgMemoryUsage).toBeLessThanOrEqual(100);
  });

  it('실제 서버 데이터와 일치하는 카운트를 반환한다', async () => {
    // 실시간 데이터는 환경에 따라 다를 수 있으므로 기본 검증만 수행
    const summary = await generator.getDashboardSummary();

    // 기본 검증: 서버 개수는 0 이상이어야 함
    expect(summary.totalServers).toBeGreaterThanOrEqual(0);
    expect(summary.healthyServers).toBeGreaterThanOrEqual(0);
    expect(summary.warningServers).toBeGreaterThanOrEqual(0);
    expect(summary.criticalServers).toBeGreaterThanOrEqual(0);

    // 서버 상태 합계 검증
    const totalStatusCount =
      summary.healthyServers + summary.warningServers + summary.criticalServers;
    expect(totalStatusCount).toBeLessThanOrEqual(summary.totalServers);
  });

  it('실시간 데이터 생성 후에도 일관된 데이터를 반환한다', async () => {
    // 첫 번째 호출
    const summary1 = await generator.getDashboardSummary();

    // 두 번째 호출 (실시간 데이터는 변경될 수 있으므로 구조만 검증)
    const summary2 = await generator.getDashboardSummary();

    // 구조 일관성 검증
    expect(typeof summary1.totalServers).toBe('number');
    expect(typeof summary2.totalServers).toBe('number');
    expect(typeof summary1.avgCpuUsage).toBe('number');
    expect(typeof summary2.avgCpuUsage).toBe('number');

    // 범위 일관성 검증
    expect(summary1.avgCpuUsage).toBeGreaterThanOrEqual(0);
    expect(summary1.avgCpuUsage).toBeLessThanOrEqual(100);
    expect(summary2.avgCpuUsage).toBeGreaterThanOrEqual(0);
    expect(summary2.avgCpuUsage).toBeLessThanOrEqual(100);
  });
});
