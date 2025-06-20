import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';

// 실제 데이터 상태에서 getDashboardSummary 동작 테스트

describe('RealServerDataGenerator.getDashboardSummary', () => {
  let generator: RealServerDataGenerator;

  beforeEach(async () => {
    generator = RealServerDataGenerator.getInstance();
    // 실제 초기화 수행
    await generator.initialize();
  });

  afterEach(() => {
    // 정리 작업
    generator.stopAutoGeneration();
    generator.dispose();
  });

  it('초기화된 상태에서 기본 데이터 구조를 반환한다', () => {
    const summary = generator.getDashboardSummary();

    // 기본 구조 검증
    expect(summary).toHaveProperty('servers');
    expect(summary).toHaveProperty('applications');
    expect(summary).toHaveProperty('clusters');

    // servers 객체 구조 검증
    expect(summary.servers).toHaveProperty('avgCpu');
    expect(summary.servers).toHaveProperty('avgMemory');
    expect(summary.servers).toHaveProperty('total');
    expect(summary.servers).toHaveProperty('online');

    // applications 객체 구조 검증
    expect(summary.applications).toHaveProperty('avgResponseTime');
    expect(summary.applications).toHaveProperty('total');

    // clusters 객체 구조 검증
    expect(summary.clusters).toHaveProperty('total');

    // 타입 검증
    expect(typeof summary.servers.avgCpu).toBe('number');
    expect(typeof summary.servers.avgMemory).toBe('number');
    expect(typeof summary.servers.total).toBe('number');
    expect(typeof summary.servers.online).toBe('number');
    expect(typeof summary.applications.avgResponseTime).toBe('number');
    expect(typeof summary.applications.total).toBe('number');
    expect(typeof summary.clusters.total).toBe('number');
  });

  it('NaN 값이 없고 유효한 숫자 범위를 반환한다', () => {
    const summary = generator.getDashboardSummary();

    // NaN 검증
    expect(Number.isNaN(summary.servers.avgCpu)).toBe(false);
    expect(Number.isNaN(summary.servers.avgMemory)).toBe(false);
    expect(Number.isNaN(summary.applications.avgResponseTime)).toBe(false);

    // 논리적 범위 검증
    expect(summary.servers.avgCpu).toBeGreaterThanOrEqual(0);
    expect(summary.servers.avgCpu).toBeLessThanOrEqual(100);
    expect(summary.servers.avgMemory).toBeGreaterThanOrEqual(0);
    expect(summary.servers.avgMemory).toBeLessThanOrEqual(100);
    expect(summary.servers.total).toBeGreaterThanOrEqual(0);
    expect(summary.servers.online).toBeGreaterThanOrEqual(0);
    expect(summary.servers.online).toBeLessThanOrEqual(summary.servers.total);
    expect(summary.applications.avgResponseTime).toBeGreaterThanOrEqual(0);
    expect(summary.applications.total).toBeGreaterThanOrEqual(0);
    expect(summary.clusters.total).toBeGreaterThanOrEqual(0);
  });

  it('실제 서버 데이터와 일치하는 카운트를 반환한다', () => {
    const summary = generator.getDashboardSummary();
    const allServers = generator.getAllServers();
    const allApplications = generator.getAllApplications();
    const allClusters = generator.getAllClusters();

    // 실제 데이터와 요약 데이터 일치성 검증
    expect(summary.servers.total).toBe(allServers.length);
    expect(summary.applications.total).toBe(allApplications.length);
    expect(summary.clusters.total).toBe(allClusters.length);

    // 온라인 서버 수가 전체 서버 수를 초과하지 않음
    expect(summary.servers.online).toBeLessThanOrEqual(summary.servers.total);
  });

  it('실시간 데이터 생성 후에도 일관된 데이터를 반환한다', async () => {
    // 실시간 생성 시작
    generator.startAutoGeneration();

    // 잠시 대기하여 데이터 생성
    await new Promise(resolve => setTimeout(resolve, 100));

    const summary1 = generator.getDashboardSummary();

    // 다시 한 번 확인
    await new Promise(resolve => setTimeout(resolve, 50));
    const summary2 = generator.getDashboardSummary();

    // 데이터 구조 일관성 검증
    expect(summary1.servers.total).toBe(summary2.servers.total);
    expect(summary1.applications.total).toBe(summary2.applications.total);
    expect(summary1.clusters.total).toBe(summary2.clusters.total);

    // 실시간 생성 중지
    generator.stopAutoGeneration();
  });
});
