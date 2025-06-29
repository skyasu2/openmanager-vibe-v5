/**
 * 🧠 Enhanced Data Analyzer v2.0
 *
 * 새로운 RealServerDataGenerator와 완전 호환되는 고도화된 분석 엔진
 * - 다층적 서버 아키텍처 분석 (Single → Microservices)
 * - 실시간 성능 최적화 권장사항
 * - 한국어 자연어 처리 및 인사이트 생성
 * - 클러스터 및 애플리케이션 수준 분석
 */

import { smartRedis } from '@/lib/redis';
import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import {
  type ApplicationMetrics,
  type ServerCluster,
  type ServerInstance,
} from '@/types/data-generator';

// 분석 결과 인터페이스
export interface EnhancedAnalysisResult {
  timestamp: string;
  analysisType: 'real-time' | 'trend' | 'prediction' | 'anomaly';
  scope: 'server' | 'cluster' | 'application' | 'system';

  // 핵심 메트릭 분석
  metrics: {
    performance: {
      score: number; // 0-100
      trend: 'improving' | 'stable' | 'degrading';
      bottlenecks: string[];
    };
    reliability: {
      score: number;
      uptime: number;
      incidents: number;
      mttr: number; // Mean Time To Recovery
    };
    efficiency: {
      score: number;
      resourceUtilization: number;
      costOptimization: number;
    };
  };

  // 자연어 인사이트 (한국어)
  insights: {
    summary: string;
    keyFindings: string[];
    recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      action: string;
      impact: string;
      effort: string;
    }>;
    alerts: Array<{
      level: 'critical' | 'warning' | 'info';
      message: string;
      affectedComponents: string[];
    }>;
  };

  // 상세 분석 데이터
  details: {
    serverAnalysis: Record<string, any>;
    clusterAnalysis: Record<string, any>;
    applicationAnalysis: Record<string, any>;
    correlations: Array<{
      factor1: string;
      factor2: string;
      strength: number;
      description: string;
    }>;
  };
}

// 자연어 쿼리 인터페이스
export interface NaturalLanguageQuery {
  query: string;
  intent: 'status' | 'performance' | 'issues' | 'prediction' | 'optimization';
  context?: {
    timeRange?: string;
    serverIds?: string[];
    clusterIds?: string[];
    applicationNames?: string[];
  };
}

export interface QueryResponse {
  query: string;
  intent: string;
  response: string;
  data: any;
  confidence: number;
  suggestions: string[];
}

export class EnhancedDataAnalyzer {
  private static instance: EnhancedDataAnalyzer | null = null;
  private dataGenerator: RealServerDataGenerator;
  private redis: any;

  // 한국어 자연어 처리 매핑
  private koreanTermMapping = {
    // 상태 관련
    상태: 'status',
    건강도: 'health',
    성능: 'performance',
    응답시간: 'response_time',
    처리량: 'throughput',
    오류율: 'error_rate',

    // 리소스 관련
    CPU: 'cpu',
    메모리: 'memory',
    디스크: 'disk',
    네트워크: 'network',
    스토리지: 'storage',

    // 서버 타입
    웹서버: 'web',
    API서버: 'api',
    데이터베이스: 'database',
    캐시: 'cache',
    큐: 'queue',

    // 액션
    최적화: 'optimize',
    스케일링: 'scaling',
    모니터링: 'monitoring',
    예측: 'prediction',
    분석: 'analysis',
  };

  private intentPatterns = {
    status: ['상태', '현황', '현재', '지금', '어떤', '어떻게'],
    performance: ['성능', '속도', '빠르', '느리', '응답시간', '처리량'],
    issues: ['문제', '오류', '장애', '이슈', '경고', '알림'],
    prediction: ['예측', '예상', '미래', '앞으로', '될', '가능성'],
    optimization: ['최적화', '개선', '향상', '효율', '절약', '줄이'],
  };

  private constructor() {
    this.dataGenerator = RealServerDataGenerator.getInstance();
    this.redis = smartRedis;
  }

  public static getInstance(): EnhancedDataAnalyzer {
    if (!EnhancedDataAnalyzer.instance) {
      EnhancedDataAnalyzer.instance = new EnhancedDataAnalyzer();
    }
    return EnhancedDataAnalyzer.instance;
  }

  /**
   * 📊 종합 시스템 분석
   */
  public async analyzeSystem(): Promise<EnhancedAnalysisResult> {
    const servers = this.dataGenerator.getAllServers();
    const clusters = this.dataGenerator.getAllClusters();
    const applications = this.dataGenerator.getAllApplications();

    // 성능 분석
    const performanceAnalysis = this.analyzePerformance(servers, clusters);

    // 신뢰성 분석
    const reliabilityAnalysis = this.analyzeReliability(servers);

    // 효율성 분석
    const efficiencyAnalysis = this.analyzeEfficiency(servers, applications);

    // 상관관계 분석
    const correlations = this.analyzeCorrelations(servers);

    // 한국어 인사이트 생성
    const insights = this.generateKoreanInsights(
      performanceAnalysis,
      reliabilityAnalysis,
      efficiencyAnalysis,
      servers,
      clusters
    );

    return {
      timestamp: new Date().toISOString(),
      analysisType: 'real-time',
      scope: 'system',
      metrics: {
        performance: performanceAnalysis,
        reliability: reliabilityAnalysis,
        efficiency: efficiencyAnalysis,
      },
      insights,
      details: {
        serverAnalysis: this.getServerAnalysisDetails(servers),
        clusterAnalysis: this.getClusterAnalysisDetails(clusters),
        applicationAnalysis: this.getApplicationAnalysisDetails(applications),
        correlations,
      },
    };
  }

  /**
   * 🗣️ 자연어 쿼리 처리 (한국어 지원)
   */
  public async processNaturalLanguageQuery(
    query: string
  ): Promise<QueryResponse> {
    // 의도 분류
    const intent = this.classifyIntent(query);

    // 컨텍스트 추출
    const context = this.extractContext(query);

    // 쿼리 실행
    const data = await this.executeQuery(intent, context, query);

    // 한국어 응답 생성
    const response = this.generateKoreanResponse(intent, data, query);

    // 추가 제안사항
    const suggestions = this.generateSuggestions(intent, data);

    return {
      query,
      intent,
      response,
      data,
      confidence: this.calculateConfidence(intent, context),
      suggestions,
    };
  }

  /**
   * 📈 성능 분석
   */
  private analyzePerformance(
    servers: ServerInstance[],
    clusters: ServerCluster[]
  ) {
    const totalServers = servers.length;
    if (totalServers === 0)
      return { score: 0, trend: 'stable' as const, bottlenecks: [] };

    // CPU, 메모리, 응답시간 분석
    const avgCpu =
      servers.reduce((sum, s) => sum + s.metrics.cpu, 0) / totalServers;
    const avgMemory =
      servers.reduce((sum, s) => sum + s.metrics.memory, 0) / totalServers;
    const avgErrors =
      servers.reduce((sum, s) => sum + s.metrics.errors, 0) / totalServers;

    // 성능 점수 계산 (0-100)
    const cpuScore = Math.max(0, 100 - avgCpu);
    const memoryScore = Math.max(0, 100 - avgMemory);
    const errorScore = Math.max(0, 100 - avgErrors / 10); // 오류율을 10배 가중

    const score = Math.round((cpuScore + memoryScore + errorScore) / 3);

    // 병목 지점 식별
    const bottlenecks: string[] = [];
    if (avgCpu > 80) bottlenecks.push('CPU 과부하');
    if (avgMemory > 85) bottlenecks.push('메모리 부족');
    if (avgErrors > 5) bottlenecks.push('높은 오류율');

    // 트렌드 분석 (간단한 로직)
    const trend = (
      score > 70 ? 'improving' : score > 40 ? 'stable' : 'degrading'
    ) as 'improving' | 'stable' | 'degrading';

    return { score, trend, bottlenecks };
  }

  /**
   * 🛡️ 신뢰성 분석
   */
  private analyzeReliability(servers: ServerInstance[]) {
    const totalServers = servers.length;
    if (totalServers === 0)
      return { score: 0, uptime: 0, incidents: 0, mttr: 0 };

    const healthyServers = servers.filter(s => s.health.score > 80).length;
    const avgUptime =
      servers.reduce((sum, s) => sum + s.metrics.uptime, 0) / totalServers;
    const totalIncidents = servers.reduce(
      (sum, s) => sum + s.health.issues.length,
      0
    );

    const score = Math.round((healthyServers / totalServers) * 100);
    const mttr = totalIncidents > 0 ? Math.round(300 / totalIncidents) : 0; // 예상 복구 시간

    return {
      score,
      uptime: Math.round(avgUptime),
      incidents: totalIncidents,
      mttr,
    };
  }

  /**
   * ⚡ 효율성 분석
   */
  private analyzeEfficiency(
    servers: ServerInstance[],
    applications: ApplicationMetrics[]
  ) {
    const totalServers = servers.length;
    if (totalServers === 0)
      return { score: 0, resourceUtilization: 0, costOptimization: 0 };

    // 리소스 활용률
    const avgUtilization =
      servers.reduce((sum, s) => {
        return sum + (s.metrics.cpu + s.metrics.memory) / 2;
      }, 0) / totalServers;

    // 비용 최적화 점수 (리소스 대비 처리량)
    const avgRequests =
      servers.reduce((sum, s) => sum + s.metrics.requests, 0) / totalServers;
    const costOptimization =
      avgRequests > 0 ? Math.min(100, (avgRequests / avgUtilization) * 10) : 0;

    const score = Math.round(
      (100 - Math.abs(avgUtilization - 60)) * 0.7 + costOptimization * 0.3
    );

    return {
      score,
      resourceUtilization: Math.round(avgUtilization),
      costOptimization: Math.round(costOptimization),
    };
  }

  /**
   * 🔗 상관관계 분석
   */
  private analyzeCorrelations(servers: ServerInstance[]) {
    const correlations: any[] = [];

    if (servers.length > 1) {
      // CPU와 응답시간 상관관계
      const cpuResponseCorr = this.calculateCorrelation(
        servers.map(s => s.metrics.cpu),
        servers.map(s => s.metrics.requests)
      );

      if (Math.abs(cpuResponseCorr) > 0.3) {
        correlations.push({
          factor1: 'CPU 사용률',
          factor2: '요청 처리량',
          strength: cpuResponseCorr,
          description:
            cpuResponseCorr > 0
              ? 'CPU 사용률이 높을수록 요청 처리량이 증가하는 경향'
              : 'CPU 사용률이 높을수록 요청 처리량이 감소하는 경향',
        });
      }

      // 메모리와 오류율 상관관계
      const memoryErrorCorr = this.calculateCorrelation(
        servers.map(s => s.metrics.memory),
        servers.map(s => s.metrics.errors)
      );

      if (Math.abs(memoryErrorCorr) > 0.3) {
        correlations.push({
          factor1: '메모리 사용률',
          factor2: '오류율',
          strength: memoryErrorCorr,
          description:
            memoryErrorCorr > 0
              ? '메모리 사용률이 높을수록 오류가 증가하는 경향'
              : '메모리 최적화가 오류 감소에 도움이 되는 경향',
        });
      }
    }

    return correlations;
  }

  /**
   * 🇰🇷 한국어 인사이트 생성
   */
  private generateKoreanInsights(
    performance: any,
    reliability: any,
    efficiency: any,
    servers: ServerInstance[],
    clusters: ServerCluster[]
  ) {
    // 요약 생성
    const summary = this.generateSummary(performance, reliability, efficiency);

    // 주요 발견사항
    const keyFindings = this.generateKeyFindings(
      servers,
      clusters,
      performance,
      reliability
    );

    // 권장사항
    const recommendations = this.generateRecommendations(
      performance,
      reliability,
      efficiency
    );

    // 알림
    const alerts = this.generateAlerts(servers, performance);

    return {
      summary,
      keyFindings,
      recommendations,
      alerts,
    };
  }

  private generateSummary(
    performance: any,
    reliability: any,
    efficiency: any
  ): string {
    const avgScore = Math.round(
      (performance.score + reliability.score + efficiency.score) / 3
    );

    if (avgScore >= 80) {
      return `시스템이 우수한 상태입니다. 성능 ${performance.score}점, 신뢰성 ${reliability.score}점, 효율성 ${efficiency.score}점으로 안정적으로 운영되고 있습니다.`;
    } else if (avgScore >= 60) {
      return `시스템이 보통 상태입니다. 전체 점수 ${avgScore}점으로 일부 개선이 필요한 영역이 있습니다.`;
    } else {
      return `시스템에 주의가 필요합니다. 전체 점수 ${avgScore}점으로 성능 최적화가 시급합니다.`;
    }
  }

  private generateKeyFindings(
    servers: ServerInstance[],
    clusters: ServerCluster[],
    performance: any,
    reliability: any
  ): string[] {
    const findings: string[] = [];

    // 서버 상태
    const healthyCount = servers.filter(s => s.health.score > 80).length;
    findings.push(
      `전체 ${servers.length}대 서버 중 ${healthyCount}대가 정상 상태입니다.`
    );

    // 성능 병목
    if (performance.bottlenecks.length > 0) {
      findings.push(`주요 병목: ${performance.bottlenecks.join(', ')}`);
    }

    // 클러스터 정보
    if (clusters.length > 0) {
      findings.push(
        `${clusters.length}개 클러스터가 운영 중이며, 로드밸런싱이 활성화되어 있습니다.`
      );
    }

    // 장애 정보
    if (reliability.incidents > 0) {
      findings.push(`현재 ${reliability.incidents}건의 이슈가 감지되었습니다.`);
    }

    return findings;
  }

  private generateRecommendations(
    performance: any,
    reliability: any,
    efficiency: any
  ) {
    const recommendations: Array<{
      priority: 'low' | 'medium' | 'high';
      action: string;
      impact: string;
      effort: string;
    }> = [];

    // 성능 개선
    if (performance.score < 70) {
      if (performance.bottlenecks.includes('CPU 과부하')) {
        recommendations.push({
          priority: 'high' as const,
          action: 'CPU 집약적 작업 최적화 또는 서버 증설',
          impact: '응답시간 30-50% 개선 예상',
          effort: '중간 (1-2주)',
        });
      }

      if (performance.bottlenecks.includes('메모리 부족')) {
        recommendations.push({
          priority: 'high' as const,
          action: '메모리 증설 또는 캐시 최적화',
          impact: '시스템 안정성 및 성능 향상',
          effort: '낮음 (3-5일)',
        });
      }
    }

    // 효율성 개선
    if (efficiency.score < 60) {
      recommendations.push({
        priority: 'medium' as const,
        action: '리소스 사용률 최적화 및 오토스케일링 설정',
        impact: '운영 비용 20-30% 절감',
        effort: '중간 (1-2주)',
      });
    }

    // 신뢰성 개선
    if (reliability.score < 80) {
      recommendations.push({
        priority: 'high' as const,
        action: '모니터링 강화 및 자동 복구 시스템 구축',
        impact: '장애 시간 50% 단축',
        effort: '높음 (2-4주)',
      });
    }

    return recommendations;
  }

  private generateAlerts(servers: ServerInstance[], performance: any) {
    const alerts: Array<{
      level: 'critical' | 'warning' | 'info';
      message: string;
      affectedComponents: string[];
    }> = [];

    // 임계 상태 서버
    const criticalServers = servers.filter(s => s.health.score < 30);
    if (criticalServers.length > 0) {
      alerts.push({
        level: 'critical' as const,
        message: `${criticalServers.length}대 서버가 임계 상태입니다.`,
        affectedComponents: criticalServers.map(s => s.name),
      });
    }

    // 성능 경고
    if (performance.score < 50) {
      alerts.push({
        level: 'warning' as const,
        message: '시스템 성능이 기준치 이하입니다.',
        affectedComponents: ['전체 시스템'],
      });
    }

    // 리소스 부족 경고
    const highCpuServers = servers.filter(s => s.metrics.cpu > 85);
    if (highCpuServers.length > 0) {
      alerts.push({
        level: 'warning' as const,
        message: 'CPU 사용률이 높은 서버가 있습니다.',
        affectedComponents: highCpuServers.map(s => s.name),
      });
    }

    return alerts;
  }

  /**
   * 🤖 의도 분류 (한국어)
   */
  private classifyIntent(query: string): string {
    const normalizedQuery = query.toLowerCase();

    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      if (patterns.some(pattern => normalizedQuery.includes(pattern))) {
        return intent;
      }
    }

    return 'status'; // 기본값
  }

  /**
   * 📝 컨텍스트 추출
   */
  private extractContext(query: string) {
    const context: any = {};

    // 서버 ID 추출
    const serverMatch = query.match(/서버[^\s]*[0-9]+|server[^\s]*[0-9]+/gi);
    if (serverMatch) {
      context.serverIds = serverMatch;
    }

    // 시간 범위 추출
    if (query.includes('최근') || query.includes('지난')) {
      context.timeRange = 'recent';
    }

    return context;
  }

  /**
   * ⚡ 쿼리 실행
   */
  private async executeQuery(intent: string, context: any, query: string) {
    const servers = this.dataGenerator.getAllServers();
    const clusters = this.dataGenerator.getAllClusters();

    switch (intent) {
      case 'status':
        return this.getStatusData(servers, clusters);
      case 'performance':
        return this.getPerformanceData(servers);
      case 'issues':
        return this.getIssuesData(servers);
      case 'prediction':
        return this.getPredictionData(servers);
      case 'optimization':
        return this.getOptimizationData(servers);
      default:
        return this.getStatusData(servers, clusters);
    }
  }

  private getStatusData(servers: ServerInstance[], clusters: ServerCluster[]) {
    return {
      totalServers: servers.length,
      healthyServers: servers.filter(s => s.health.score > 80).length,
      clusters: clusters.length,
      avgHealth: Math.round(
        servers.reduce((sum, s) => sum + s.health.score, 0) / servers.length
      ),
    };
  }

  private getPerformanceData(servers: ServerInstance[]) {
    return {
      avgCpu: Math.round(
        servers.reduce((sum, s) => sum + s.metrics.cpu, 0) / servers.length
      ),
      avgMemory: Math.round(
        servers.reduce((sum, s) => sum + s.metrics.memory, 0) / servers.length
      ),
      avgRequests: Math.round(
        servers.reduce((sum, s) => sum + s.metrics.requests, 0) / servers.length
      ),
      topPerformers: servers
        .sort((a, b) => b.health.score - a.health.score)
        .slice(0, 3)
        .map(s => ({ name: s.name, score: s.health.score })),
    };
  }

  private getIssuesData(servers: ServerInstance[]) {
    const issueServers = servers.filter(s => s.health.issues.length > 0);
    return {
      totalIssues: issueServers.reduce(
        (sum, s) => sum + s.health.issues.length,
        0
      ),
      affectedServers: issueServers.length,
      criticalServers: servers.filter(s => s.health.score < 30).length,
      issues: issueServers.map(s => ({
        server: s.name,
        issues: s.health.issues,
      })),
    };
  }

  private getPredictionData(servers: ServerInstance[]) {
    // 간단한 예측 로직
    const trends = servers.map(s => {
      const cpuTrend = s.metrics.cpu > 70 ? 'increasing' : 'stable';
      const memoryTrend = s.metrics.memory > 80 ? 'increasing' : 'stable';
      return { server: s.name, cpu: cpuTrend, memory: memoryTrend };
    });

    return {
      trends,
      predictions: [
        '다음 1시간 내 CPU 사용률 추가 상승 예상',
        '메모리 사용률 안정적 유지 예상',
        '오류율 감소 추세 지속 예상',
      ],
    };
  }

  private getOptimizationData(servers: ServerInstance[]) {
    const underutilized = servers.filter(
      s => s.metrics.cpu < 30 && s.metrics.memory < 40
    );
    const overutilized = servers.filter(
      s => s.metrics.cpu > 80 || s.metrics.memory > 85
    );

    return {
      underutilized: underutilized.map(s => s.name),
      overutilized: overutilized.map(s => s.name),
      recommendations: [
        '저사용률 서버의 워크로드 통합 고려',
        '고사용률 서버의 부하 분산 검토',
        '자동 스케일링 정책 조정 필요',
      ],
    };
  }

  /**
   * 🇰🇷 한국어 응답 생성
   */
  private generateKoreanResponse(
    intent: string,
    data: any,
    query: string
  ): string {
    switch (intent) {
      case 'status':
        return (
          `현재 전체 ${data.totalServers}대 서버 중 ${data.healthyServers}대가 정상 상태입니다. ` +
          `평균 건강도는 ${data.avgHealth}점이며, ${data.clusters}개의 클러스터가 운영 중입니다.`
        );

      case 'performance':
        return (
          `시스템 성능 현황: CPU 평균 ${data.avgCpu}%, 메모리 평균 ${data.avgMemory}%, ` +
          `평균 요청 처리량 ${data.avgRequests}건/분입니다. ` +
          `최고 성능 서버는 ${data.topPerformers[0]?.name} (${data.topPerformers[0]?.score}점)입니다.`
        );

      case 'issues':
        return (
          `현재 ${data.totalIssues}건의 이슈가 ${data.affectedServers}대 서버에서 발생했습니다. ` +
          `${data.criticalServers}대 서버가 임계 상태입니다.`
        );

      case 'prediction':
        return `시스템 예측 분석 결과: ${data.predictions.join(', ')}`;

      case 'optimization':
        return (
          `최적화 권장사항: 저사용률 서버 ${data.underutilized.length}대, ` +
          `고사용률 서버 ${data.overutilized.length}대 발견. ${data.recommendations[0]}`
        );

      default:
        return '요청하신 정보를 분석 중입니다. 좀 더 구체적인 질문을 해주시면 더 정확한 답변을 드릴 수 있습니다.';
    }
  }

  /**
   * 💡 제안사항 생성
   */
  private generateSuggestions(intent: string, data: any): string[] {
    const suggestions: string[] = [];

    switch (intent) {
      case 'status':
        suggestions.push('서버별 상세 성능 확인하기');
        suggestions.push('클러스터 부하 분산 상태 보기');
        break;
      case 'performance':
        suggestions.push('성능 병목 지점 분석하기');
        suggestions.push('리소스 사용률 최적화 방안');
        break;
      case 'issues':
        suggestions.push('이슈 해결 우선순위 확인');
        suggestions.push('자동 복구 설정 검토');
        break;
    }

    return suggestions;
  }

  /**
   * 🎯 신뢰도 계산
   */
  private calculateConfidence(intent: string, context: any): number {
    let confidence = 0.7; // 기본 신뢰도

    // 컨텍스트가 명확할수록 신뢰도 증가
    if (context.serverIds) confidence += 0.1;
    if (context.timeRange) confidence += 0.1;

    return Math.min(1.0, confidence);
  }

  /**
   * 📊 상관관계 계산
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * 📈 상세 분석 데이터 생성
   */
  private getServerAnalysisDetails(servers: ServerInstance[]) {
    return servers.reduce(
      (acc, server) => {
        acc[server.id] = {
          performance: (100 - server.metrics.cpu - server.metrics.memory) / 2,
          efficiency: server.metrics.requests / Math.max(1, server.metrics.cpu),
          stability: server.health.score,
          issues: server.health.issues.length,
        };
        return acc;
      },
      {} as Record<string, any>
    );
  }

  private getClusterAnalysisDetails(clusters: ServerCluster[]) {
    return clusters.reduce(
      (acc, cluster) => {
        acc[cluster.id] = {
          loadBalancing: cluster.loadBalancer.algorithm,
          activeConnections: cluster.loadBalancer.activeConnections,
          scalingStatus: `${cluster.scaling.current}/${cluster.scaling.max}`,
          efficiency:
            cluster.loadBalancer.totalRequests / cluster.servers.length,
        };
        return acc;
      },
      {} as Record<string, any>
    );
  }

  private getApplicationAnalysisDetails(applications: ApplicationMetrics[]) {
    return applications.reduce(
      (acc, app) => {
        acc[app.name] = {
          availability: app.performance.availability,
          responseTime: app.performance.responseTime,
          costEfficiency: app.performance.throughput / app.resources.cost,
          healthScore:
            (app.deployments.production.health +
              app.deployments.staging.health +
              app.deployments.development.health) /
            3,
        };
        return acc;
      },
      {} as Record<string, any>
    );
  }

  /**
   * 💾 분석 결과 캐싱
   */
  public async cacheAnalysis(result: EnhancedAnalysisResult): Promise<void> {
    try {
      const key = `analysis:${result.scope}:${Date.now()}`;
      await this.redis.set(key, JSON.stringify(result), { ex: 3600 }); // 1시간 캐시
    } catch (error) {
      console.warn('분석 결과 캐싱 실패:', error);
    }
  }
}

export default EnhancedDataAnalyzer;
