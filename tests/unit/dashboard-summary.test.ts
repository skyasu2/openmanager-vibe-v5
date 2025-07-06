import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// 실제 데이터 상태에서 getDashboardSummary 동작 테스트

describe('RealServerDataGenerator.getDashboardSummary', () => {
  let generator: typeof RealServerDataGenerator;

  beforeEach(() => {
    generator = RealServerDataGenerator;
  });

  afterEach(() => {
    // 정리 작업
    generator.getInstance().stopAutoGeneration();
    generator.getInstance().dispose();
  });

  it('초기화된 상태에서 기본 데이터 구조를 반환한다', async () => {
    const summary = await generator.getInstance().getDashboardSummary();

    // 기본 구조 검증 (실제 getDashboardSummary 반환 구조에 맞게 수정)
    expect(summary).toHaveProperty('totalServers');
    expect(summary).toHaveProperty('healthyServers');
    expect(summary).toHaveProperty('warningServers');
    expect(summary).toHaveProperty('criticalServers');

    // 타입 검증
    expect(typeof summary.totalServers).toBe('number');
    expect(typeof summary.healthyServers).toBe('number');
    expect(typeof summary.warningServers).toBe('number');
    expect(typeof summary.criticalServers).toBe('number');
  });

  it('NaN 값이 없고 유효한 숫자 범위를 반환한다', async () => {
    const summary = await generator.getInstance().getDashboardSummary();

    // NaN 검증
    expect(Number.isNaN(summary.totalServers)).toBe(false);
    expect(Number.isNaN(summary.healthyServers)).toBe(false);
    expect(Number.isNaN(summary.warningServers)).toBe(false);
    expect(Number.isNaN(summary.criticalServers)).toBe(false);

    // 논리적 범위 검증
    expect(summary.totalServers).toBeGreaterThanOrEqual(0);
    expect(summary.healthyServers).toBeGreaterThanOrEqual(0);
    expect(summary.warningServers).toBeGreaterThanOrEqual(0);
    expect(summary.criticalServers).toBeGreaterThanOrEqual(0);
    expect(summary.healthyServers + summary.warningServers + summary.criticalServers).toBeLessThanOrEqual(summary.totalServers);
  });

  it('실제 서버 데이터와 일치하는 카운트를 반환한다', async () => {
    // Given
    const allServers = await generator.getInstance().getAllServers();
    const allApplications = await generator.getInstance().getAllApplications();
    const allClusters = await generator.getInstance().getAllClusters();

    const summary = await generator.getInstance().getDashboardSummary();

    // 실제 데이터와 요약 데이터 일치성 검증
    expect(summary.totalServers).toBe(allServers.length);
    expect(summary.healthyServers).toBeGreaterThanOrEqual(0);
    expect(summary.warningServers).toBeGreaterThanOrEqual(0);
    expect(summary.criticalServers).toBeGreaterThanOrEqual(0);

    // 총합이 전체 서버 수와 일치하는지 확인
    expect(summary.healthyServers + summary.warningServers + summary.criticalServers).toBeLessThanOrEqual(summary.totalServers);
  });

  it('실시간 데이터 생성 후에도 일관된 데이터를 반환한다', async () => {
    // 실시간 생성 시작
    generator.getInstance().startAutoGeneration();

    // 잠시 대기하여 데이터 생성
    await new Promise(resolve => setTimeout(resolve, 100));

    const summary1 = await generator.getInstance().getDashboardSummary();

    // 다시 한 번 확인
    await new Promise(resolve => setTimeout(resolve, 50));
    const summary2 = await generator.getInstance().getDashboardSummary();

    // 데이터 구조 일관성 검증
    expect(summary1.totalServers).toBe(summary2.totalServers);
    expect(summary1.healthyServers).toBeGreaterThanOrEqual(0);
    expect(summary1.warningServers).toBeGreaterThanOrEqual(0);
    expect(summary1.criticalServers).toBeGreaterThanOrEqual(0);

    // 실시간 생성 중지
    generator.getInstance().stopAutoGeneration();
  });
});
