/**
 * MCP 모니터링을 위한 AI 기반 지능형 알림 시스템
 *
 * 주요 기능:
 * - 임계값 기반 자동 알림
 * - 컨텍스트 인식 알림 우선순위
 * - 중복 알림 방지 및 그룹화
 * - 적응형 알림 빈도 조절
 */

import type {
  MCPServerMetrics,
  MonitoringEvent,
  MCPServerName,
  AlertRule,
} from '../mcp-monitor/types';
import type { AnomalyDetectionResult } from './ai-anomaly-detector';
import type { PredictionResult } from './performance-predictor';
import { getErrorMessage } from '../../types/type-utils';

/**
 * 지능형 알림
 */
export interface IntelligentAlert {
  id: string;
  serverId: MCPServerName;
  type: 'anomaly' | 'threshold' | 'prediction' | 'system' | 'composite';
  severity: 'info' | 'warning' | 'error' | 'critical';
  priority: number; // 1-10 (높을수록 우선순위 높음)
  title: string;
  description: string;
  timestamp: number;

  // AI 분석 결과
  aiInsights: {
    rootCause: string[];
    impactAssessment: {
      severity: number; // 0-1
      scope: 'single_server' | 'multiple_servers' | 'system_wide';
      duration: 'short_term' | 'medium_term' | 'long_term';
    };
    confidence: number; // 0-1
    similarIncidents: {
      count: number;
      averageResolutionTime: number;
      commonSolutions: string[];
    };
  };

  // 권장 액션
  recommendedActions: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    automated?: {
      action: string;
      confidence: number;
      risk: 'low' | 'medium' | 'high';
    };
  };

  // 알림 메타데이터
  metadata: {
    sourceData: (
      | AnomalyDetectionResult
      | PredictionResult
      | MCPServerMetrics
    )[];
    correlatedAlerts: string[];
    suppressionRules: string[];
    escalationPath: string[];
  };

  // 상태 추적
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
  acknowledgedBy?: string;
  resolvedAt?: number;
  resolution?: string;
}

/**
 * 알림 필터 설정
 */
interface AlertFilter {
  serverId?: MCPServerName;
  severity?: IntelligentAlert['severity'][];
  type?: IntelligentAlert['type'][];
  minPriority?: number;
  timeRange?: {
    start: number;
    end: number;
  };
  keywords?: string[];
}

/**
 * 알림 그룹화 설정
 */
interface AlertGrouping {
  strategy: 'by_server' | 'by_type' | 'by_root_cause' | 'by_time_window';
  windowSize: number; // milliseconds
  maxGroupSize: number;
  mergeThreshold: number; // similarity threshold 0-1
}

/**
 * 적응형 임계값 설정
 */
interface AdaptiveAlertThresholds {
  serverId: MCPServerName;
  metric: keyof MCPServerMetrics;
  baselineValue: number;
  dynamicThreshold: {
    lower: number;
    upper: number;
    adaptationRate: number;
  };
  suppressionPeriod: number; // ms
  escalationMultiplier: number;
  lastUpdated: number;
}

/**
 * AI 기반 지능형 알림 시스템
 */
export class IntelligentAlertingSystem {
  private static instance: IntelligentAlertingSystem;

  // 활성 알림
  private activeAlerts: Map<string, IntelligentAlert> = new Map();

  // 알림 기록 (최근 7일)
  private alertHistory: IntelligentAlert[] = [];

  // 적응형 임계값
  private adaptiveThresholds: Map<string, AdaptiveAlertThresholds> = new Map();

  // 억제 규칙
  private suppressionRules: Map<string, { until: number; reason: string }> =
    new Map();

  // 상관관계 매트릭스
  private correlationMatrix: Map<string, Map<string, number>> = new Map();

  // 설정값
  private readonly config = {
    // 기록 보관 기간 (7일)
    retentionPeriod: 7 * 24 * 60 * 60 * 1000,

    // 최대 활성 알림 수
    maxActiveAlerts: 100,

    // 그룹화 윈도우 (15분)
    groupingWindow: 15 * 60 * 1000,

    // 중복 방지 윈도우 (5분)
    deduplicationWindow: 5 * 60 * 1000,

    // 자동 해결 타임아웃 (24시간)
    autoResolveTimeout: 24 * 60 * 60 * 1000,

    // 우선순위 계산 가중치
    priorityWeights: {
      severity: 0.4,
      confidence: 0.2,
      impact: 0.2,
      urgency: 0.2,
    },

    // AI 분석 설정
    aiAnalysis: {
      minConfidence: 0.3,
      rootCauseDepth: 3,
      similarityThreshold: 0.7,
    },
  };

  private constructor() {
    this.startPeriodicMaintenance();
  }

  public static getInstance(): IntelligentAlertingSystem {
    if (!IntelligentAlertingSystem.instance) {
      IntelligentAlertingSystem.instance = new IntelligentAlertingSystem();
    }
    return IntelligentAlertingSystem.instance;
  }

  /**
   * 🚨 이상 징후 기반 알림 생성
   */
  public async generateAnomalyAlert(
    anomaly: AnomalyDetectionResult
  ): Promise<IntelligentAlert | null> {
    try {
      // 중복 확인
      if (
        this.isDuplicateAlert('anomaly', anomaly.serverId, anomaly.anomalyType)
      ) {
        return null;
      }

      // AI 인사이트 생성
      const aiInsights = await this.generateAIInsights([anomaly]);

      // 권장 액션 생성
      const recommendedActions = this.generateRecommendedActions(anomaly);

      // 우선순위 계산
      const priority = this.calculatePriority({
        severity: anomaly.severity,
        confidence: anomaly.confidence,
        impact: this.assessImpact(anomaly),
        urgency: this.assessUrgency(anomaly),
      });

      const alert: IntelligentAlert = {
        id: this.generateAlertId(
          'anomaly',
          anomaly.serverId,
          anomaly.timestamp
        ),
        serverId: anomaly.serverId,
        type: 'anomaly',
        severity:
          anomaly.severity === 'critical'
            ? 'critical'
            : anomaly.severity === 'high'
              ? 'error'
              : 'warning',
        priority,
        title: this.generateAlertTitle(anomaly),
        description: this.generateAlertDescription(anomaly),
        timestamp: anomaly.timestamp,
        aiInsights,
        recommendedActions,
        metadata: {
          sourceData: [anomaly],
          correlatedAlerts: [],
          suppressionRules: [],
          escalationPath: this.generateEscalationPath(priority),
        },
        status: 'active',
      };

      // 상관관계 분석 및 기존 알림과 연결
      await this.analyzeCorrelations(alert);

      // 알림 저장
      this.activeAlerts.set(alert.id, alert);
      this.alertHistory.push(alert);

      return alert;
    } catch (error) {
      console.error('이상 징후 알림 생성 중 오류:', getErrorMessage(error));
      return null;
    }
  }

  /**
   * 🔮 예측 기반 알림 생성
   */
  public async generatePredictionAlert(
    prediction: PredictionResult
  ): Promise<IntelligentAlert[]> {
    const alerts: IntelligentAlert[] = [];

    try {
      for (const predictionAlert of prediction.alerts) {
        // 중복 확인
        if (
          this.isDuplicateAlert(
            'prediction',
            prediction.serverId,
            predictionAlert.type
          )
        ) {
          continue;
        }

        // AI 인사이트 생성
        const aiInsights = await this.generateAIInsights([prediction]);

        // 권장 액션 생성
        const recommendedActions = this.generatePredictionActions(
          predictionAlert,
          prediction
        );

        // 우선순위 계산
        const priority = this.calculatePriority({
          severity: predictionAlert.severity,
          confidence: prediction.accuracy.r2,
          impact: this.assessPredictionImpact(predictionAlert),
          urgency: this.assessPredictionUrgency(predictionAlert.timeToAlert),
        });

        const alert: IntelligentAlert = {
          id: this.generateAlertId(
            'prediction',
            prediction.serverId,
            Date.now()
          ),
          serverId: prediction.serverId,
          type: 'prediction',
          severity:
            predictionAlert.severity === 'critical'
              ? 'critical'
              : predictionAlert.severity === 'high'
                ? 'error'
                : 'warning',
          priority,
          title: `예측 알림: ${predictionAlert.type}`,
          description: predictionAlert.description,
          timestamp: Date.now(),
          aiInsights,
          recommendedActions,
          metadata: {
            sourceData: [prediction],
            correlatedAlerts: [],
            suppressionRules: [],
            escalationPath: this.generateEscalationPath(priority),
          },
          status: 'active',
        };

        // 상관관계 분석
        await this.analyzeCorrelations(alert);

        // 알림 저장
        this.activeAlerts.set(alert.id, alert);
        this.alertHistory.push(alert);
        alerts.push(alert);
      }

      return alerts;
    } catch (error) {
      console.error('예측 알림 생성 중 오류:', getErrorMessage(error));
      return [];
    }
  }

  /**
   * 📊 임계값 기반 알림 생성
   */
  public async generateThresholdAlert(
    metrics: MCPServerMetrics,
    rules: AlertRule[]
  ): Promise<IntelligentAlert[]> {
    const alerts: IntelligentAlert[] = [];

    try {
      for (const rule of rules) {
        if (
          !rule.enabled ||
          (rule.serverId && rule.serverId !== metrics.serverId)
        ) {
          continue;
        }

        const metricValue = metrics[rule.condition.metric] as number;
        const threshold = rule.condition.threshold;

        // 조건 확인
        let triggered = false;
        switch (rule.condition.operator) {
          case '>':
            triggered = metricValue > threshold;
            break;
          case '<':
            triggered = metricValue < threshold;
            break;
          case '>=':
            triggered = metricValue >= threshold;
            break;
          case '<=':
            triggered = metricValue <= threshold;
            break;
          case '==':
            triggered = metricValue === threshold;
            break;
        }

        if (!triggered) continue;

        // 중복 확인
        if (this.isDuplicateAlert('threshold', metrics.serverId, rule.id)) {
          continue;
        }

        // AI 인사이트 생성
        const aiInsights = await this.generateAIInsights([metrics]);

        // 권장 액션 생성
        const recommendedActions = this.generateThresholdActions(rule, metrics);

        // 우선순위 계산
        const priority = this.calculatePriority({
          severity: rule.severity,
          confidence: 0.9, // 임계값 기반은 높은 신뢰도
          impact: this.assessThresholdImpact(rule, metricValue, threshold),
          urgency: this.assessThresholdUrgency(rule),
        });

        const alert: IntelligentAlert = {
          id: this.generateAlertId(
            'threshold',
            metrics.serverId,
            metrics.timestamp
          ),
          serverId: metrics.serverId,
          type: 'threshold',
          severity:
            rule.severity === 'critical'
              ? 'critical'
              : rule.severity === 'error'
                ? 'error'
                : 'warning',
          priority,
          title: `임계값 초과: ${rule.name}`,
          description: `${rule.condition.metric} 값이 임계값을 초과했습니다. 현재값: ${metricValue}, 임계값: ${threshold}`,
          timestamp: metrics.timestamp,
          aiInsights,
          recommendedActions,
          metadata: {
            sourceData: [metrics],
            correlatedAlerts: [],
            suppressionRules: [],
            escalationPath: this.generateEscalationPath(priority),
          },
          status: 'active',
        };

        // 상관관계 분석
        await this.analyzeCorrelations(alert);

        // 알림 저장
        this.activeAlerts.set(alert.id, alert);
        this.alertHistory.push(alert);
        alerts.push(alert);
      }

      return alerts;
    } catch (error) {
      console.error('임계값 알림 생성 중 오류:', getErrorMessage(error));
      return [];
    }
  }

  /**
   * 🧠 AI 인사이트 생성
   */
  private async generateAIInsights(
    sourceData: (AnomalyDetectionResult | PredictionResult | MCPServerMetrics)[]
  ): Promise<IntelligentAlert['aiInsights']> {
    const rootCause: string[] = [];
    let impactSeverity = 0;
    let scope: IntelligentAlert['aiInsights']['impactAssessment']['scope'] =
      'single_server';
    let duration: IntelligentAlert['aiInsights']['impactAssessment']['duration'] =
      'short_term';
    let confidence = 0.5;

    // 소스 데이터 분석
    sourceData.forEach((data) => {
      if ('anomalyType' in data) {
        // 이상 징후 데이터
        rootCause.push(
          ...this.analyzeAnomalyRootCause(data as AnomalyDetectionResult)
        );
        impactSeverity = Math.max(
          impactSeverity,
          this.mapSeverityToNumber(data.severity)
        );
        confidence = Math.max(confidence, data.confidence);
      } else if ('predictions' in data) {
        // 예측 데이터
        rootCause.push(
          ...this.analyzePredictionRootCause(data as PredictionResult)
        );
        confidence = Math.max(
          confidence,
          (data as PredictionResult).accuracy.r2
        );
      } else {
        // 메트릭 데이터
        rootCause.push(
          ...this.analyzeMetricsRootCause(data as MCPServerMetrics)
        );
      }
    });

    // 유사 사건 분석
    const similarIncidents = this.findSimilarIncidents(rootCause);

    return {
      rootCause: [...new Set(rootCause)].slice(
        0,
        this.config.aiAnalysis.rootCauseDepth
      ),
      impactAssessment: {
        severity: impactSeverity,
        scope,
        duration,
      },
      confidence: Math.min(1, confidence),
      similarIncidents,
    };
  }

  /**
   * 🔍 이상 징후 근본 원인 분석
   */
  private analyzeAnomalyRootCause(anomaly: AnomalyDetectionResult): string[] {
    const causes: string[] = [];

    switch (anomaly.anomalyType) {
      case 'response_time_spike':
        causes.push(
          '서버 리소스 부족',
          '데이터베이스 성능 저하',
          '네트워크 지연',
          '메모리 누수'
        );
        break;
      case 'error_rate_increase':
        causes.push(
          '코드 배포 이슈',
          '외부 의존성 실패',
          '설정 오류',
          '리소스 경합'
        );
        break;
      case 'success_rate_drop':
        causes.push(
          '시스템 과부하',
          '서비스 불가',
          '인프라 문제',
          '의존성 서비스 장애'
        );
        break;
      case 'circuit_breaker_frequent':
        causes.push(
          '하위 시스템 불안정',
          '타임아웃 설정 부적절',
          '부하 급증',
          '의존성 체인 문제'
        );
        break;
    }

    return causes;
  }

  /**
   * 🔮 예측 근본 원인 분석
   */
  private analyzePredictionRootCause(prediction: PredictionResult): string[] {
    const causes: string[] = [];

    if (prediction.trend.direction === 'increasing') {
      causes.push(
        '부하 증가 트렌드',
        '용량 한계 접근',
        '리소스 누수',
        '확장성 문제'
      );
    }

    if (prediction.trend.seasonality) {
      causes.push('주기적 부하 패턴', '시간대별 사용량 변화', '배치 작업 영향');
    }

    return causes;
  }

  /**
   * 📊 메트릭 근본 원인 분석
   */
  private analyzeMetricsRootCause(metrics: MCPServerMetrics): string[] {
    const causes: string[] = [];

    if (metrics.responseTime > 1000) {
      causes.push('응답 시간 임계값 초과');
    }

    if (metrics.errorRate > 5) {
      causes.push('높은 에러율');
    }

    if (metrics.successRate < 95) {
      causes.push('낮은 성공률');
    }

    if (metrics.circuitBreakerState !== 'closed') {
      causes.push('Circuit Breaker 활성화');
    }

    return causes;
  }

  /**
   * 📋 권장 액션 생성
   */
  private generateRecommendedActions(
    anomaly: AnomalyDetectionResult
  ): IntelligentAlert['recommendedActions'] {
    return {
      immediate: anomaly.suggestedActions.slice(0, 2),
      shortTerm: anomaly.suggestedActions.slice(2, 4),
      longTerm: ['성능 모니터링 강화', '용량 계획 수립', '자동화 도구 도입'],
      automated: this.generateAutomatedAction(anomaly),
    };
  }

  /**
   * 🔮 예측 액션 생성
   */
  private generatePredictionActions(
    predictionAlert: PredictionResult['alerts'][0],
    prediction: PredictionResult
  ): IntelligentAlert['recommendedActions'] {
    const actions = {
      immediate: [] as string[],
      shortTerm: [] as string[],
      longTerm: [] as string[],
    };

    switch (predictionAlert.type) {
      case 'threshold_breach':
        actions.immediate.push('임계값 상향 조정 검토', '리소스 확장 준비');
        actions.shortTerm.push('성능 튜닝', '부하 분산 최적화');
        break;
      case 'capacity_limit':
        actions.immediate.push('용량 확장 계획 실행');
        actions.shortTerm.push('스케일링 정책 검토');
        break;
    }

    actions.longTerm.push('예측 모델 정확도 개선', '자동 스케일링 구현');

    return actions;
  }

  /**
   * 📊 임계값 액션 생성
   */
  private generateThresholdActions(
    rule: AlertRule,
    metrics: MCPServerMetrics
  ): IntelligentAlert['recommendedActions'] {
    const actions = {
      immediate: ['현재 상태 점검', '로그 분석'],
      shortTerm: ['임계값 조정 검토', '모니터링 강화'],
      longTerm: ['성능 최적화', '예방적 조치 수립'],
    };

    // 메트릭별 특화 액션
    switch (rule.condition.metric) {
      case 'responseTime':
        actions.immediate.unshift('서버 리소스 확인');
        break;
      case 'errorRate':
        actions.immediate.unshift('에러 로그 긴급 분석');
        break;
      case 'successRate':
        actions.immediate.unshift('서비스 상태 긴급 점검');
        break;
    }

    return actions;
  }

  /**
   * 🤖 자동화 액션 생성
   */
  private generateAutomatedAction(
    anomaly: AnomalyDetectionResult
  ): IntelligentAlert['recommendedActions']['automated'] {
    let action = '';
    let confidence = 0;
    let risk: 'low' | 'medium' | 'high' = 'medium';

    switch (anomaly.anomalyType) {
      case 'response_time_spike':
        if (anomaly.confidence > 0.8) {
          action = 'Circuit Breaker 임계값 조정';
          confidence = 0.7;
          risk = 'low';
        }
        break;
      case 'circuit_breaker_frequent':
        if (anomaly.confidence > 0.9) {
          action = 'Circuit Breaker 상태 리셋';
          confidence = 0.8;
          risk = 'low';
        }
        break;
    }

    return action ? { action, confidence, risk } : undefined;
  }

  /**
   * 🔢 우선순위 계산
   */
  private calculatePriority(factors: {
    severity: string;
    confidence: number;
    impact: number;
    urgency: number;
  }): number {
    const severityScore = this.mapSeverityToNumber(factors.severity);
    const weights = this.config.priorityWeights;

    const score =
      severityScore * weights.severity +
      factors.confidence * weights.confidence +
      factors.impact * weights.impact +
      factors.urgency * weights.urgency;

    return Math.round(Math.min(10, Math.max(1, score * 10)));
  }

  /**
   * 📊 심각도를 숫자로 매핑
   */
  private mapSeverityToNumber(severity: string): number {
    switch (severity) {
      case 'critical':
        return 1.0;
      case 'high':
      case 'error':
        return 0.8;
      case 'medium':
      case 'warning':
        return 0.6;
      case 'low':
      case 'info':
        return 0.4;
      default:
        return 0.5;
    }
  }

  /**
   * 🎯 영향도 평가
   */
  private assessImpact(anomaly: AnomalyDetectionResult): number {
    let impact = 0.5;

    // 영향 받는 메트릭 수
    impact += anomaly.affectedMetrics.length * 0.1;

    // 편차 크기
    impact += Math.min(0.3, anomaly.historicalContext.deviation / 10);

    return Math.min(1, impact);
  }

  /**
   * ⏰ 긴급도 평가
   */
  private assessUrgency(anomaly: AnomalyDetectionResult): number {
    // 이상 징후는 일반적으로 높은 긴급도
    return anomaly.severity === 'critical'
      ? 1.0
      : anomaly.severity === 'high'
        ? 0.8
        : 0.6;
  }

  /**
   * 🔮 예측 영향도 평가
   */
  private assessPredictionImpact(alert: PredictionResult['alerts'][0]): number {
    return alert.severity === 'critical'
      ? 1.0
      : alert.severity === 'high'
        ? 0.8
        : 0.6;
  }

  /**
   * ⏰ 예측 긴급도 평가
   */
  private assessPredictionUrgency(timeToAlert: number): number {
    // 시간이 적을수록 높은 긴급도
    if (timeToAlert < 60) return 1.0; // 1시간 미만
    if (timeToAlert < 360) return 0.8; // 6시간 미만
    if (timeToAlert < 1440) return 0.6; // 24시간 미만
    return 0.4;
  }

  /**
   * 📊 임계값 영향도 평가
   */
  private assessThresholdImpact(
    rule: AlertRule,
    value: number,
    threshold: number
  ): number {
    const ratio = Math.abs(value - threshold) / threshold;
    return Math.min(1, ratio);
  }

  /**
   * ⏰ 임계값 긴급도 평가
   */
  private assessThresholdUrgency(rule: AlertRule): number {
    return rule.severity === 'critical'
      ? 1.0
      : rule.severity === 'error'
        ? 0.8
        : 0.6;
  }

  /**
   * 🔗 상관관계 분석
   */
  private async analyzeCorrelations(alert: IntelligentAlert): Promise<void> {
    const correlatedAlerts: string[] = [];

    // 동일 서버의 최근 알림과 비교
    this.activeAlerts.forEach((existingAlert, alertId) => {
      if (
        existingAlert.serverId === alert.serverId &&
        alertId !== alert.id &&
        Date.now() - existingAlert.timestamp < this.config.groupingWindow
      ) {
        const similarity = this.calculateAlertSimilarity(alert, existingAlert);
        if (similarity > this.config.aiAnalysis.similarityThreshold) {
          correlatedAlerts.push(alertId);
        }
      }
    });

    alert.metadata.correlatedAlerts = correlatedAlerts;
  }

  /**
   * 🔍 알림 유사도 계산
   */
  private calculateAlertSimilarity(
    alert1: IntelligentAlert,
    alert2: IntelligentAlert
  ): number {
    let similarity = 0;

    // 타입 유사도
    if (alert1.type === alert2.type) similarity += 0.3;

    // 심각도 유사도
    if (alert1.severity === alert2.severity) similarity += 0.2;

    // 근본원인 유사도
    const commonCauses = alert1.aiInsights.rootCause.filter((cause) =>
      alert2.aiInsights.rootCause.includes(cause)
    );
    similarity +=
      (commonCauses.length /
        Math.max(
          alert1.aiInsights.rootCause.length,
          alert2.aiInsights.rootCause.length
        )) *
      0.5;

    return similarity;
  }

  /**
   * 🔄 중복 알림 확인
   */
  private isDuplicateAlert(
    type: string,
    serverId: MCPServerName,
    identifier: string
  ): boolean {
    const key = `${type}_${serverId}_${identifier}`;
    const cutoff = Date.now() - this.config.deduplicationWindow;

    return Array.from(this.activeAlerts.values()).some(
      (alert) =>
        alert.type === type &&
        alert.serverId === serverId &&
        alert.timestamp > cutoff &&
        (alert.title.includes(identifier) ||
          alert.description.includes(identifier))
    );
  }

  /**
   * 🏷️ 알림 ID 생성
   */
  private generateAlertId(
    type: string,
    serverId: MCPServerName,
    timestamp: number
  ): string {
    return `${type}_${serverId}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 📝 알림 제목 생성
   */
  private generateAlertTitle(anomaly: AnomalyDetectionResult): string {
    const typeMap = {
      response_time_spike: '응답 시간 급증',
      error_rate_increase: '에러율 증가',
      success_rate_drop: '성공률 하락',
      memory_leak: '메모리 누수',
      circuit_breaker_frequent: 'Circuit Breaker 빈발',
      connection_instability: '연결 불안정',
    };

    return `${typeMap[anomaly.anomalyType] || anomaly.anomalyType}: ${anomaly.serverId}`;
  }

  /**
   * 📄 알림 설명 생성
   */
  private generateAlertDescription(anomaly: AnomalyDetectionResult): string {
    return (
      `${anomaly.description}\n\n` +
      `신뢰도: ${(anomaly.confidence * 100).toFixed(1)}%\n` +
      `기준값: ${anomaly.historicalContext.baselineValue.toFixed(2)}\n` +
      `현재값: ${anomaly.historicalContext.currentValue.toFixed(2)}\n` +
      `편차: ${anomaly.historicalContext.deviation.toFixed(2)}σ`
    );
  }

  /**
   * 📈 에스컬레이션 경로 생성
   */
  private generateEscalationPath(priority: number): string[] {
    const paths = [];

    if (priority >= 8) {
      paths.push('즉시 온콜 엔지니어 호출');
    }
    if (priority >= 6) {
      paths.push('팀 리드 알림');
    }
    if (priority >= 4) {
      paths.push('담당 개발자 알림');
    }

    paths.push('모니터링 대시보드 표시');

    return paths;
  }

  /**
   * 🔍 유사 사건 검색
   */
  private findSimilarIncidents(
    rootCauses: string[]
  ): IntelligentAlert['aiInsights']['similarIncidents'] {
    const similarIncidents = this.alertHistory.filter((alert) => {
      const commonCauses = alert.aiInsights.rootCause.filter((cause) =>
        rootCauses.includes(cause)
      );
      return commonCauses.length > 0;
    });

    const resolvedIncidents = similarIncidents.filter(
      (alert) => alert.status === 'resolved'
    );
    const avgResolutionTime =
      resolvedIncidents.length > 0
        ? resolvedIncidents.reduce(
            (sum, alert) =>
              sum + ((alert.resolvedAt || alert.timestamp) - alert.timestamp),
            0
          ) / resolvedIncidents.length
        : 0;

    // 공통 해결책 추출
    const commonSolutions = resolvedIncidents
      .filter((alert) => alert.resolution)
      .map((alert) => alert.resolution!)
      .reduce((acc: Record<string, number>, solution) => {
        acc[solution] = (acc[solution] || 0) + 1;
        return acc;
      }, {});

    const topSolutions = Object.entries(commonSolutions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([solution]) => solution);

    return {
      count: similarIncidents.length,
      averageResolutionTime: avgResolutionTime,
      commonSolutions: topSolutions,
    };
  }

  /**
   * 📊 알림 조회
   */
  public getAlerts(filter?: AlertFilter): IntelligentAlert[] {
    let alerts = Array.from(this.activeAlerts.values());

    if (filter) {
      if (filter.serverId) {
        alerts = alerts.filter((a) => a.serverId === filter.serverId);
      }
      if (filter.severity) {
        alerts = alerts.filter((a) => filter.severity!.includes(a.severity));
      }
      if (filter.type) {
        alerts = alerts.filter((a) => filter.type!.includes(a.type));
      }
      if (filter.minPriority) {
        alerts = alerts.filter((a) => a.priority >= filter.minPriority!);
      }
      if (filter.timeRange) {
        alerts = alerts.filter(
          (a) =>
            a.timestamp >= filter.timeRange!.start &&
            a.timestamp <= filter.timeRange!.end
        );
      }
    }

    return alerts.sort((a, b) => b.priority - a.priority);
  }

  /**
   * ✅ 알림 승인
   */
  public acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert && alert.status === 'active') {
      alert.status = 'acknowledged';
      alert.acknowledgedBy = acknowledgedBy;
      return true;
    }
    return false;
  }

  /**
   * ✅ 알림 해결
   */
  public resolveAlert(alertId: string, resolution: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = Date.now();
      alert.resolution = resolution;

      // 활성 알림에서 제거
      this.activeAlerts.delete(alertId);
      return true;
    }
    return false;
  }

  /**
   * 🧹 주기적 유지보수
   */
  private startPeriodicMaintenance(): void {
    setInterval(
      () => {
        const now = Date.now();

        // 오래된 알림 자동 해결
        this.activeAlerts.forEach((alert, alertId) => {
          if (now - alert.timestamp > this.config.autoResolveTimeout) {
            this.resolveAlert(alertId, '자동 해결 (타임아웃)');
          }
        });

        // 기록 정리
        const cutoff = now - this.config.retentionPeriod;
        this.alertHistory = this.alertHistory.filter(
          (alert) => alert.timestamp > cutoff
        );

        // 억제 규칙 정리
        this.suppressionRules.forEach((rule, key) => {
          if (now > rule.until) {
            this.suppressionRules.delete(key);
          }
        });
      },
      60 * 60 * 1000
    ); // 1시간마다 실행
  }

  /**
   * 📊 알림 통계 조회
   */
  public getAlertingStats(): {
    activeAlerts: number;
    totalAlertsToday: number;
    alertsByType: Record<string, number>;
    alertsBySeverity: Record<string, number>;
    averageResolutionTime: number;
  } {
    const today = Date.now() - 24 * 60 * 60 * 1000;
    const todayAlerts = this.alertHistory.filter(
      (alert) => alert.timestamp > today
    );

    const alertsByType: Record<string, number> = {};
    const alertsBySeverity: Record<string, number> = {};

    todayAlerts.forEach((alert) => {
      alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
      alertsBySeverity[alert.severity] =
        (alertsBySeverity[alert.severity] || 0) + 1;
    });

    const resolvedAlerts = todayAlerts.filter(
      (alert) => alert.status === 'resolved'
    );
    const avgResolutionTime =
      resolvedAlerts.length > 0
        ? resolvedAlerts.reduce(
            (sum, alert) =>
              sum + ((alert.resolvedAt || alert.timestamp) - alert.timestamp),
            0
          ) / resolvedAlerts.length
        : 0;

    return {
      activeAlerts: this.activeAlerts.size,
      totalAlertsToday: todayAlerts.length,
      alertsByType,
      alertsBySeverity,
      averageResolutionTime: avgResolutionTime,
    };
  }
}

// 싱글톤 인스턴스 내보내기
export const intelligentAlertingSystem =
  IntelligentAlertingSystem.getInstance();
