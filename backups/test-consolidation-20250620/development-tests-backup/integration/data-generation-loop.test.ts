import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';

/**
 * 🔄 RealServerDataGenerator 통합 테스트
 * 실제 구현에 맞춘 안정적인 테스트로 개선
 */
describe('RealServerDataGenerator 통합 동작', () => {
  let generator: RealServerDataGenerator;

  beforeEach(async () => {
    // 싱글톤 인스턴스 초기화 - 타입 안전한 방법 사용
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (RealServerDataGenerator as any).instance = null;
    generator = RealServerDataGenerator.getInstance();
    // 자동 생성이 시작되었다면 중지
    generator.stopAutoGeneration();
    await generator.initialize();
  });

  afterEach(async () => {
    // 테스트 후 정리
    if (generator) {
      generator.stopAutoGeneration();
    }
    // 짧은 대기로 정리 완료 보장
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  it('RealServerDataGenerator 인스턴스가 정상적으로 생성된다', () => {
    expect(generator).toBeDefined();
    expect(typeof generator.getAllServers).toBe('function');
    expect(typeof generator.startAutoGeneration).toBe('function');
    expect(typeof generator.stopAutoGeneration).toBe('function');
  });

  it('서버 데이터가 정상적으로 생성된다', async () => {
    const servers = generator.getAllServers();

    expect(servers).toBeDefined();
    expect(Array.isArray(servers)).toBe(true);
    expect(servers.length).toBeGreaterThan(0);

    // 최소한의 데이터 구조 검증
    if (servers.length > 0) {
      const firstServer = servers[0];
      expect(firstServer).toHaveProperty('id');
      expect(firstServer).toHaveProperty('status');
      expect(firstServer).toHaveProperty('metrics');
    }
  });

  it('클러스터 데이터가 정상적으로 생성된다', () => {
    const clusters = generator.getAllClusters();

    expect(clusters).toBeDefined();
    expect(Array.isArray(clusters)).toBe(true);

    // 클러스터가 있는 경우 구조 검증
    if (clusters.length > 0) {
      const firstCluster = clusters[0];
      expect(firstCluster).toHaveProperty('id');
      expect(firstCluster).toHaveProperty('name');
      expect(firstCluster).toHaveProperty('servers');
    }
  });

  it('자동 생성 시작/중지가 정상 동작한다', () => {
    // 먼저 중지하여 초기 상태 확보
    generator.stopAutoGeneration();

    const initialStatus = generator.getStatus();
    expect(initialStatus).toHaveProperty('isRunning');
    expect(initialStatus.isRunning).toBe(false); // 중지 후 상태

    // 자동 생성 시작
    generator.startAutoGeneration();
    const runningStatus = generator.getStatus();
    expect(runningStatus.isRunning).toBe(true);

    // 자동 생성 중지
    generator.stopAutoGeneration();
    const stoppedStatus = generator.getStatus();
    expect(stoppedStatus.isRunning).toBe(false);
  });

  it('싱글톤 패턴이 올바르게 구현되어 있다', () => {
    const instance1 = RealServerDataGenerator.getInstance();
    const instance2 = RealServerDataGenerator.getInstance();

    expect(instance1).toBe(instance2);
    expect(instance1).toBe(generator);
  });

  it('대시보드 요약 정보를 제공한다', () => {
    const summary = generator.getDashboardSummary();

    expect(summary).toBeDefined();
    expect(typeof summary).toBe('object');
    expect(summary).toHaveProperty('servers');
    expect(summary.servers).toHaveProperty('total');
    expect(summary.servers).toHaveProperty('online');
    expect(summary.servers).toHaveProperty('warning');
    expect(summary.servers).toHaveProperty('offline');
    expect(summary).toHaveProperty('clusters');
    expect(summary).toHaveProperty('applications');
    expect(summary).toHaveProperty('timestamp');
  });
});
