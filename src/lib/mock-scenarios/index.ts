/**
 * 🎭 Mock 시나리오 통합 모듈
 *
 * 모든 시나리오를 통합하고 기존 Mock 시스템과 연결
 */

export * from './server-monitoring-scenarios';
export * from './korean-nlp-scenarios';
export * from './ml-analytics-scenarios';

import {
  ServerScenario,
  ScenarioRunner,
  SCENARIO_LIBRARY as SERVER_SCENARIOS,
} from './server-monitoring-scenarios';

import {
  KoreanNLPScenario,
  TECHNICAL_MIXED_CASES,
  BUSINESS_CONTEXT_CASES,
  COMPLEX_MIXED_CASES,
  EDGE_CASES,
  generateRandomKoreanQuery,
} from './korean-nlp-scenarios';

import {
  MLAnalyticsPattern,
  ML_PATTERN_LIBRARY,
  generateMetricsByWorkload,
  detectAnomalies,
  generatePredictions,
} from './ml-analytics-scenarios';

/**
 * 시나리오 매니저 - 실제 서비스 사용
 * 실제 서비스와 직접 연동하여 테스트 시나리오 관리 (Mock 제거)
 */
export class MockScenarioManager {
  private serverScenarioRunner?: ScenarioRunner;
  private activeScenarios: Map<string, any> = new Map();

  constructor() {
    console.log('🎬 시나리오 매니저 초기화 (실제 서비스 사용)');
  }

  /**
   * 서버 모니터링 시나리오 시작
   */
  startServerScenario(scenarioId: keyof typeof SERVER_SCENARIOS) {
    const scenario = SERVER_SCENARIOS[scenarioId];
    if (!scenario) {
      console.error(`❌ 시나리오를 찾을 수 없음: ${scenarioId}`);
      return;
    }

    this.serverScenarioRunner = new ScenarioRunner(scenario);
    this.serverScenarioRunner.start();
    this.activeScenarios.set('server', scenario);

    console.log(`🎬 서버 시나리오 시작: ${scenario.name}`);

    // 주기적으로 상태 업데이트
    const updateInterval = setInterval(() => {
      if (
        !this.serverScenarioRunner ||
        this.serverScenarioRunner.isComplete()
      ) {
        clearInterval(updateInterval);
        console.log('✅ 서버 시나리오 완료');
        return;
      }

      const state = this.serverScenarioRunner.getCurrentState();
      this.updateMockData(state);
    }, 5000); // 5초마다 업데이트
  }

  /**
   * Korean NLP 시나리오 테스트 (실제 GCP Functions 사용)
   */
  async testKoreanNLPScenarios(
    category?: 'technical' | 'business' | 'mixed' | 'edge-case'
  ) {
    // 실제 GCP Functions 사용
    const { analyzeKoreanNLP } = await import('@/lib/gcp/gcp-functions-client');

    let scenarios: KoreanNLPScenario[] = [];

    if (!category) {
      scenarios = [
        ...TECHNICAL_MIXED_CASES,
        ...BUSINESS_CONTEXT_CASES,
        ...COMPLEX_MIXED_CASES,
        ...EDGE_CASES,
      ];
    } else {
      scenarios = [
        ...TECHNICAL_MIXED_CASES,
        ...BUSINESS_CONTEXT_CASES,
        ...COMPLEX_MIXED_CASES,
        ...EDGE_CASES,
      ].filter((s) => s.category === category);
    }

    console.log(
      `🧪 Korean NLP 시나리오 테스트 시작 (${scenarios.length}개) - 실제 GCP Functions 사용`
    );

    const results = [];
    for (const scenario of scenarios) {
      try {
        const result = await analyzeKoreanNLP(scenario.input, scenario.context);

        results.push({
          scenario,
          result,
          success: result.success,
        });

        console.log(`📝 ${scenario.id}: ${result.success ? '✅' : '❌'}`);
      } catch (error) {
        console.error(`❌ ${scenario.id} 실패:`, error);
        results.push({
          scenario,
          result: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          success: false,
        });
      }
    }

    return results;
  }

  /**
   * ML Analytics 패턴 적용
   */
  applyMLAnalyticsPattern(
    serverType: 'web' | 'api' | 'database' | 'cache' | 'ml',
    patternId?: string
  ) {
    const patterns = ML_PATTERN_LIBRARY[serverType];
    if (!patterns || patterns.length === 0) {
      console.error(`❌ ${serverType}에 대한 ML 패턴이 없음`);
      return;
    }

    const pattern = patternId
      ? patterns.find((p) => p.id === patternId)
      : patterns[0];

    if (!pattern) {
      console.error(`❌ ML 패턴을 찾을 수 없음: ${patternId}`);
      return;
    }

    this.activeScenarios.set('ml', pattern);
    console.log(`🤖 ML 패턴 적용: ${pattern.name}`);

    // 메트릭 생성 및 적용
    this.generateAndApplyMLMetrics(pattern);
  }

  /**
   * 랜덤 시나리오 실행
   */
  startRandomScenario() {
    const scenarioTypes = ['server', 'nlp', 'ml'];
    const randomType =
      scenarioTypes[Math.floor(Math.random() * scenarioTypes.length)];

    switch (randomType) {
      case 'server':
        const serverScenarios = Object.keys(SERVER_SCENARIOS) as Array<
          keyof typeof SERVER_SCENARIOS
        >;
        const randomServerScenario =
          serverScenarios[Math.floor(Math.random() * serverScenarios.length)];
        if (randomServerScenario) {
          this.startServerScenario(randomServerScenario);
        }
        break;

      case 'nlp':
        this.testKoreanNLPScenarios();
        break;

      case 'ml':
        const serverTypes = ['web', 'api', 'database', 'cache', 'ml'] as const;
        const randomServerType =
          serverTypes[Math.floor(Math.random() * serverTypes.length)];
        if (randomServerType) {
          this.applyMLAnalyticsPattern(randomServerType);
        }
        break;
    }
  }

  /**
   * 현재 활성 시나리오 상태 조회
   */
  getActiveScenarios() {
    const scenarios: Record<string, any> = {};

    if (this.serverScenarioRunner) {
      scenarios.server = {
        ...this.activeScenarios.get('server'),
        currentState: this.serverScenarioRunner.getCurrentState(),
      };
    }

    if (this.activeScenarios.has('ml')) {
      scenarios.ml = this.activeScenarios.get('ml');
    }

    return scenarios;
  }

  /**
   * 시나리오 중지
   */
  stopAllScenarios() {
    if (this.serverScenarioRunner) {
      this.serverScenarioRunner.stop();
    }
    this.activeScenarios.clear();
    console.log('🛑 모든 시나리오 중지됨');
  }

  /**
   * Private: Mock 데이터 업데이트 (실제 Supabase 사용으로 로깅만)
   */
  private updateMockData(state: ReturnType<ScenarioRunner['getCurrentState']>) {
    // 실제 Supabase 사용으로 로깅만 수행
    console.log('📊 서버 메트릭 업데이트:', state.servers.size, '개 서버');

    // 최근 이벤트 로깅
    state.recentEvents.forEach((event) => {
      console.log(`🔔 이벤트: [${event.severity}] ${event.message}`);
    });
  }

  /**
   * Private: ML 메트릭 생성 및 적용
   */
  private generateAndApplyMLMetrics(pattern: MLAnalyticsPattern) {
    const now = new Date();
    const metrics: Array<{ timestamp: Date; value: number; type: string }> = [];

    // 24시간 동안의 메트릭 생성
    for (let h = -24; h <= 0; h++) {
      const timestamp = new Date(now.getTime() + h * 60 * 60 * 1000);

      pattern.metrics.forEach((metricPattern) => {
        const baseValue =
          (metricPattern.baselineRange.min + metricPattern.baselineRange.max) /
          2;
        const value = generateMetricsByWorkload(
          pattern.workloadType,
          baseValue,
          timestamp
        );

        metrics.push({
          timestamp,
          value,
          type: metricPattern.metricType,
        });
      });
    }

    // 이상 징후 감지
    const anomalies = detectAnomalies(metrics, pattern);

    // 예측 생성
    const predictions = generatePredictions(metrics, pattern, 24);

    // 실제 GCP Functions에 분석 결과 로깅
    console.log(
      `📈 ML 분석 결과: ${anomalies.length}개 이상 징후, ${predictions.length}개 예측`
    );

    // 실제 서비스와 연동 시 여기서 결과를 전송할 수 있음
    // await analyzeMLMetrics(metrics, { anomalies, predictions });
  }
}

/**
 * 시나리오 헬퍼 함수들
 */

// 현실적인 서버 메트릭 생성
export function generateRealisticServerMetrics(
  serverType: 'web' | 'api' | 'database' | 'cache',
  timeOfDay: number // 0-23
): {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  responseTime: number;
} {
  const baseMetrics = {
    web: { cpu: 40, memory: 50, disk: 30, network: 60, responseTime: 100 },
    api: { cpu: 50, memory: 60, disk: 20, network: 70, responseTime: 50 },
    database: { cpu: 30, memory: 70, disk: 80, network: 40, responseTime: 20 },
    cache: { cpu: 20, memory: 80, disk: 10, network: 50, responseTime: 5 },
  };

  const base = baseMetrics[serverType];

  // 시간대별 부하 패턴
  let timeMultiplier = 1;
  if (timeOfDay >= 9 && timeOfDay <= 11) timeMultiplier = 1.3; // 오전 피크
  if (timeOfDay >= 12 && timeOfDay <= 13) timeMultiplier = 1.5; // 점심 피크
  if (timeOfDay >= 14 && timeOfDay <= 17) timeMultiplier = 1.2; // 오후
  if (timeOfDay >= 20 && timeOfDay <= 22) timeMultiplier = 1.4; // 저녁 피크
  if (timeOfDay >= 2 && timeOfDay <= 5) timeMultiplier = 0.5; // 새벽

  // 랜덤 변동 추가
  const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 ~ 1.2

  return {
    cpu: Math.min(95, base.cpu * timeMultiplier * randomFactor),
    memory: Math.min(95, base.memory * timeMultiplier * randomFactor * 0.9), // 메모리는 덜 변동
    disk: Math.min(95, base.disk * (1 + Math.random() * 0.1)), // 디스크는 거의 일정
    network: Math.min(95, base.network * timeMultiplier * randomFactor),
    responseTime: Math.max(
      1,
      base.responseTime * timeMultiplier * randomFactor
    ),
  };
}

// 시나리오 기반 알림 생성
export function generateScenarioAlerts(
  scenario: ServerScenario,
  currentTime: number
): Array<{
  serverId: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
}> {
  const alerts: Array<{
    serverId: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: Date;
  }> = [];

  scenario.events
    .filter((event) => event.timeOffset <= currentTime)
    .forEach((event) => {
      alerts.push({
        serverId: event.serverId,
        severity: event.severity,
        message: event.message,
        timestamp: new Date(),
      });
    });

  return alerts;
}

// 전역 시나리오 매니저 인스턴스
export const scenarioManager = new MockScenarioManager();
