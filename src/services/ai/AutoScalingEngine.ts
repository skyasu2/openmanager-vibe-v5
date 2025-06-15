/**
 * 🤖 AI 기반 자동 스케일링 엔진 v2.0
 *
 * OpenManager AI v5.12.0 - 지능형 자동 스케일링
 * - 예측 기반 프로액티브 스케일링
 * - 다중 메트릭 기반 의사결정
 * - 비용 최적화 알고리즘
 * - 안전 장치 및 롤백 메커니즘
 * - 학습 기반 임계값 조정
 */

import type { EnhancedServerMetrics } from '../../types/server';
import { predictiveAnalytics } from './PredictiveAnalytics';
import { cacheService } from '../cacheService';
import { slackNotificationService } from '../SlackNotificationService';

interface ScalingDecision {
  action: 'scale_up' | 'scale_down' | 'maintain';
  currentServers: number;
  targetServers: number;
  confidence: number;
  reasoning: string[];
  metrics: {
    avgCpu: number;
    avgMemory: number;
    avgDisk: number;
    avgResponseTime: number;
  };
  costImpact: {
    currentCost: number;
    projectedCost: number;
    savings: number;
  };
  timeline: {
    immediate: boolean;
    estimatedTime: number; // 분
  };
}

interface ScalingRule {
  id: string;
  name: string;
  metric: 'cpu' | 'memory' | 'disk' | 'response_time' | 'composite';
  threshold: {
    scaleUp: number;
    scaleDown: number;
  };
  duration: number; // 임계값 유지 시간 (초)
  weight: number; // 가중치 (0-1)
  enabled: boolean;
}

interface ScalingPolicy {
  minServers: number;
  maxServers: number;
  scaleUpCooldown: number; // 초
  scaleDownCooldown: number; // 초
  scaleUpStep: number; // 한 번에 추가할 서버 수
  scaleDownStep: number; // 한 번에 제거할 서버 수
  predictiveScaling: boolean;
  costOptimization: boolean;
}

interface ScalingHistory {
  timestamp: number;
  action: string;
  fromServers: number;
  toServers: number;
  trigger: string;
  success: boolean;
  duration: number;
}

export class AutoScalingEngine {
  private static instance: AutoScalingEngine;
  private isEnabled: boolean = true;
  private lastScalingAction: number = 0;
  private scalingHistory: ScalingHistory[] = [];
  private maxHistorySize = 100;

  // 기본 스케일링 정책
  private policy: ScalingPolicy = {
    minServers: 3,
    maxServers: 30,
    scaleUpCooldown: 300, // 5분
    scaleDownCooldown: 600, // 10분
    scaleUpStep: 2,
    scaleDownStep: 1,
    predictiveScaling: true,
    costOptimization: true,
  };

  // 기본 스케일링 규칙
  private rules: ScalingRule[] = [
    {
      id: 'cpu_rule',
      name: 'CPU 사용률 기반',
      metric: 'cpu',
      threshold: { scaleUp: 80, scaleDown: 30 },
      duration: 180, // 3분
      weight: 0.4,
      enabled: true,
    },
    {
      id: 'memory_rule',
      name: '메모리 사용률 기반',
      metric: 'memory',
      threshold: { scaleUp: 85, scaleDown: 40 },
      duration: 180,
      weight: 0.3,
      enabled: true,
    },
    {
      id: 'response_time_rule',
      name: '응답시간 기반',
      metric: 'response_time',
      threshold: { scaleUp: 2000, scaleDown: 500 },
      duration: 120, // 2분
      weight: 0.2,
      enabled: true,
    },
    {
      id: 'composite_rule',
      name: '복합 메트릭 기반',
      metric: 'composite',
      threshold: { scaleUp: 75, scaleDown: 35 },
      duration: 240, // 4분
      weight: 0.1,
      enabled: true,
    },
  ];

  static getInstance(): AutoScalingEngine {
    if (!this.instance) {
      this.instance = new AutoScalingEngine();
    }
    return this.instance;
  }

  /**
   * 🤖 자동 스케일링 의사결정 실행
   */
  async makeScalingDecision(
    servers: EnhancedServerMetrics[]
  ): Promise<ScalingDecision> {
    console.log('🤖 자동 스케일링 의사결정 시작...');

    const currentServers = servers.length;
    const metrics = this.calculateMetrics(servers);

    // 1. 기본 규칙 기반 평가
    const ruleBasedDecision = await this.evaluateRules(servers, metrics);

    // 2. 예측 기반 평가 (활성화된 경우)
    let predictiveDecision = null;
    if (this.policy.predictiveScaling) {
      predictiveDecision = await this.evaluatePredictiveScaling(servers);
    }

    // 3. 비용 최적화 평가
    const costOptimization = this.policy.costOptimization
      ? await this.evaluateCostOptimization(servers, metrics)
      : null;

    // 4. 최종 의사결정 통합
    const finalDecision = this.integrateDecisions(
      ruleBasedDecision,
      predictiveDecision,
      costOptimization,
      currentServers,
      metrics
    );

    // 5. 안전 장치 적용
    const safeDecision = this.applySafetyChecks(finalDecision, currentServers);

    console.log(
      `🎯 스케일링 결정: ${safeDecision.action} (${currentServers} → ${safeDecision.targetServers})`
    );

    return safeDecision;
  }

  /**
   * 📊 서버 메트릭 계산
   */
  private calculateMetrics(
    servers: EnhancedServerMetrics[]
  ): ScalingDecision['metrics'] {
    const avgCpu =
      servers.reduce((sum, s) => sum + s.cpu_usage, 0) / servers.length;
    const avgMemory =
      servers.reduce((sum, s) => sum + s.memory_usage, 0) / servers.length;
    const avgDisk =
      servers.reduce((sum, s) => sum + s.disk_usage, 0) / servers.length;
    const avgResponseTime =
      servers.reduce((sum, s) => sum + s.response_time, 0) / servers.length;

    return { avgCpu, avgMemory, avgDisk, avgResponseTime };
  }

  /**
   * 📏 규칙 기반 평가
   */
  private async evaluateRules(
    servers: EnhancedServerMetrics[],
    metrics: ScalingDecision['metrics']
  ): Promise<{ action: string; score: number; reasons: string[] }> {
    let scaleUpScore = 0;
    let scaleDownScore = 0;
    const reasons: string[] = [];

    for (const rule of this.rules.filter(r => r.enabled)) {
      let currentValue = 0;
      let metricName = '';

      switch (rule.metric) {
        case 'cpu':
          currentValue = metrics.avgCpu;
          metricName = 'CPU 사용률';
          break;
        case 'memory':
          currentValue = metrics.avgMemory;
          metricName = '메모리 사용률';
          break;
        case 'response_time':
          currentValue = metrics.avgResponseTime;
          metricName = '응답시간';
          break;
        case 'disk':
          currentValue = metrics.avgDisk;
          metricName = '디스크 사용률';
          break;
        case 'composite':
          currentValue = this.calculateCompositeScore(metrics);
          metricName = '복합 점수';
          break;
      }

      // 스케일 업 평가
      if (currentValue > rule.threshold.scaleUp) {
        const score =
          rule.weight *
          ((currentValue - rule.threshold.scaleUp) / rule.threshold.scaleUp);
        scaleUpScore += score;
        reasons.push(
          `${metricName} 높음: ${currentValue.toFixed(1)} > ${rule.threshold.scaleUp}`
        );
      }

      // 스케일 다운 평가
      if (currentValue < rule.threshold.scaleDown) {
        const score =
          rule.weight *
          ((rule.threshold.scaleDown - currentValue) /
            rule.threshold.scaleDown);
        scaleDownScore += score;
        reasons.push(
          `${metricName} 낮음: ${currentValue.toFixed(1)} < ${rule.threshold.scaleDown}`
        );
      }
    }

    // 결정
    if (scaleUpScore > scaleDownScore && scaleUpScore > 0.3) {
      return { action: 'scale_up', score: scaleUpScore, reasons };
    } else if (scaleDownScore > scaleUpScore && scaleDownScore > 0.2) {
      return { action: 'scale_down', score: scaleDownScore, reasons };
    } else {
      return {
        action: 'maintain',
        score: 0,
        reasons: ['모든 메트릭이 정상 범위'],
      };
    }
  }

  /**
   * 🔮 예측 기반 스케일링 평가
   */
  private async evaluatePredictiveScaling(
    servers: EnhancedServerMetrics[]
  ): Promise<{
    action: string;
    confidence: number;
    reasons: string[];
  }> {
    try {
      // 30분 후 예측
      const predictions = await Promise.all(
        servers.slice(0, 5).map(
          (
            server // 상위 5개 서버만 예측
          ) => predictiveAnalytics.predictServerLoadLegacy(server.id, 30)
        )
      );

      const flatPredictions = predictions.flat();
      const criticalPredictions = flatPredictions.filter(
        p => p.severity === 'critical'
      );
      const highPredictions = flatPredictions.filter(
        p => p.severity === 'high'
      );

      const avgConfidence =
        flatPredictions.reduce((sum, p) => sum + p.confidence, 0) /
        Math.max(flatPredictions.length, 1);

      const reasons: string[] = [];

      if (criticalPredictions.length > 0) {
        reasons.push(
          `30분 내 ${criticalPredictions.length}개 메트릭이 위험 수준 예상`
        );
        return { action: 'scale_up', confidence: avgConfidence, reasons };
      }

      if (highPredictions.length > 2) {
        reasons.push(
          `30분 내 ${highPredictions.length}개 메트릭이 높은 수준 예상`
        );
        return { action: 'scale_up', confidence: avgConfidence, reasons };
      }

      // 모든 예측이 안정적인 경우
      const stablePredictions = flatPredictions.filter(
        p => p.severity === 'low'
      );
      if (
        stablePredictions.length === flatPredictions.length &&
        servers.length > this.policy.minServers
      ) {
        reasons.push('모든 메트릭이 안정적으로 예측됨');
        return { action: 'scale_down', confidence: avgConfidence, reasons };
      }

      reasons.push('예측 결과 현재 상태 유지 권장');
      return { action: 'maintain', confidence: avgConfidence, reasons };
    } catch (error) {
      console.warn('⚠️ 예측 기반 스케일링 평가 실패:', error);
      return {
        action: 'maintain',
        confidence: 0,
        reasons: ['예측 데이터 부족'],
      };
    }
  }

  /**
   * 💰 비용 최적화 평가
   */
  private async evaluateCostOptimization(
    servers: EnhancedServerMetrics[],
    metrics: ScalingDecision['metrics']
  ): Promise<{ action: string; savings: number; reasons: string[] }> {
    const currentCost = this.calculateServerCost(servers.length);
    const reasons: string[] = [];

    // 리소스 사용률이 낮고 서버 수가 최소값보다 많은 경우
    if (
      metrics.avgCpu < 25 &&
      metrics.avgMemory < 30 &&
      servers.length > this.policy.minServers
    ) {
      const targetServers = Math.max(
        this.policy.minServers,
        servers.length - this.policy.scaleDownStep
      );
      const projectedCost = this.calculateServerCost(targetServers);
      const savings = currentCost - projectedCost;

      reasons.push(
        `낮은 리소스 사용률로 ${savings.toFixed(0)}원/시간 절약 가능`
      );
      return { action: 'scale_down', savings, reasons };
    }

    // 현재 상태가 비용 효율적인 경우
    reasons.push('현재 서버 수가 비용 효율적');
    return { action: 'maintain', savings: 0, reasons };
  }

  /**
   * 🧮 복합 점수 계산
   */
  private calculateCompositeScore(metrics: ScalingDecision['metrics']): number {
    // CPU, 메모리, 응답시간을 종합한 점수 (0-100)
    const cpuScore = metrics.avgCpu;
    const memoryScore = metrics.avgMemory;
    const responseTimeScore = Math.min(100, metrics.avgResponseTime / 50); // 5초 = 100점

    return cpuScore * 0.4 + memoryScore * 0.4 + responseTimeScore * 0.2;
  }

  /**
   * 🔄 의사결정 통합
   */
  private integrateDecisions(
    ruleBasedDecision: any,
    predictiveDecision: any,
    costOptimization: any,
    currentServers: number,
    metrics: ScalingDecision['metrics']
  ): ScalingDecision {
    const reasoning: string[] = [];
    let action: 'scale_up' | 'scale_down' | 'maintain' = 'maintain';
    let targetServers = currentServers;
    let confidence = 0.5;

    // 규칙 기반 결정 가중치: 60%
    const ruleWeight = 0.6;
    // 예측 기반 결정 가중치: 30%
    const predictiveWeight = 0.3;
    // 비용 최적화 가중치: 10%
    const costWeight = 0.1;

    let scaleUpScore = 0;
    let scaleDownScore = 0;

    // 규칙 기반 점수
    if (ruleBasedDecision.action === 'scale_up') {
      scaleUpScore += ruleWeight * ruleBasedDecision.score;
      reasoning.push(...ruleBasedDecision.reasons);
    } else if (ruleBasedDecision.action === 'scale_down') {
      scaleDownScore += ruleWeight * ruleBasedDecision.score;
      reasoning.push(...ruleBasedDecision.reasons);
    }

    // 예측 기반 점수
    if (predictiveDecision) {
      if (predictiveDecision.action === 'scale_up') {
        scaleUpScore += predictiveWeight * predictiveDecision.confidence;
        reasoning.push(...predictiveDecision.reasons);
      } else if (predictiveDecision.action === 'scale_down') {
        scaleDownScore += predictiveWeight * predictiveDecision.confidence;
        reasoning.push(...predictiveDecision.reasons);
      }
      confidence = Math.max(confidence, predictiveDecision.confidence);
    }

    // 비용 최적화 점수
    if (costOptimization && costOptimization.action === 'scale_down') {
      scaleDownScore += costWeight;
      reasoning.push(...costOptimization.reasons);
    }

    // 최종 결정
    if (scaleUpScore > scaleDownScore && scaleUpScore > 0.4) {
      action = 'scale_up';
      targetServers = Math.min(
        this.policy.maxServers,
        currentServers + this.policy.scaleUpStep
      );
    } else if (scaleDownScore > scaleUpScore && scaleDownScore > 0.3) {
      action = 'scale_down';
      targetServers = Math.max(
        this.policy.minServers,
        currentServers - this.policy.scaleDownStep
      );
    }

    // 비용 계산
    const currentCost = this.calculateServerCost(currentServers);
    const projectedCost = this.calculateServerCost(targetServers);
    const savings = currentCost - projectedCost;

    return {
      action,
      currentServers,
      targetServers,
      confidence,
      reasoning,
      metrics,
      costImpact: {
        currentCost,
        projectedCost,
        savings,
      },
      timeline: {
        immediate: action !== 'maintain',
        estimatedTime:
          action === 'scale_up' ? 3 : action === 'scale_down' ? 5 : 0,
      },
    };
  }

  /**
   * 🛡️ 안전 장치 적용
   */
  private applySafetyChecks(
    decision: ScalingDecision,
    currentServers: number
  ): ScalingDecision {
    const now = Date.now();
    const reasoning = [...decision.reasoning];

    // 쿨다운 체크
    const timeSinceLastAction = now - this.lastScalingAction;
    const requiredCooldown =
      decision.action === 'scale_up'
        ? this.policy.scaleUpCooldown * 1000
        : this.policy.scaleDownCooldown * 1000;

    if (timeSinceLastAction < requiredCooldown) {
      reasoning.push(
        `쿨다운 기간 중 (${Math.ceil((requiredCooldown - timeSinceLastAction) / 1000)}초 남음)`
      );
      return {
        ...decision,
        action: 'maintain',
        targetServers: currentServers,
        reasoning,
      };
    }

    // 최소/최대 서버 수 체크
    if (decision.targetServers < this.policy.minServers) {
      reasoning.push(`최소 서버 수 제한 (${this.policy.minServers}개)`);
      return {
        ...decision,
        targetServers: this.policy.minServers,
        reasoning,
      };
    }

    if (decision.targetServers > this.policy.maxServers) {
      reasoning.push(`최대 서버 수 제한 (${this.policy.maxServers}개)`);
      return {
        ...decision,
        targetServers: this.policy.maxServers,
        reasoning,
      };
    }

    // 급격한 변화 방지
    const maxChange = Math.ceil(currentServers * 0.5); // 최대 50% 변화
    if (Math.abs(decision.targetServers - currentServers) > maxChange) {
      const safeTarget =
        decision.action === 'scale_up'
          ? currentServers + maxChange
          : currentServers - maxChange;

      reasoning.push(`급격한 변화 방지 (최대 ${maxChange}개 변화)`);
      return {
        ...decision,
        targetServers: safeTarget,
        reasoning,
      };
    }

    return decision;
  }

  /**
   * 💰 서버 비용 계산 (시간당)
   */
  private calculateServerCost(serverCount: number): number {
    // 가상의 비용 모델 (시간당 원)
    const costPerServer = 1000; // 서버당 1000원/시간
    return serverCount * costPerServer;
  }

  /**
   * ⚡ 스케일링 실행
   */
  async executeScaling(decision: ScalingDecision): Promise<{
    success: boolean;
    actualServers: number;
    duration: number;
    error?: string;
  }> {
    if (decision.action === 'maintain') {
      return {
        success: true,
        actualServers: decision.currentServers,
        duration: 0,
      };
    }

    const startTime = Date.now();
    console.log(
      `⚡ 스케일링 실행: ${decision.action} (${decision.currentServers} → ${decision.targetServers})`
    );

    try {
      // 실제 스케일링 로직 (시뮬레이션)
      await this.simulateScaling(decision);

      const duration = Date.now() - startTime;
      this.lastScalingAction = Date.now();

      // 히스토리 기록
      this.addToHistory({
        timestamp: Date.now(),
        action: decision.action,
        fromServers: decision.currentServers,
        toServers: decision.targetServers,
        trigger: decision.reasoning[0] || 'Unknown',
        success: true,
        duration,
      });

      // Slack 알림
      await this.sendScalingNotification(decision, true);

      console.log(`✅ 스케일링 완료: ${duration}ms`);

      return {
        success: true,
        actualServers: decision.targetServers,
        duration,
      };
    } catch (error) {
      console.error('❌ 스케일링 실행 실패:', error);

      // 실패 히스토리 기록
      this.addToHistory({
        timestamp: Date.now(),
        action: decision.action,
        fromServers: decision.currentServers,
        toServers: decision.targetServers,
        trigger: decision.reasoning[0] || 'Unknown',
        success: false,
        duration: Date.now() - startTime,
      });

      // 실패 알림
      await this.sendScalingNotification(
        decision,
        false,
        error instanceof Error ? error.message : '알 수 없는 오류'
      );

      return {
        success: false,
        actualServers: decision.currentServers,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      };
    }
  }

  /**
   * 🎭 스케일링 시뮬레이션
   */
  private async simulateScaling(decision: ScalingDecision): Promise<void> {
    // 실제 환경에서는 클라우드 API 호출
    const delay = decision.action === 'scale_up' ? 3000 : 2000; // 3초 또는 2초
    await new Promise(resolve => setTimeout(resolve, delay));

    // 10% 확률로 실패 시뮬레이션
    if (Math.random() < 0.1) {
      throw new Error('스케일링 시뮬레이션 실패');
    }
  }

  /**
   * 📱 스케일링 알림 전송
   */
  private async sendScalingNotification(
    decision: ScalingDecision,
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      const message = success
        ? `🤖 자동 스케일링 완료\n` +
          `• 작업: ${decision.action}\n` +
          `• 서버 수: ${decision.currentServers} → ${decision.targetServers}\n` +
          `• 신뢰도: ${(decision.confidence * 100).toFixed(1)}%\n` +
          `• 비용 영향: ${decision.costImpact.savings > 0 ? '절약' : '증가'} ${Math.abs(decision.costImpact.savings).toFixed(0)}원/시간`
        : `❌ 자동 스케일링 실패\n` +
          `• 작업: ${decision.action}\n` +
          `• 오류: ${error}\n` +
          `• 현재 서버 수: ${decision.currentServers}개`;

      await slackNotificationService.sendSystemNotification(
        message,
        success ? 'info' : 'critical'
      );
    } catch (notificationError) {
      console.warn('⚠️ 스케일링 알림 전송 실패:', notificationError);
    }
  }

  /**
   * 📚 히스토리 추가
   */
  private addToHistory(entry: ScalingHistory): void {
    this.scalingHistory.unshift(entry);

    if (this.scalingHistory.length > this.maxHistorySize) {
      this.scalingHistory = this.scalingHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * 📊 스케일링 통계
   */
  getScalingStats(): {
    totalActions: number;
    successRate: number;
    averageDuration: number;
    lastAction: ScalingHistory | null;
    recentActions: ScalingHistory[];
  } {
    const totalActions = this.scalingHistory.length;
    const successfulActions = this.scalingHistory.filter(h => h.success).length;
    const successRate =
      totalActions > 0 ? (successfulActions / totalActions) * 100 : 0;

    const durations = this.scalingHistory
      .filter(h => h.success)
      .map(h => h.duration);
    const averageDuration =
      durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;

    return {
      totalActions,
      successRate,
      averageDuration,
      lastAction: this.scalingHistory[0] || null,
      recentActions: this.scalingHistory.slice(0, 10),
    };
  }

  /**
   * ⚙️ 정책 업데이트
   */
  updatePolicy(newPolicy: Partial<ScalingPolicy>): void {
    this.policy = { ...this.policy, ...newPolicy };
    console.log('⚙️ 스케일링 정책 업데이트됨:', newPolicy);
  }

  /**
   * 📏 규칙 업데이트
   */
  updateRules(newRules: ScalingRule[]): void {
    this.rules = newRules;
    console.log('📏 스케일링 규칙 업데이트됨:', newRules.length, '개');
  }

  /**
   * 🔄 자동 스케일링 활성화/비활성화
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`🔄 자동 스케일링 ${enabled ? '활성화' : '비활성화'}됨`);
  }

  /**
   * 📋 현재 설정 조회
   */
  getCurrentConfig(): {
    enabled: boolean;
    policy: ScalingPolicy;
    rules: ScalingRule[];
    lastAction: number;
  } {
    return {
      enabled: this.isEnabled,
      policy: this.policy,
      rules: this.rules,
      lastAction: this.lastScalingAction,
    };
  }
}

// 싱글톤 인스턴스 export
export const autoScalingEngine = AutoScalingEngine.getInstance();
