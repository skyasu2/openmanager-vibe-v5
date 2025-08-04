/**
 * 🤖 MCP 기반 서버 모니터링 AI 에이전트
 *
 * 핵심 특징:
 * - LLM 없이도 MCP와 초기 컨텍스트로 AI처럼 기능
 * - 질의응답 시스템 with 생각과정 애니메이션
 * - 자동 장애보고서 작성
 * - 타이핑 애니메이션 답변
 * - 베르셀 무료 tier 최적화
 */

import { unifiedDataBroker } from '@/services/data-collection/UnifiedDataBroker';
import type { ServerInstance } from '@/types/data-generator';
import type {
  MCPQueryIntent,
  MCPMonitoringData,
  MCPPatternAnalysis,
} from '@/types/mcp';
import {
  createMCPMonitoringData,
  getHealthScore,
  serverInstanceToMCPServer,
} from './adapters/server-type-adapter';
import {
  handleServerStatusQuery,
  handleIncidentQuery,
  handlePerformanceQuery,
  handleRecommendationQuery,
  handleCostQuery,
  handlePredictionQuery,
  handleGeneralQuery,
} from './ServerMonitoringAgentHandlers';

// 🧠 AI 생각과정 단계 (로컬 인터페이스)
export interface ThinkingStep {
  id: string;
  step: number;
  title: string;
  description: string;
  status: 'thinking' | 'processing' | 'completed' | 'error';
  result?: unknown;
  timestamp: Date;
  duration?: number;
}

// 🎯 질의응답 요청
export interface QueryRequest {
  id: string;
  query: string;
  timestamp: Date;
  context?: {
    serverId?: string;
    timeRange?: { start: Date; end: Date };
    priority?: 'low' | 'medium' | 'high' | 'critical';
  };
}

// 📝 AI 응답
export interface QueryResponse {
  id: string;
  queryId: string;
  answer: string;
  confidence: number;
  thinkingSteps: ThinkingStep[];
  recommendations: string[];
  insights: MonitoringInsight[];
  metadata: {
    processingTime: number;
    dataPoints: number;
    pattern: string;
    severity?: 'info' | 'warning' | 'error' | 'critical';
  };
  timestamp: Date;
}

// 💡 모니터링 인사이트
export interface MonitoringInsight {
  type: 'performance' | 'cost' | 'security' | 'availability' | 'trend';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  recommendation: string;
  affectedServers: string[];
  estimatedCost?: number;
  automatable: boolean;
}

// 📊 자동 장애보고서
export interface IncidentReport {
  id: string;
  title: string;
  summary: string;
  severity: 'minor' | 'major' | 'critical';
  affectedServers: ServerInstance[];
  timeline: {
    detected: Date;
    acknowledged?: Date;
    resolved?: Date;
    duration?: number;
  };
  rootCause: {
    analysis: string;
    factors: string[];
    confidence: number;
  };
  impact: {
    usersAffected: number;
    servicesDown: string[];
    estimatedLoss: number;
  };
  resolution: {
    actions: string[];
    prevention: string[];
    monitoring: string[];
  };
  metadata: {
    detectionMethod: string;
    escalationLevel: number;
    reportGenerated: Date;
  };
}

export class ServerMonitoringAgent {
  private static instance: ServerMonitoringAgent | null = null;
  private isRunning = false;
  private contextCache = new Map<string, any>();
  private updateCallbacks = new Set<(data: MCPMonitoringData) => void>();

  // 🎭 지식 베이스 (MCP 컨텍스트)
  private knowledgeBase = {
    // 서버 타입별 기본 임계값
    thresholds: {
      cpu: { warning: 70, critical: 85 },
      memory: { warning: 80, critical: 90 },
      disk: { warning: 85, critical: 95 },
      network: { warning: 80, critical: 95 },
      health: { warning: 70, critical: 50 },
    },

    // 일반적인 문제 패턴과 해결책
    patterns: {
      'high-cpu': {
        symptoms: ['CPU > 80%', 'slow response', 'high load'],
        causes: ['inefficient queries', 'resource leak', 'traffic spike'],
        solutions: ['optimize code', 'scale horizontal', 'add caching'],
      },
      'memory-leak': {
        symptoms: ['memory increasing', 'gradual slowdown', 'eventual crash'],
        causes: [
          'unclosed connections',
          'cache overflow',
          'circular references',
        ],
        solutions: ['restart service', 'fix code leaks', 'add monitoring'],
      },
      'disk-full': {
        symptoms: ['disk > 90%', 'write errors', 'log truncation'],
        causes: ['log accumulation', 'temp files', 'data growth'],
        solutions: ['clean logs', 'archive data', 'increase storage'],
      },
    },

    // 서버별 특성
    serverTypes: {
      web: {
        typical_cpu: 30,
        typical_memory: 40,
        critical_services: ['nginx', 'frontend'],
      },
      api: {
        typical_cpu: 50,
        typical_memory: 60,
        critical_services: ['api-server', 'middleware'],
      },
      database: {
        typical_cpu: 40,
        typical_memory: 70,
        critical_services: ['postgres', 'redis'],
      },
      cache: {
        typical_cpu: 20,
        typical_memory: 80,
        critical_services: ['redis', 'memcached'],
      },
    },
  };

  // 📚 질의응답 패턴 매칭
  private queryPatterns = [
    {
      pattern: /서버.*상태|상황|현황/i,
      intent: 'server-status',
      handler: 'handleServerStatusQuery',
    },
    {
      pattern: /장애|문제|오류|에러/i,
      intent: 'incident-analysis',
      handler: 'handleIncidentQuery',
    },
    {
      pattern: /성능|느림|지연|속도/i,
      intent: 'performance-analysis',
      handler: 'handlePerformanceQuery',
    },
    {
      pattern: /추천|권장|제안|개선/i,
      intent: 'recommendation',
      handler: 'handleRecommendationQuery',
    },
    {
      pattern: /비용|cost|돈|요금/i,
      intent: 'cost-analysis',
      handler: 'handleCostQuery',
    },
    {
      pattern: /예측|미래|앞으로|전망/i,
      intent: 'prediction',
      handler: 'handlePredictionQuery',
    },
  ];

  private constructor() {}

  public static getInstance(): ServerMonitoringAgent {
    if (!ServerMonitoringAgent.instance) {
      ServerMonitoringAgent.instance = new ServerMonitoringAgent();
    }
    return ServerMonitoringAgent.instance;
  }

  /**
   * 🚀 에이전트 초기화
   */
  public async _initialize(): Promise<void> {
    try {
      console.log('🤖 MCP 서버 모니터링 에이전트 초기화 중...');

      // 통합 데이터 브로커 연결 확인
      const brokerMetrics = unifiedDataBroker.getMetrics();
      console.log('📊 데이터 브로커 연결 완료:', brokerMetrics);

      this.isRunning = true;
      console.log('✅ MCP 서버 모니터링 에이전트 초기화 완료');
    } catch (error) {
      console.error('❌ 에이전트 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 🔌 MCP 연결 상태 확인
   */
  public async checkMCPConnection(): Promise<boolean> {
    try {
      // 통합 데이터 브로커를 통해 연결 상태 확인
      const metrics = unifiedDataBroker.getMetrics();
      return metrics !== null && this.isRunning;
    } catch (error) {
      console.error('MCP 연결 확인 실패:', error);
      return false;
    }
  }

  /**
   * 📋 전체 컨텍스트 수집
   */
  public async collectContext(): Promise<MCPMonitoringData> {
    return this.gatherCurrentData();
  }

  /**
   * 📋 특정 서버 컨텍스트 수집
   */
  public async collectServerContext(
    serverId: string
  ): Promise<MCPMonitoringData | null> {
    const cachedContext = this.contextCache.get(serverId);
    if (cachedContext) {
      return cachedContext;
    }

    const context = await this.gatherCurrentData({ serverId });

    // 특정 서버만 필터링
    const filteredContext = {
      ...context,
      servers: context.servers.filter((s) => s.id === serverId),
    };

    this.contextCache.set(serverId, filteredContext);

    // 캐시 TTL: 30초
    setTimeout(() => this.contextCache.delete(serverId), 30000);

    return filteredContext;
  }

  /**
   * 🔄 실시간 업데이트 구독
   */
  public subscribeToUpdates(
    callback: (data: MCPMonitoringData) => void
  ): () => void {
    this.updateCallbacks.add(callback);

    // 초기 데이터 전송
    this.gatherCurrentData().then((data) => callback(data));

    // 주기적 업데이트 (15초)
    const intervalId = setInterval(async () => {
      const data = await this.gatherCurrentData();
      callback(data);
    }, 15000);

    // 구독 해제 함수 반환
    return () => {
      this.updateCallbacks.delete(callback);
      if (this.updateCallbacks.size === 0) {
        clearInterval(intervalId);
      }
    };
  }

  /**
   * 🧹 캐시 초기화
   */
  public clearCache(): void {
    this.contextCache.clear();
    console.log('🧹 ServerMonitoringAgent 캐시 초기화됨');
  }

  /**
   * 🧠 메인 질의응답 처리 (생각과정 포함)
   */
  public async processQuery(request: QueryRequest): Promise<QueryResponse> {
    const startTime = Date.now();
    const thinkingSteps: ThinkingStep[] = [];

    try {
      // 1단계: 질의 의도 분석
      const analysisStep = this.createThinkingStep(
        1,
        '질의 의도 분석',
        '사용자 질문을 분석하여 적절한 응답 방식을 결정합니다'
      );
      thinkingSteps.push(analysisStep);

      const intent = await this.analyzeQueryIntent(request.query);
      this.completeThinkingStep(analysisStep, intent);

      // 2단계: 데이터 수집
      const dataStep = this.createThinkingStep(
        2,
        '실시간 데이터 수집',
        '현재 서버 상태와 메트릭을 수집합니다'
      );
      thinkingSteps.push(dataStep);

      const currentData = await this.gatherCurrentData(request.context);
      this.completeThinkingStep(dataStep, {
        servers: currentData.servers.length,
        clusters: currentData.clusters?.length || 0,
        apps: currentData.applications?.length || 0,
      });

      // 3단계: 패턴 분석
      const patternStep = this.createThinkingStep(
        3,
        '패턴 분석 및 이상 탐지',
        '수집된 데이터에서 이상 패턴을 찾고 분석합니다'
      );
      thinkingSteps.push(patternStep);

      const analysis = await this.analyzePatterns(currentData, intent);
      this.completeThinkingStep(patternStep, analysis.summary);

      // 4단계: 응답 생성
      const responseStep = this.createThinkingStep(
        4,
        'AI 응답 생성',
        '분석 결과를 바탕으로 최적의 답변을 생성합니다'
      );
      thinkingSteps.push(responseStep);

      const answer = await this.generateAnswer(intent, currentData, analysis);
      this.completeThinkingStep(responseStep, { answerLength: answer.length });

      // 5단계: 인사이트 추출
      const insightStep = this.createThinkingStep(
        5,
        '스마트 인사이트 생성',
        '추가적인 통찰과 개선 제안을 생성합니다'
      );
      thinkingSteps.push(insightStep);

      const insights = await this.generateInsights(currentData, analysis);
      this.completeThinkingStep(insightStep, { insights: insights.length });

      const processingTime = Date.now() - startTime;

      // SSE 알림 전송
      try {
        const { alertsEmitter } = await import('@/lib/events/alertsEmitter');
        alertsEmitter.emit('alert', {
          id: `alert_${Date.now()}`,
          type: analysis.severity === 'critical' ? 'error' : 'warning',
          title: `${analysis.issues?.length || 0}개 이슈 발견`,
          message: analysis.summary,
          severity: analysis.severity,
          timestamp: Date.now(),
        });
      } catch {
        /* noop - serverless edge 환경에서 import 실패 가능 */
      }

      return {
        id: `response_${Date.now()}`,
        queryId: request.id,
        answer,
        confidence: analysis.confidence || 0.8,
        thinkingSteps,
        recommendations: analysis.recommendations || [],
        insights,
        metadata: {
          processingTime,
          dataPoints: currentData.servers.length,
          pattern: analysis.pattern || 'normal',
          severity: analysis.severity as
            | 'info'
            | 'warning'
            | 'error'
            | 'critical'
            | undefined,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      // 오류 발생시 마지막 단계 실패 처리
      if (thinkingSteps.length > 0) {
        const lastStep = thinkingSteps[thinkingSteps.length - 1];
        lastStep.status = 'error';
        lastStep.result =
          error instanceof Error ? error.message : 'Unknown error';
      }

      throw error;
    }
  }

  /**
   * 🎯 질의 의도 분석 (MCP 패턴 매칭)
   */
  private async analyzeQueryIntent(query: string): Promise<MCPQueryIntent> {
    // 딜레이 시뮬레이션 (생각하는 시간)
    await new Promise((resolve) => setTimeout(resolve, 500));

    for (const pattern of this.queryPatterns) {
      if (pattern.pattern.test(query)) {
        return {
          intent: pattern.intent,
          handler: pattern.handler,
          confidence: 0.85,
          keywords: query.match(pattern.pattern) || [],
        };
      }
    }

    // 기본 패턴 (일반 질문)
    return {
      intent: 'general-inquiry',
      handler: 'handleGeneralQuery',
      confidence: 0.6,
      keywords: [],
    };
  }

  /**
   * 📊 현재 데이터 수집 (통합 브로커 사용)
   */
  private async gatherCurrentData(
    context?: QueryRequest['context']
  ): Promise<MCPMonitoringData> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    return new Promise((resolve) => {
      // 통합 데이터 브로커를 통해 데이터 구독
      const unsubscribe = unifiedDataBroker.subscribeToServers(
        'monitoring-agent',
        (servers) => {
          // 추가 메트릭 데이터 구독
          const unsubscribeMetrics = unifiedDataBroker.subscribeToMetrics(
            'monitoring-agent',
            (metrics: unknown) => {
              const metricsData = metrics as { summary?: string; [key: string]: unknown };
              unsubscribe();
              unsubscribeMetrics();

              const mcpData = createMCPMonitoringData(servers, context);

              resolve({
                ...mcpData,
                clusters: [], // 브로커에서 클러스터 정보 제공 시 업데이트
                applications: [], // 브로커에서 애플리케이션 정보 제공 시 업데이트
                summary: (typeof metricsData.summary === 'string' ? { performance: { avgCpu: 0, avgMemory: 0 } } : metricsData.summary) || mcpData.summary,
              });
            },
            {
              interval: 1000,
              priority: 'high',
              cacheStrategy: 'cache-first',
            }
          );
        },
        {
          interval: 1000,
          priority: 'high',
          cacheStrategy: 'cache-first',
        }
      );
    });
  }

  /**
   * 🔍 패턴 분석 및 이상 탐지
   */
  private async analyzePatterns(
    data: MCPMonitoringData,
    _intent: MCPQueryIntent
  ): Promise<MCPPatternAnalysis> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const analysis = {
      pattern: 'normal',
      severity: 'info' as 'info' | 'warning' | 'error' | 'critical',
      confidence: 0.8,
      issues: [] as string[],
      recommendations: [] as string[],
      summary: '시스템이 정상적으로 운영되고 있습니다',
    };

    // 서버별 이상 탐지
    for (const server of data.servers) {
      // CPU 이상
      if (
        server.metrics?.cpu &&
        server.metrics.cpu > this.knowledgeBase.thresholds.cpu.critical
      ) {
        analysis.pattern = 'high-cpu';
        analysis.severity = 'critical';
        analysis.issues.push(
          `${server.name}: CPU 사용률 위험 (${server.metrics.cpu.toFixed(1)}%)`
        );
        analysis.recommendations.push(
          `${server.name} 서버의 CPU 부하를 줄이거나 스케일링을 고려하세요`
        );
      } else if (
        server.metrics?.cpu &&
        server.metrics.cpu > this.knowledgeBase.thresholds.cpu.warning
      ) {
        analysis.pattern = 'cpu-warning';
        analysis.severity =
          analysis.severity === 'critical' ? 'critical' : 'warning';
        analysis.issues.push(
          `${server.name}: CPU 사용률 주의 (${server.metrics.cpu.toFixed(1)}%)`
        );
      }

      // 메모리 이상
      if (
        server.metrics?.memory &&
        server.metrics.memory > this.knowledgeBase.thresholds.memory.critical
      ) {
        analysis.pattern = 'memory-issue';
        analysis.severity = 'critical';
        analysis.issues.push(
          `${server.name}: 메모리 사용률 위험 (${server.metrics.memory.toFixed(1)}%)`
        );
        analysis.recommendations.push(
          `${server.name}에서 메모리 누수 확인이 필요합니다`
        );
      }

      // 디스크 이상
      if (
        server.metrics?.disk &&
        server.metrics.disk > this.knowledgeBase.thresholds.disk.critical
      ) {
        analysis.pattern = 'disk-full';
        analysis.severity = 'critical';
        analysis.issues.push(
          `${server.name}: 디스크 공간 부족 (${server.metrics.disk.toFixed(1)}%)`
        );
        analysis.recommendations.push(
          `${server.name}의 로그 정리 및 디스크 확장을 검토하세요`
        );
      }

      // 건강도 이상
      const healthScore = getHealthScore(server.health);
      if (healthScore < this.knowledgeBase.thresholds.health.critical) {
        analysis.pattern = 'health-degraded';
        analysis.severity = 'critical';
        analysis.issues.push(
          `${server.name}: 시스템 건강도 저하 (${healthScore.toFixed(1)}점)`
        );
        analysis.recommendations.push(
          `${server.name}의 상세 진단이 필요합니다`
        );
      }
    }

    // 전체적인 분석 요약 업데이트
    if (analysis.issues.length > 0) {
      analysis.summary = `${analysis.issues.length}개의 이슈가 발견되었습니다. 즉시 확인이 필요합니다.`;
      analysis.confidence = 0.9;
    } else {
      analysis.summary = '모든 서버가 정상 범위 내에서 동작하고 있습니다.';
      analysis.confidence = 0.95;
    }

    return analysis;
  }

  /**
   * 💬 답변 생성 (의도별 핸들러)
   */
  private async generateAnswer(
    intent: MCPQueryIntent,
    data: MCPMonitoringData,
    analysis: MCPPatternAnalysis
  ): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    switch (intent.intent) {
      case 'server-status':
        return this.handleServerStatusQuery(data, analysis);
      case 'incident-analysis':
        return this.handleIncidentQuery(data, analysis);
      case 'performance-analysis':
        return this.handlePerformanceQuery(data, analysis);
      case 'recommendation':
        return this.handleRecommendationQuery(data, analysis);
      case 'cost-analysis':
        return this.handleCostQuery(data, analysis);
      case 'prediction':
        return this.handlePredictionQuery(data, analysis);
      default:
        return this.handleGeneralQuery(data, analysis);
    }
  }

  /**
   * 🔍 서버 상태 조회 핸들러
   */
  private handleServerStatusQuery(
    data: MCPMonitoringData,
    analysis: MCPPatternAnalysis
  ): string {
    return handleServerStatusQuery(data, analysis, getHealthScore as (health: unknown) => number);
  }

  /**
   * 🚨 장애 분석 핸들러
   */
  private handleIncidentQuery(
    data: MCPMonitoringData,
    analysis: MCPPatternAnalysis
  ): string {
    return handleIncidentQuery(data, analysis);
  }

  /**
   * 🚀 성능 분석 핸들러
   */
  private handlePerformanceQuery(
    data: MCPMonitoringData,
    analysis: MCPPatternAnalysis
  ): string {
    return handlePerformanceQuery(data, analysis);
  }

  /**
   * 💡 권장사항 핸들러
   */
  private handleRecommendationQuery(
    data: MCPMonitoringData,
    analysis: MCPPatternAnalysis
  ): string {
    return handleRecommendationQuery(data, analysis);
  }

  /**
   * 💰 비용 분석 핸들러
   */
  private handleCostQuery(
    data: MCPMonitoringData,
    analysis: MCPPatternAnalysis
  ): string {
    return handleCostQuery(data, analysis);
  }

  /**
   * 🔮 예측 분석 핸들러
   */
  private handlePredictionQuery(
    data: MCPMonitoringData,
    analysis: MCPPatternAnalysis
  ): string {
    return handlePredictionQuery(data, analysis);
  }

  /**
   * 🤖 일반 질의 핸들러
   */
  private handleGeneralQuery(
    data: MCPMonitoringData,
    analysis: MCPPatternAnalysis
  ): string {
    return handleGeneralQuery(data, analysis);
  }

  /**
   * 💡 스마트 인사이트 생성
   */
  private async generateInsights(
    data: MCPMonitoringData,
    _analysis: MCPPatternAnalysis
  ): Promise<MonitoringInsight[]> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const insights: MonitoringInsight[] = [];

    // 성능 인사이트
    const highCpuServers = data.servers.filter(
      (s) => (s.metrics?.cpu || s.cpu || 0) > 70
    );
    if (highCpuServers.length > 0) {
      insights.push({
        type: 'performance',
        title: 'CPU 사용률 최적화 기회',
        description: `${highCpuServers.length}대의 서버에서 높은 CPU 사용률이 감지되었습니다`,
        impact: 'high',
        confidence: 0.85,
        recommendation: '로드 밸런싱 개선 또는 서버 증설을 고려하세요',
        affectedServers: highCpuServers.map((s) => s.id),
        automatable: true,
      });
    }

    // 비용 인사이트
    const underutilizedServers = data.servers.filter(
      (s) =>
        (s.metrics?.cpu || s.cpu || 0) < 30 &&
        (s.metrics?.memory || s.memory || 0) < 40
    );
    if (underutilizedServers.length > 0) {
      insights.push({
        type: 'cost',
        title: '리소스 최적화 기회',
        description: `${underutilizedServers.length}대의 서버가 저활용 상태입니다`,
        impact: 'medium',
        confidence: 0.9,
        recommendation: '서버 통합 또는 다운스케일링을 고려하세요',
        affectedServers: underutilizedServers.map((s) => s.id),
        estimatedCost: underutilizedServers.length * 50,
        automatable: false,
      });
    }

    // 가용성 인사이트
    const unhealthyServers = data.servers.filter(
      (s) => getHealthScore(s.health) < 80
    );
    if (unhealthyServers.length > 0) {
      insights.push({
        type: 'availability',
        title: '시스템 건강도 개선 필요',
        description: `${unhealthyServers.length}대의 서버에서 건강도 저하가 감지되었습니다`,
        impact: 'high',
        confidence: 0.8,
        recommendation: '상세 진단 및 예방적 유지보수를 수행하세요',
        affectedServers: unhealthyServers.map((s) => s.id),
        automatable: false,
      });
    }

    return insights;
  }

  /**
   * 📊 자동 장애 보고서 생성 (통합 브로커 사용)
   */
  public async generateIncidentReport(
    serverId: string
  ): Promise<IncidentReport> {
    // 통합 브로커를 통해 서버 정보 조회
    const serverData = await new Promise<ServerInstance | null>((resolve) => {
      const unsubscribe = unifiedDataBroker.subscribeToServers(
        'incident-report',
        (servers) => {
          unsubscribe();
          const server = servers.find((s) => s.id === serverId);
          resolve(server || null);
        },
        { interval: 1000, priority: 'high', cacheStrategy: 'cache-first' }
      );
    });

    if (!serverData) {
      throw new Error(`서버 ${serverId}를 찾을 수 없습니다`);
    }

    const server = serverData;

    const now = new Date();
    const mcpServer = serverInstanceToMCPServer(server);
    const report: IncidentReport = {
      id: `incident_${Date.now()}`,
      title: `${server.name} 시스템 이상 감지`,
      summary: `${server.name}에서 ${(typeof server.health === 'object' && server.health?.issues?.join(', ')) || '알 수 없는 문제'} 문제가 발생했습니다`,
      severity:
        server.status === 'error'
          ? 'critical'
          : server.status === 'warning'
            ? 'major'
            : 'minor',
      affectedServers: [server],
      timeline: {
        detected: now,
        duration: 0,
      },
      rootCause: {
        analysis: this.analyzeRootCause(mcpServer),
        factors:
          (typeof server.health === 'object' && server.health?.issues) || [],
        confidence: 0.75,
      },
      impact: {
        usersAffected: Math.floor(Math.random() * 1000),
        servicesDown: [server.name],
        estimatedLoss: Math.floor(Math.random() * 5000),
      },
      resolution: {
        actions: this.generateResolutionActions(mcpServer),
        prevention: [
          '모니터링 임계값 조정',
          '예방적 유지보수 스케줄 수립',
          '자동 복구 스크립트 구현',
        ],
        monitoring: [
          '실시간 알럿 강화',
          '성능 지표 추가 모니터링',
          '로그 분석 자동화',
        ],
      },
      metadata: {
        detectionMethod: 'MCP AI 모니터링',
        escalationLevel:
          server.status === 'error' ? 3 : server.status === 'warning' ? 2 : 1,
        reportGenerated: now,
      },
    };

    return report;
  }

  /**
   * 🔍 근본 원인 분석
   */
  private analyzeRootCause(server: MCPMonitoringData['servers'][0]): string {
    const issues =
      (typeof server.health === 'object' && server.health?.issues) || [];

    if (issues.includes('High CPU usage detected')) {
      return 'CPU 사용률 급증으로 인한 시스템 과부하. 프로세스 최적화 또는 스케일 아웃 필요.';
    }
    if (issues.includes('Memory leak suspected')) {
      return '메모리 누수 의심. 애플리케이션 재시작 및 메모리 사용 패턴 분석 필요.';
    }
    if (issues.includes('Disk space running low')) {
      return '디스크 공간 부족. 로그 정리 및 스토리지 확장 필요.';
    }

    return '복합적인 요인으로 인한 시스템 성능 저하. 종합적인 점검이 필요합니다.';
  }

  /**
   * 🛠️ 해결 액션 생성
   */
  private generateResolutionActions(
    server: MCPMonitoringData['servers'][0]
  ): string[] {
    const actions: string[] = [];

    // 🔧 안전한 metrics 접근
    if ((server.metrics?.cpu || 0) > 80) {
      actions.push('CPU 사용률 최적화: 불필요한 프로세스 종료');
      actions.push('로드 밸런싱 재구성 또는 서버 증설 검토');
    }

    if ((server.metrics?.memory || 0) > 85) {
      actions.push('메모리 정리: 캐시 클리어 및 메모리 누수 점검');
      actions.push('애플리케이션 재시작 고려');
    }

    if ((server.metrics?.disk || 0) > 90) {
      actions.push('디스크 공간 확보: 로그 파일 정리');
      actions.push('스토리지 확장 계획 수립');
    }

    actions.push('서비스 재시작');
    actions.push('모니터링 강화');

    return actions;
  }

  /**
   * 🎭 생각과정 단계 생성
   */
  private createThinkingStep(
    step: number,
    title: string,
    description: string
  ): ThinkingStep {
    return {
      id: `step_${Date.now()}_${step}`,
      step,
      title,
      description,
      status: 'thinking',
      timestamp: new Date(),
    };
  }

  /**
   * ✅ 생각과정 단계 완료
   */
  private completeThinkingStep(step: ThinkingStep, result?: unknown): void {
    step.status = 'completed';
    step.result = result;
    step.duration = Date.now() - step.timestamp.getTime();
  }

  /**
   * 🏥 에이전트 상태 확인
   */
  public async healthCheck() {
    return {
      status: this.isRunning ? 'healthy' : 'stopped',
      capabilities: [
        'query-answering',
        'incident-analysis',
        'performance-monitoring',
        'cost-analysis',
        'predictive-insights',
        'auto-reporting',
      ],
      knowledgeBase: {
        patterns: Object.keys(this.knowledgeBase.patterns).length,
        thresholds: Object.keys(this.knowledgeBase.thresholds).length,
        queryPatterns: this.queryPatterns.length,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

// 싱글톤 인스턴스
export const serverMonitoringAgent = ServerMonitoringAgent.getInstance();
