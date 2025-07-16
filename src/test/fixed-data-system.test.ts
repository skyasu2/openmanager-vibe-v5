/**
 * 🧪 고정 데이터 시스템 TDD 테스트 스위트
 * 
 * Red → Green → Refactor 사이클로 구현
 * 5개 장애 시나리오 시스템 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  FailureScenario, 
  FixedServerTemplate, 
  ServerMetrics, 
  ScenarioConfig,
  ActiveScenario,
  DashboardApiResponse 
} from '../types/fixed-data-system';

// 테스트 대상 클래스들 (아직 구현되지 않음 - Red 단계)
import { FailureScenarioEngine } from '../lib/failure-scenario-engine';
import { FixedDataSystem } from '../lib/fixed-data-system';
import { DynamicTimestampManager } from '../lib/dynamic-timestamp-manager';

// ==============================================
// 🧪 테스트 픽스처 데이터
// ==============================================

const mockServerTemplate: FixedServerTemplate = {
  id: 'web-01',
  name: 'Web Server 1',
  type: 'web',
  baselineMetrics: {
    cpu: { min: 10, max: 70, normal: 35 },
    memory: { min: 20, max: 80, normal: 45 },
    disk: { min: 30, max: 90, normal: 55 },
    network: { 
      latency: { min: 50, max: 200, normal: 80 },
      throughput: { min: 100, max: 1000, normal: 500 }
    },
    response_time: { min: 100, max: 2000, normal: 300 }
  },
  failurePatterns: {
    cpu_overload: {
      enabled: true,
      metrics: { cpu: 90 },
      progressionCurve: 'exponential',
      recoveryTime: 15,
      cascadeRisk: 0.3
    },
    memory_leak: {
      enabled: true,
      metrics: { memory: 95 },
      progressionCurve: 'linear',
      recoveryTime: 30,
      cascadeRisk: 0.4
    },
    storage_full: {
      enabled: true,
      metrics: { disk: 92 },
      progressionCurve: 'step',
      recoveryTime: 45,
      cascadeRisk: 0.2
    },
    network_issue: {
      enabled: true,
      metrics: { 
        network: { latency: 2000, throughput: 50 },
        response_time: 5000
      },
      progressionCurve: 'random',
      recoveryTime: 20,
      cascadeRisk: 0.5
    },
    database_slow: {
      enabled: true,
      metrics: { 
        response_time: 8000,
        error_rate: 15
      },
      progressionCurve: 'exponential',
      recoveryTime: 60,
      cascadeRisk: 0.8
    }
  },
  dependencies: ['database-01'],
  location: 'Seoul-DC1',
  environment: 'production',
  priority: 'high'
};

const mockBaselineMetrics: ServerMetrics = {
  cpu: 35,
  memory: 45,
  disk: 55,
  network: {
    latency: 80,
    throughput: 500,
    in: 100,
    out: 150
  },
  response_time: 300,
  request_count: 1000,
  error_rate: 0.5,
  uptime: 86400 // 24시간
};

// ==============================================
// 🚨 장애 시나리오 엔진 테스트
// ==============================================

describe('FailureScenarioEngine', () => {
  let engine: FailureScenarioEngine;
  
  beforeEach(() => {
    engine = new FailureScenarioEngine([mockServerTemplate]);
  });

  describe('CPU 과부하 시나리오', () => {
    it('CPU 과부하 시나리오가 정상적으로 적용되어야 함', async () => {
      // Red: 실패하는 테스트 작성
      const scenario: FailureScenario = 'cpu_overload';
      const result = await engine.applyScenario(
        mockServerTemplate.id,
        scenario,
        mockBaselineMetrics
      );
      
      expect(result.cpu).toBeGreaterThan(80);
      expect(result.cpu).toBeLessThan(100);
      expect(result.response_time).toBeGreaterThan(300); // 기본값보다 증가
    });

    it('CPU 과부하 시나리오의 진행 곡선이 exponential이어야 함', async () => {
      const scenario: FailureScenario = 'cpu_overload';
      const progressTimes = [0, 0.25, 0.5, 0.75, 1.0]; // 25%, 50%, 75%, 100% 진행
      
      const results = await Promise.all(
        progressTimes.map(progress => 
          engine.applyScenarioWithProgress(
            mockServerTemplate.id,
            scenario,
            mockBaselineMetrics,
            progress
          )
        )
      );
      
      // Exponential 곡선: 나중에 급격히 증가
      expect(results[1].cpu - results[0].cpu).toBeLessThan(
        results[4].cpu - results[3].cpu
      );
    });
  });

  describe('메모리 누수 시나리오', () => {
    it('메모리 누수 시나리오가 선형적으로 증가해야 함', async () => {
      const scenario: FailureScenario = 'memory_leak';
      const progressTimes = [0, 0.5, 1.0];
      
      const results = await Promise.all(
        progressTimes.map(progress => 
          engine.applyScenarioWithProgress(
            mockServerTemplate.id,
            scenario,
            mockBaselineMetrics,
            progress
          )
        )
      );
      
      // Linear 곡선: 일정한 증가율
      const firstIncrease = results[1].memory - results[0].memory;
      const secondIncrease = results[2].memory - results[1].memory;
      
      expect(Math.abs(firstIncrease - secondIncrease)).toBeLessThan(5); // 5% 오차 허용
    });
  });

  describe('연쇄 장애 시뮬레이션', () => {
    it('데이터베이스 장애가 의존성 서버에 연쇄 장애를 일으켜야 함', async () => {
      const databaseServer: FixedServerTemplate = {
        ...mockServerTemplate,
        id: 'database-01',
        type: 'database',
        dependencies: []
      };
      
      const webServer: FixedServerTemplate = {
        ...mockServerTemplate,
        id: 'web-01',
        type: 'web',
        dependencies: ['database-01']
      };
      
      const engineWithDeps = new FailureScenarioEngine([databaseServer, webServer]);
      
      // 데이터베이스 서버에 장애 발생
      await engineWithDeps.triggerScenario('database-01', 'database_slow');
      
      // 연쇄 장애 확인
      const cascadeFailures = await engineWithDeps.getCascadeFailures();
      
      expect(cascadeFailures.has('web-01')).toBe(true);
      expect(cascadeFailures.get('web-01')).toEqual(
        expect.arrayContaining(['database_slow'])
      );
    });
  });

  describe('시나리오 복구 테스트', () => {
    it('시나리오 완료 후 메트릭이 정상 범위로 복구되어야 함', async () => {
      const scenario: FailureScenario = 'cpu_overload';
      
      // 장애 시나리오 적용
      await engine.triggerScenario(mockServerTemplate.id, scenario);
      
      // 복구 시간 경과 시뮬레이션
      await engine.simulateTimeElapse(15 * 60 * 1000); // 15분
      
      // 복구 확인
      const recoveredMetrics = await engine.getServerMetrics(mockServerTemplate.id);
      
      expect(recoveredMetrics.cpu).toBeLessThan(70); // 정상 범위 복구
      expect(recoveredMetrics.cpu).toBeGreaterThan(10);
    });
  });
});

// ==============================================
// 🕒 동적 타임스탬프 매니저 테스트
// ==============================================

describe('DynamicTimestampManager', () => {
  let manager: DynamicTimestampManager;
  
  beforeEach(() => {
    manager = new DynamicTimestampManager();
  });

  describe('실시간 타임스탬프 생성', () => {
    it('타임스탬프가 실시간으로 생성되어야 함', () => {
      const timestamp1 = manager.generateRealtimeTimestamp();
      const timestamp2 = manager.generateRealtimeTimestamp();
      
      expect(new Date(timestamp1).getTime()).toBeLessThan(
        new Date(timestamp2).getTime()
      );
    });
  });

  describe('시간대별 가중치 적용', () => {
    it('업무시간(9-17시)에는 메트릭이 더 높아야 함', () => {
      const businessTime = new Date('2024-01-15T14:00:00Z'); // 오후 2시
      const nightTime = new Date('2024-01-15T02:00:00Z'); // 새벽 2시
      
      const businessMetrics = manager.applyTimeBasedWeights(
        mockBaselineMetrics,
        businessTime
      );
      
      const nightMetrics = manager.applyTimeBasedWeights(
        mockBaselineMetrics,
        nightTime
      );
      
      expect(businessMetrics.cpu).toBeGreaterThan(nightMetrics.cpu);
      expect(businessMetrics.request_count).toBeGreaterThan(nightMetrics.request_count);
    });
  });
});

// ==============================================
// 🏛️ 통합 시스템 테스트
// ==============================================

describe('FixedDataSystem', () => {
  let system: FixedDataSystem;
  
  beforeEach(async () => {
    system = new FixedDataSystem({
      enableScenarios: true,
      maxConcurrentScenarios: 3,
      scenarioRotationInterval: 30,
      cascadeFailureEnabled: true,
      redisPrefix: 'test:openmanager:',
      backupToSupabase: false
    });
    
    await system.initialize();
  });
  
  afterEach(async () => {
    await system.cleanup();
  });

  describe('시스템 초기화', () => {
    it('시스템이 정상적으로 초기화되어야 함', async () => {
      const state = await system.getSystemState();
      
      expect(state.servers.size).toBeGreaterThan(0);
      expect(state.systemHealth).toBe('healthy');
      expect(state.lastUpdate).toBeInstanceOf(Date);
    });
  });

  describe('API 호환성', () => {
    it('기존 대시보드 API와 100% 호환되어야 함', async () => {
      const response = await system.getDashboardApiResponse();
      
      // 기존 API 구조 확인
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('data');
      expect(response.data).toHaveProperty('servers');
      expect(response.data).toHaveProperty('stats');
      expect(response.data.stats).toHaveProperty('total');
      expect(response.data.stats).toHaveProperty('healthy');
      expect(response.data.stats).toHaveProperty('warning');
      expect(response.data.stats).toHaveProperty('critical');
    });
  });

  describe('성능 테스트', () => {
    it('Redis 캐시 응답시간이 5ms 이하여야 함', async () => {
      const iterations = 100;
      const responseTimes: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await system.getServerData();
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
      }
      
      const avgResponseTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
      
      expect(avgResponseTime).toBeLessThan(5);
    });
  });

  describe('장애 시나리오 통합 테스트', () => {
    it('여러 시나리오가 동시에 실행되어야 함', async () => {
      const scenarios: FailureScenario[] = ['cpu_overload', 'memory_leak', 'network_issue'];
      
      // 여러 시나리오 동시 실행
      await Promise.all(
        scenarios.map(scenario => 
          system.triggerScenario('web-01', scenario)
        )
      );
      
      const activeScenarios = await system.getActiveScenarios();
      
      expect(activeScenarios.length).toBe(3);
      expect(activeScenarios.every(s => scenarios.includes(s.scenario))).toBe(true);
    });
  });
});

// ==============================================
// 🚀 성능 벤치마크 테스트
// ==============================================

describe('성능 벤치마크', () => {
  let system: FixedDataSystem;
  
  beforeEach(async () => {
    system = new FixedDataSystem({
      enableScenarios: true,
      maxConcurrentScenarios: 5,
      scenarioRotationInterval: 10,
      cascadeFailureEnabled: true,
      redisPrefix: 'bench:openmanager:',
      backupToSupabase: false
    });
    
    await system.initialize();
  });
  
  afterEach(async () => {
    await system.cleanup();
  });

  it('동시 요청 1000개를 1초 내에 처리해야 함', async () => {
    const startTime = Date.now();
    
    const promises = Array.from({ length: 1000 }, () => 
      system.getServerData()
    );
    
    await Promise.all(promises);
    
    const totalTime = Date.now() - startTime;
    
    expect(totalTime).toBeLessThan(1000); // 1초 내 처리
  });

  it('메모리 사용량이 100MB를 초과하지 않아야 함', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // 대량 데이터 생성
    for (let i = 0; i < 1000; i++) {
      await system.getServerData();
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
    
    expect(memoryIncrease).toBeLessThan(100);
  });
});

// ==============================================
// 🎭 시나리오별 세부 테스트
// ==============================================

describe('시나리오별 세부 테스트', () => {
  let engine: FailureScenarioEngine;
  
  beforeEach(() => {
    engine = new FailureScenarioEngine([mockServerTemplate]);
  });

  describe('스토리지 풀 시나리오', () => {
    it('디스크 사용률이 90% 이상이어야 함', async () => {
      const result = await engine.applyScenario(
        mockServerTemplate.id,
        'storage_full',
        mockBaselineMetrics
      );
      
      expect(result.disk).toBeGreaterThan(90);
    });
  });

  describe('네트워크 이슈 시나리오', () => {
    it('레이턴시가 크게 증가해야 함', async () => {
      const result = await engine.applyScenario(
        mockServerTemplate.id,
        'network_issue',
        mockBaselineMetrics
      );
      
      expect(result.network.latency).toBeGreaterThan(1000);
      expect(result.network.throughput).toBeLessThan(100);
    });
  });
});