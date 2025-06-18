/**
 * 🧠 지능형 모니터링 서비스 (Intelligent Monitoring Service)
 *
 * 3단계 통합 AI 분석 워크플로우:
 * 1단계: 🚨 실시간 이상 탐지 (AnomalyDetection.ts 활용)
 * 2단계: 🔍 다중 AI 근본 원인 분석 (여러 AI 엔진 협업)
 * 3단계: 🔮 예측적 모니터링 (PredictiveAnalysisEngine.ts 활용)
 */

import { AnomalyDetection } from './AnomalyDetection';
import { PredictiveAnalysisEngine } from '../../engines/PredictiveAnalysisEngine';
import { incidentReportService } from './IncidentReportService';
import { GoogleAIService } from './GoogleAIService';
import { koreanAIEngine } from './korean-ai-engine';
import { aiLogger, LogCategory } from './logging/AILogger';

// 타입 정의
export interface IntelligentAnalysisRequest {
  serverId?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  analysisDepth: 'quick' | 'standard' | 'deep';
  includeSteps: {
    anomalyDetection: boolean;
    rootCauseAnalysis: boolean;
    predictiveMonitoring: boolean;
  };
}

export interface IntelligentAnalysisResult {
  analysisId: string;
  timestamp: Date;
  request: IntelligentAnalysisRequest;

  // 1단계: 이상 탐지 결과
  anomalyDetection: {
    status: 'completed' | 'failed' | 'skipped';
    anomalies: any[];
    summary: string;
    confidence: number;
    processingTime: number;
  };

  // 2단계: 근본 원인 분석 결과
  rootCauseAnalysis: {
    status: 'completed' | 'failed' | 'skipped';
    causes: RootCause[];
    aiInsights: AIInsight[];
    summary: string;
    confidence: number;
    processingTime: number;
  };

  // 3단계: 예측적 모니터링 결과
  predictiveMonitoring: {
    status: 'completed' | 'failed' | 'skipped';
    predictions: any[];
    recommendations: string[];
    summary: string;
    confidence: number;
    processingTime: number;
  };

  // 통합 결과
  overallResult: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    actionRequired: boolean;
    priorityActions: string[];
    summary: string;
    confidence: number;
    totalProcessingTime: number;
  };
}

export interface RootCause {
  id: string;
  category:
    | 'system'
    | 'application'
    | 'network'
    | 'infrastructure'
    | 'external';
  description: string;
  probability: number;
  evidence: string[];
  aiEngine: string;
  recommendations: string[];
}

export interface AIInsight {
  engine: string;
  insight: string;
  confidence: number;
  supportingData: any;
}

export class IntelligentMonitoringService {
  private static instance: IntelligentMonitoringService;

  // AI 엔진 인스턴스들
  private anomalyDetection: AnomalyDetection;
  private predictiveEngine: PredictiveAnalysisEngine;
  private incidentService: typeof incidentReportService;
  private googleAI: GoogleAIService;
  private koreanAI: typeof koreanAIEngine;

  // 분석 상태 관리
  private activeAnalyses: Map<
    string,
    {
      status: 'running' | 'completed' | 'failed';
      progress: number;
      currentStep: string;
      startTime: Date;
    }
  > = new Map();

  private constructor() {
    this.anomalyDetection = AnomalyDetection.getInstance();
    this.predictiveEngine = new PredictiveAnalysisEngine();
    this.incidentService = incidentReportService;
    this.googleAI = new GoogleAIService();
    this.koreanAI = koreanAIEngine;
  }

  static getInstance(): IntelligentMonitoringService {
    if (!this.instance) {
      this.instance = new IntelligentMonitoringService();
    }
    return this.instance;
  }

  /**
   * 🎯 지능형 모니터링 분석 실행 (메인 함수)
   */
  async runIntelligentAnalysis(
    request: IntelligentAnalysisRequest
  ): Promise<IntelligentAnalysisResult> {
    const analysisId = this.generateAnalysisId();
    const startTime = new Date();

    aiLogger.info(
      LogCategory.AI_ENGINE,
      `🧠 지능형 모니터링 분석 시작: ${analysisId}`,
      { analysisId, request }
    );

    // 분석 상태 초기화
    this.activeAnalyses.set(analysisId, {
      status: 'running',
      progress: 0,
      currentStep: '초기화',
      startTime,
    });

    const result: IntelligentAnalysisResult = {
      analysisId,
      timestamp: startTime,
      request,
      anomalyDetection: {
        status: 'skipped',
        anomalies: [],
        summary: '',
        confidence: 0,
        processingTime: 0,
      },
      rootCauseAnalysis: {
        status: 'skipped',
        causes: [],
        aiInsights: [],
        summary: '',
        confidence: 0,
        processingTime: 0,
      },
      predictiveMonitoring: {
        status: 'skipped',
        predictions: [],
        recommendations: [],
        summary: '',
        confidence: 0,
        processingTime: 0,
      },
      overallResult: {
        severity: 'low',
        actionRequired: false,
        priorityActions: [],
        summary: '',
        confidence: 0,
        totalProcessingTime: 0,
      },
    };

    try {
      // 1단계: 이상 탐지
      if (request.includeSteps.anomalyDetection) {
        this.updateAnalysisProgress(analysisId, 10, '이상 탐지 실행 중');
        result.anomalyDetection = await this.runAnomalyDetection(request);
      }

      // 2단계: 근본 원인 분석
      if (request.includeSteps.rootCauseAnalysis) {
        this.updateAnalysisProgress(analysisId, 50, '근본 원인 분석 실행 중');
        result.rootCauseAnalysis = await this.runRootCauseAnalysis(
          request,
          result.anomalyDetection.anomalies
        );
      }

      // 3단계: 예측적 모니터링
      if (request.includeSteps.predictiveMonitoring) {
        this.updateAnalysisProgress(analysisId, 80, '예측적 모니터링 실행 중');
        result.predictiveMonitoring =
          await this.runPredictiveMonitoring(request);
      }

      // 통합 결과 생성
      this.updateAnalysisProgress(analysisId, 95, '통합 결과 생성 중');
      result.overallResult = await this.generateOverallResult(result);

      // 분석 완료
      result.overallResult.totalProcessingTime =
        Date.now() - startTime.getTime();
      this.updateAnalysisProgress(analysisId, 100, '분석 완료');

      this.activeAnalyses.set(analysisId, {
        status: 'completed',
        progress: 100,
        currentStep: '완료',
        startTime,
      });

      aiLogger.info(
        LogCategory.AI_ENGINE,
        `✅ 지능형 모니터링 분석 완료: ${analysisId}`,
        {
          analysisId,
          totalTime: result.overallResult.totalProcessingTime,
          severity: result.overallResult.severity,
        }
      );

      return result;
    } catch (error: any) {
      this.activeAnalyses.set(analysisId, {
        status: 'failed',
        progress: 0,
        currentStep: '오류 발생',
        startTime,
      });

      aiLogger.logError(
        'IntelligentMonitoringService',
        LogCategory.AI_ENGINE,
        error,
        { analysisId },
        analysisId
      );

      throw error;
    }
  }

  /**
   * 🚨 1단계: 이상 탐지 실행
   */
  private async runAnomalyDetection(
    request: IntelligentAnalysisRequest
  ): Promise<any> {
    const stepStartTime = Date.now();

    try {
      // 서버 메트릭 데이터 수집
      const serverMetrics = await this.collectServerMetrics(request.serverId);

      // 이상 탐지 실행
      const anomalies =
        await this.anomalyDetection.detectAnomalies(serverMetrics);

      // 결과 요약 생성
      const summary = this.generateAnomalyDetectionSummary(anomalies);
      const confidence = this.calculateAnomalyConfidence(anomalies);

      return {
        status: 'completed',
        anomalies,
        summary,
        confidence,
        processingTime: Date.now() - stepStartTime,
      };
    } catch (error) {
      console.error('이상 탐지 실행 실패:', error);
      return {
        status: 'failed',
        anomalies: [],
        summary: '이상 탐지 실행 중 오류가 발생했습니다.',
        confidence: 0,
        processingTime: Date.now() - stepStartTime,
      };
    }
  }

  /**
   * 🔍 2단계: 근본 원인 분석 (다중 AI 엔진 + 폴백)
   */
  private async runRootCauseAnalysis(
    request: IntelligentAnalysisRequest,
    anomalies: any[]
  ): Promise<any> {
    const startTime = Date.now();
    const insights: AIInsight[] = [];
    let causes: RootCause[] = [];

    try {
      // 기본 규칙 기반 분석 (항상 실행)
      const basicResult = await this.runBasicRootCauseAnalysis(anomalies);
      causes = [...basicResult.causes];

      // AI 엔진들을 순차적으로 시도 (폴백 방식)
      const aiEngines = [
        { name: 'KoreanAI', method: this.runKoreanAIAnalysis.bind(this) },
        { name: 'GoogleAI', method: this.runGoogleAIAnalysis.bind(this) },
        { name: 'LocalAI', method: this.runLocalAIAnalysis.bind(this) },
      ];

      for (const engine of aiEngines) {
        try {
          const insight = await engine.method(anomalies, request);
          insights.push(insight);

          // 하나라도 성공하면 충분한 분석 데이터 확보
          if (insights.length >= 1) {
            break;
          }
        } catch (error) {
          console.warn(`${engine.name} 분석 실패, 다음 엔진으로 폴백:`, error);
          continue;
        }
      }

      // AI 인사이트가 있으면 추가 원인 생성
      if (insights.length > 0) {
        const aiCauses = this.convertInsightsToCauses(insights);
        causes = [...causes, ...aiCauses];
      }

      // 원인들을 우선순위로 정렬
      causes = this.prioritizeRootCauses(causes);

      return {
        status: 'completed' as const,
        causes: causes.slice(0, 5), // 상위 5개만 반환
        aiInsights: insights,
        summary: this.generateRootCauseSummary(causes, insights),
        confidence: this.calculateRootCauseConfidence(causes, insights),
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error('근본 원인 분석 실패:', error);

      // 완전 폴백: 기본 분석만으로도 결과 제공
      return {
        status: 'completed' as const,
        causes:
          causes.length > 0 ? causes : this.generateFallbackCauses(anomalies),
        aiInsights: [],
        summary:
          '기본 규칙 기반 분석 결과입니다. AI 엔진 연결에 문제가 있어 제한된 분석을 제공합니다.',
        confidence: 0.6,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 🤖 로컬 AI 분석 (Google AI 대안)
   */
  private async runLocalAIAnalysis(
    anomalies: any[],
    request: IntelligentAnalysisRequest
  ): Promise<AIInsight> {
    // 로컬 규칙 기반 AI 분석
    const patterns = this.analyzeAnomalyPatterns(anomalies);
    const insights = this.generateLocalInsights(patterns, request);

    return {
      engine: 'LocalAI',
      insight: insights,
      confidence: 0.75,
      supportingData: { patterns, anomalies },
    };
  }

  /**
   * 📊 이상 징후 패턴 분석
   */
  private analyzeAnomalyPatterns(anomalies: any[]): any {
    const patterns = {
      cpuSpikes: anomalies.filter(a => a.metric?.includes('cpu')).length,
      memoryLeaks: anomalies.filter(a => a.metric?.includes('memory')).length,
      networkIssues: anomalies.filter(a => a.metric?.includes('network'))
        .length,
      diskIssues: anomalies.filter(a => a.metric?.includes('disk')).length,
      responseTimeIssues: anomalies.filter(a => a.metric?.includes('response'))
        .length,
      timeDistribution: this.analyzeTimeDistribution(anomalies),
      severityDistribution: this.analyzeSeverityDistribution(anomalies),
    };

    return patterns;
  }

  /**
   * 🧠 로컬 인사이트 생성
   */
  private generateLocalInsights(
    patterns: any,
    request: IntelligentAnalysisRequest
  ): string {
    const insights = [];

    // CPU 관련 분석
    if (patterns.cpuSpikes > 0) {
      insights.push(
        `CPU 사용률 급증이 ${patterns.cpuSpikes}회 감지되었습니다. 프로세스 최적화나 스케일링을 고려하세요.`
      );
    }

    // 메모리 관련 분석
    if (patterns.memoryLeaks > 0) {
      insights.push(
        `메모리 사용량 이상이 ${patterns.memoryLeaks}회 발생했습니다. 메모리 누수 가능성을 점검하세요.`
      );
    }

    // 네트워크 관련 분석
    if (patterns.networkIssues > 0) {
      insights.push(
        `네트워크 관련 문제가 ${patterns.networkIssues}회 확인되었습니다. 네트워크 인프라를 점검하세요.`
      );
    }

    // 패턴 기반 종합 분석
    if (patterns.cpuSpikes > 2 && patterns.memoryLeaks > 2) {
      insights.push(
        'CPU와 메모리 동시 이상은 일반적으로 애플리케이션 성능 문제를 나타냅니다.'
      );
    }

    if (patterns.networkIssues > 1 && patterns.responseTimeIssues > 1) {
      insights.push(
        '네트워크와 응답시간 문제가 함께 발생하면 외부 의존성 문제일 가능성이 높습니다.'
      );
    }

    // 분석 깊이에 따른 추가 인사이트
    if (request.analysisDepth === 'deep') {
      insights.push(
        `시간대별 분석: ${JSON.stringify(patterns.timeDistribution)}`
      );
      insights.push(
        `심각도별 분포: ${JSON.stringify(patterns.severityDistribution)}`
      );
    }

    return insights.length > 0
      ? insights.join(' ')
      : '현재 데이터로는 명확한 패턴을 식별하기 어렵습니다. 추가 모니터링이 필요합니다.';
  }

  /**
   * 📅 시간 분포 분석
   */
  private analyzeTimeDistribution(anomalies: any[]): any {
    const hours = anomalies.map(a =>
      new Date(a.timestamp || Date.now()).getHours()
    );
    const distribution: { [key: string]: number } = {};

    hours.forEach(hour => {
      const period =
        hour < 6 ? '새벽' : hour < 12 ? '오전' : hour < 18 ? '오후' : '저녁';
      distribution[period] = (distribution[period] || 0) + 1;
    });

    return distribution;
  }

  /**
   * 📊 심각도 분포 분석
   */
  private analyzeSeverityDistribution(anomalies: any[]): any {
    const distribution: { [key: string]: number } = {};

    anomalies.forEach(a => {
      const severity = a.severity || 'medium';
      distribution[severity] = (distribution[severity] || 0) + 1;
    });

    return distribution;
  }

  /**
   * 🔄 폴백 원인 생성 (완전 오프라인 모드)
   */
  private generateFallbackCauses(anomalies: any[]): RootCause[] {
    const fallbackCauses: RootCause[] = [
      {
        id: 'fallback_system_load',
        category: 'system',
        description: '시스템 부하 증가로 인한 성능 저하',
        probability: 0.7,
        evidence: ['다수의 시스템 메트릭 이상 감지'],
        aiEngine: 'FallbackAnalysis',
        recommendations: [
          '시스템 리소스 모니터링 강화',
          '부하 분산 설정 검토',
          '불필요한 프로세스 정리',
        ],
      },
      {
        id: 'fallback_network_latency',
        category: 'network',
        description: '네트워크 지연으로 인한 응답 시간 증가',
        probability: 0.6,
        evidence: ['응답 시간 관련 메트릭 이상'],
        aiEngine: 'FallbackAnalysis',
        recommendations: [
          '네트워크 연결 상태 점검',
          'CDN 설정 최적화',
          '외부 API 의존성 검토',
        ],
      },
      {
        id: 'fallback_resource_exhaustion',
        category: 'infrastructure',
        description: '시스템 리소스 고갈 위험',
        probability: 0.5,
        evidence: ['리소스 사용률 임계치 근접'],
        aiEngine: 'FallbackAnalysis',
        recommendations: [
          '용량 계획 수립',
          '자동 스케일링 설정',
          '리소스 사용 최적화',
        ],
      },
    ];

    return fallbackCauses;
  }

  /**
   * 🔧 헬퍼 메서드들
   */
  private generateAnalysisId(): string {
    return `IM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateAnalysisProgress(
    analysisId: string,
    progress: number,
    step: string
  ): void {
    const analysis = this.activeAnalyses.get(analysisId);
    if (analysis) {
      analysis.progress = progress;
      analysis.currentStep = step;
    }
  }

  private async collectServerMetrics(serverId?: string): Promise<any[]> {
    // 실제 서버 메트릭 수집 로직
    // 현재는 목업 데이터 반환
    return [
      {
        id: serverId || 'web-server-01',
        hostname: 'web-server-01.example.com',
        cpu_usage: 75,
        memory_usage: 82,
        disk_usage: 65,
        response_time: 250,
        status: 'running',
        uptime: 95.8,
        timestamp: new Date().toISOString(),
      },
    ];
  }

  private generateAnomalyDetectionSummary(anomalies: any[]): string {
    if (anomalies.length === 0) {
      return '현재 시스템에서 이상 징후가 감지되지 않았습니다.';
    }

    const criticalCount = anomalies.filter(
      a => a.severity === 'critical'
    ).length;
    const highCount = anomalies.filter(a => a.severity === 'high').length;

    return `총 ${anomalies.length}개의 이상 징후가 감지되었습니다. (위험: ${criticalCount}개, 높음: ${highCount}개)`;
  }

  private calculateAnomalyConfidence(anomalies: any[]): number {
    if (anomalies.length === 0) return 0.95;

    const avgConfidence =
      anomalies.reduce((sum, a) => sum + (a.confidence || 0.8), 0) /
      anomalies.length;
    return Math.round(avgConfidence * 100) / 100;
  }

  private async runBasicRootCauseAnalysis(
    anomalies: any[]
  ): Promise<{ causes: RootCause[] }> {
    const causes: RootCause[] = [];

    // 이상 징후를 근본 원인으로 변환
    anomalies.forEach((anomaly, index) => {
      causes.push({
        id: `basic_cause_${index}`,
        category: this.mapMetricToCategory(anomaly.metric),
        description: `${anomaly.description}로 인한 시스템 성능 저하`,
        probability: anomaly.confidence || 0.7,
        evidence: [anomaly.description],
        aiEngine: 'BasicAnalysis',
        recommendations: anomaly.recommendations || [],
      });
    });

    return { causes };
  }

  private async runGoogleAIAnalysis(
    anomalies: any[],
    request: IntelligentAnalysisRequest
  ): Promise<AIInsight> {
    const prompt = `다음 시스템 이상 징후를 분석하여 근본 원인을 추정해주세요:
${JSON.stringify(anomalies.slice(0, 3), null, 2)}

분석 요청 정보:
- 서버 ID: ${request.serverId || '전체 시스템'}
- 분석 깊이: ${request.analysisDepth}

근본 원인과 권장사항을 제공해주세요.`;

    try {
      // Google AI 사용 가능성 체크
      if (!this.googleAI || !this.isGoogleAIAvailable()) {
        throw new Error('Google AI 서비스를 사용할 수 없습니다.');
      }

      const response = await this.googleAI.generateContent(prompt);
      return {
        engine: 'GoogleAI',
        insight: response.content || '분석 결과를 생성하지 못했습니다.',
        confidence: 0.85,
        supportingData: { anomalies, request },
      };
    } catch (error: any) {
      // Google AI 실패 시 에러를 다시 던져서 다음 엔진으로 폴백
      throw new Error(`Google AI 분석 실패: ${error.message}`);
    }
  }

  private isGoogleAIAvailable(): boolean {
    try {
      // Google AI 서비스 상태 확인
      return (
        this.googleAI && typeof this.googleAI.generateContent === 'function'
      );
    } catch {
      return false;
    }
  }

  private async runKoreanAIAnalysis(
    anomalies: any[],
    request: IntelligentAnalysisRequest
  ): Promise<AIInsight> {
    const query = `시스템에서 ${anomalies.length}개의 이상 징후가 발견되었습니다. 
주요 문제: ${anomalies
      .slice(0, 2)
      .map(a => a.description)
      .join(', ')}
근본 원인을 분석하고 해결 방안을 제시해주세요.`;

    try {
      const response = await this.koreanAI.processQuery(query, {
        anomalies: anomalies.slice(0, 3), // 데이터 크기 제한
        request,
      });

      return {
        engine: 'KoreanAI',
        insight:
          response.response?.message ||
          response.fallback ||
          '한국어 AI 분석 결과를 생성할 수 없습니다.',
        confidence: response.understanding?.confidence || 0.7,
        supportingData: response.analysis || {},
      };
    } catch (error: any) {
      // Korean AI 실패 시 에러를 다시 던져서 다음 엔진으로 폴백
      throw new Error(`Korean AI 분석 실패: ${error.message}`);
    }
  }

  private convertInsightsToCauses(insights: AIInsight[]): RootCause[] {
    return insights.map((insight, index) => ({
      id: `ai_cause_${insight.engine}_${index}`,
      category: 'system',
      description: insight.insight.substring(0, 200) + '...',
      probability: insight.confidence,
      evidence: [insight.insight],
      aiEngine: insight.engine,
      recommendations: [`${insight.engine} 권장사항 확인 필요`],
    }));
  }

  private prioritizeRootCauses(causes: RootCause[]): RootCause[] {
    return causes.sort((a, b) => b.probability - a.probability);
  }

  private generateRootCauseSummary(
    causes: RootCause[],
    insights: AIInsight[]
  ): string {
    if (causes.length === 0) {
      return '명확한 근본 원인을 식별하지 못했습니다.';
    }

    const topCause = causes[0];
    const aiEngineCount = new Set(insights.map(i => i.engine)).size;

    return `${aiEngineCount}개 AI 엔진 분석 결과, 가장 가능성 높은 원인: ${topCause.description} (확률: ${Math.round(topCause.probability * 100)}%)`;
  }

  private calculateRootCauseConfidence(
    causes: RootCause[],
    insights: AIInsight[]
  ): number {
    if (causes.length === 0) return 0.3;

    const avgCauseConfidence =
      causes.reduce((sum, c) => sum + c.probability, 0) / causes.length;
    const avgInsightConfidence =
      insights.reduce((sum, i) => sum + i.confidence, 0) /
      (insights.length || 1);

    return (
      Math.round(((avgCauseConfidence + avgInsightConfidence) / 2) * 100) / 100
    );
  }

  private async runPredictiveMonitoring(
    request: IntelligentAnalysisRequest
  ): Promise<any> {
    const stepStartTime = Date.now();

    try {
      const predictions: any[] = [];
      const recommendations: string[] = [];

      // 서버별 장애 예측
      if (request.serverId) {
        const prediction = await this.predictiveEngine.predictFailure(
          request.serverId
        );
        if (prediction) {
          predictions.push(prediction);
          recommendations.push(...prediction.preventiveActions);
        }
      } else {
        // 전체 시스템 예측 (여러 서버)
        const systemPredictions = await this.runSystemWidePrediction();
        predictions.push(...systemPredictions);

        // 시스템 레벨 권장사항 생성
        const systemRecommendations =
          this.generateSystemRecommendations(systemPredictions);
        recommendations.push(...systemRecommendations);
      }

      const summary = this.generatePredictiveSummary(
        predictions,
        recommendations
      );
      const confidence = this.calculatePredictiveConfidence(predictions);

      return {
        status: 'completed',
        predictions,
        recommendations,
        summary,
        confidence,
        processingTime: Date.now() - stepStartTime,
      };
    } catch (error) {
      console.error('예측적 모니터링 실행 실패:', error);
      return {
        status: 'failed',
        predictions: [],
        recommendations: [],
        summary: '예측적 모니터링 실행 중 오류가 발생했습니다.',
        confidence: 0,
        processingTime: Date.now() - stepStartTime,
      };
    }
  }

  private async runSystemWidePrediction(): Promise<any[]> {
    // 시스템 전체 예측 로직 (간단한 구현)
    const serverIds = ['web-server-01', 'web-server-02', 'db-server-01'];
    const predictions = [];

    for (const serverId of serverIds) {
      try {
        const prediction = await this.predictiveEngine.predictFailure(serverId);
        if (prediction) {
          predictions.push(prediction);
        }
      } catch (error) {
        console.warn(`서버 ${serverId} 예측 실패:`, error);
      }
    }

    return predictions;
  }

  private generateSystemRecommendations(predictions: any[]): string[] {
    const recommendations = [];
    const highRiskServers = predictions.filter(p => p.failureProbability > 70);

    if (highRiskServers.length > 0) {
      recommendations.push(
        '🚨 고위험 서버들에 대한 즉시 점검 및 예방 조치 필요'
      );
      recommendations.push('⚡ 로드 밸런싱 재구성으로 부하 분산');
    }

    if (predictions.length > 2) {
      recommendations.push('📊 시스템 전반적 용량 계획 검토');
    }

    return recommendations;
  }

  private generatePredictiveSummary(
    predictions: any[],
    recommendations: string[]
  ): string {
    if (predictions.length === 0) {
      return '예측 분석을 위한 충분한 데이터가 없습니다.';
    }

    const avgRisk =
      predictions.reduce((sum, p) => sum + (p.failureProbability || 0), 0) /
      predictions.length;
    const highRiskCount = predictions.filter(
      p => p.failureProbability > 70
    ).length;

    return `${predictions.length}개 서버 분석 결과, 평균 장애 위험도: ${Math.round(avgRisk)}%, 고위험 서버: ${highRiskCount}개`;
  }

  private calculatePredictiveConfidence(predictions: any[]): number {
    if (predictions.length === 0) return 0.5;

    const avgConfidence =
      predictions.reduce((sum, p) => sum + (p.confidence || 0.8), 0) /
      predictions.length;
    return Math.round(avgConfidence * 100) / 100;
  }

  private async generateOverallResult(
    result: IntelligentAnalysisResult
  ): Promise<any> {
    const anomalyCount = result.anomalyDetection.anomalies?.length || 0;
    const criticalCauses =
      result.rootCauseAnalysis.causes?.filter(c => c.probability > 0.7)
        .length || 0;
    const highRiskPredictions =
      result.predictiveMonitoring.predictions?.filter(
        p => p.failureProbability > 70
      ).length || 0;

    // 심각도 계산
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (highRiskPredictions > 0 || criticalCauses > 2) {
      severity = 'critical';
    } else if (anomalyCount > 3 || criticalCauses > 0) {
      severity = 'high';
    } else if (anomalyCount > 1) {
      severity = 'medium';
    }

    // 조치 필요 여부
    const actionRequired = severity === 'critical' || severity === 'high';

    // 우선순위 조치 사항
    const priorityActions: string[] = [];

    if (highRiskPredictions > 0) {
      priorityActions.push('🚨 장애 위험 서버 즉시 점검 필요');
    }

    if (criticalCauses > 0) {
      priorityActions.push('🔍 근본 원인 해결 조치 실행');
    }

    if (anomalyCount > 3) {
      priorityActions.push('📊 시스템 전반적 성능 점검');
    }

    // 통합 요약 생성
    const summary = await this.generateIntegratedSummary(result, severity);

    // 전체 신뢰도 계산
    const totalConfidence =
      (result.anomalyDetection.confidence +
        result.rootCauseAnalysis.confidence +
        result.predictiveMonitoring.confidence) /
      3;

    return {
      severity,
      actionRequired,
      priorityActions,
      summary,
      confidence: Math.round(totalConfidence * 100) / 100,
      totalProcessingTime: 0, // 호출자에서 설정
    };
  }

  private async generateIntegratedSummary(
    result: IntelligentAnalysisResult,
    severity: string
  ): Promise<string> {
    const parts = [];

    if (result.anomalyDetection.status === 'completed') {
      parts.push(result.anomalyDetection.summary);
    }

    if (result.rootCauseAnalysis.status === 'completed') {
      parts.push(result.rootCauseAnalysis.summary);
    }

    if (result.predictiveMonitoring.status === 'completed') {
      parts.push(result.predictiveMonitoring.summary);
    }

    const summary = parts.join(' ');
    return `[${severity.toUpperCase()}] ${summary}`;
  }

  private mapMetricToCategory(
    metric: string
  ): 'system' | 'application' | 'network' | 'infrastructure' | 'external' {
    if (
      metric.includes('cpu') ||
      metric.includes('memory') ||
      metric.includes('disk')
    ) {
      return 'system';
    } else if (metric.includes('network') || metric.includes('response_time')) {
      return 'network';
    } else {
      return 'application';
    }
  }

  /**
   * 📊 분석 상태 조회
   */
  getAnalysisStatus(analysisId: string) {
    return this.activeAnalyses.get(analysisId);
  }

  /**
   * 📋 활성 분석 목록 조회
   */
  getActiveAnalyses() {
    return Array.from(this.activeAnalyses.entries()).map(([id, status]) => ({
      analysisId: id,
      ...status,
    }));
  }
}
