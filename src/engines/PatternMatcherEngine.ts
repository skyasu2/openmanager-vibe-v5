/**
 * 🔍 PatternMatcherEngine v1.0
 * 
 * OpenManager v5.21.0 - 패턴 매칭 엔진
 * - 메모리 기반 이상 탐지 (무설정 배포)
 * - 실시간 메트릭 패턴 분석
 * - 적응형 임계값 조정
 * - 자동 패턴 학습
 */

import { getRealTimeHub, RealTimeMessage } from '../core/realtime/RealTimeHub';

export interface MetricData {
  serverId: string;
  timestamp: number;
  cpu: number;
  memory: number;
  network: number;
  disk: number;
  responseTime: number;
  errorRate: number;
}

export interface PatternRule {
  id: string;
  name: string;
  description: string;
  condition: string; // CPU > 90 || (memory > 85 && responseTime > 1000)
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  cooldown: number; // 재알림 방지 시간 (ms)
  adaptiveThreshold: boolean;
  learned: boolean;
  createdAt: number;
  lastTriggered?: number;
  triggerCount: number;
}

export interface PatternAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  serverId: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metrics: MetricData;
  timestamp: number;
  acknowledged: boolean;
}

export interface PatternStats {
  totalRules: number;
  activeRules: number;
  totalAlerts: number;
  alertsByServerity: Record<string, number>;
  recentAlerts: number;
  averageResponseTime: number;
  learningProgress: number;
}

class PatternMatcherEngine {
  private rules = new Map<string, PatternRule>();
  private alerts: PatternAlert[] = [];
  private metricsHistory = new Map<string, MetricData[]>();
  private baselineStats = new Map<string, any>();
  private lastTriggers = new Map<string, number>();
  
  private readonly MAX_ALERTS = 1000;
  private readonly MAX_METRICS_HISTORY = 100;
  private readonly LEARNING_WINDOW = 7 * 24 * 60 * 60 * 1000; // 7일
  private readonly DEFAULT_COOLDOWN = 5 * 60 * 1000; // 5분

  constructor() {
    this.initializeDefaultRules();
    console.log('🔍 PatternMatcherEngine 초기화 완료');
  }

  /**
   * 🎯 기본 패턴 룰 초기화
   */
  private initializeDefaultRules(): void {
    const defaultRules: Omit<PatternRule, 'id' | 'createdAt' | 'triggerCount'>[] = [
      {
        name: 'High CPU Usage',
        description: 'CPU 사용률이 85% 이상일 때',
        condition: 'cpu > 85',
        severity: 'warning',
        enabled: true,
        cooldown: this.DEFAULT_COOLDOWN,
        adaptiveThreshold: true,
        learned: false
      },
      {
        name: 'Critical CPU Usage',
        description: 'CPU 사용률이 95% 이상일 때',
        condition: 'cpu > 95',
        severity: 'critical',
        enabled: true,
        cooldown: this.DEFAULT_COOLDOWN / 2,
        adaptiveThreshold: false,
        learned: false
      },
      {
        name: 'High Memory Usage',
        description: '메모리 사용률이 90% 이상일 때',
        condition: 'memory > 90',
        severity: 'warning',
        enabled: true,
        cooldown: this.DEFAULT_COOLDOWN,
        adaptiveThreshold: true,
        learned: false
      },
      {
        name: 'Slow Response Time',
        description: '응답 시간이 2초 이상일 때',
        condition: 'responseTime > 2000',
        severity: 'warning',
        enabled: true,
        cooldown: this.DEFAULT_COOLDOWN,
        adaptiveThreshold: true,
        learned: false
      },
      {
        name: 'High Error Rate',
        description: '에러율이 5% 이상일 때',
        condition: 'errorRate > 5',
        severity: 'critical',
        enabled: true,
        cooldown: this.DEFAULT_COOLDOWN,
        adaptiveThreshold: true,
        learned: false
      },
      {
        name: 'System Stress',
        description: 'CPU, 메모리, 응답시간이 모두 높을 때',
        condition: 'cpu > 80 && memory > 80 && responseTime > 1500',
        severity: 'critical',
        enabled: true,
        cooldown: this.DEFAULT_COOLDOWN,
        adaptiveThreshold: false,
        learned: false
      }
    ];

    defaultRules.forEach(rule => this.addRule(rule));
  }

  /**
   * 📋 새 패턴 룰 추가
   */
  addRule(ruleData: Omit<PatternRule, 'id' | 'createdAt' | 'triggerCount'>): string {
    const rule: PatternRule = {
      ...ruleData,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      triggerCount: 0
    };

    this.rules.set(rule.id, rule);
    console.log(`📋 새 패턴 룰 추가: ${rule.name}`);
    return rule.id;
  }

  /**
   * ✏️ 패턴 룰 업데이트
   */
  updateRule(ruleId: string, updates: Partial<PatternRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    Object.assign(rule, updates);
    console.log(`✏️ 패턴 룰 업데이트: ${rule.name}`);
    return true;
  }

  /**
   * 🗑️ 패턴 룰 삭제
   */
  deleteRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    this.rules.delete(ruleId);
    console.log(`🗑️ 패턴 룰 삭제: ${rule.name}`);
    return true;
  }

  /**
   * 🔍 메트릭 분석 및 패턴 매칭
   */
  analyzeMetrics(metrics: MetricData): PatternAlert[] {
    const alerts: PatternAlert[] = [];
    
    // 메트릭 히스토리 저장
    this.storeMetricsHistory(metrics);
    
    // 베이스라인 업데이트
    this.updateBaseline(metrics);

    // 각 룰에 대해 패턴 매칭 수행
    this.rules.forEach(rule => {
      if (!rule.enabled) return;

      // 쿨다운 체크
      const lastTrigger = this.lastTriggers.get(`${rule.id}_${metrics.serverId}`) || 0;
      if (Date.now() - lastTrigger < rule.cooldown) {
        return;
      }

      // 적응형 임계값 적용
      const adjustedRule = this.applyAdaptiveThreshold(rule, metrics.serverId);
      
      // 조건 평가
      if (this.evaluateCondition(adjustedRule.condition, metrics)) {
        const alert = this.createAlert(rule, metrics);
        alerts.push(alert);
        
        // 알림 저장 및 전송
        this.storeAlert(alert);
        this.sendRealTimeAlert(alert);
        
        // 트리거 기록
        rule.triggerCount++;
        rule.lastTriggered = Date.now();
        this.lastTriggers.set(`${rule.id}_${metrics.serverId}`, Date.now());
      }
    });

    return alerts;
  }

  /**
   * 📊 메트릭 히스토리 저장
   */
  private storeMetricsHistory(metrics: MetricData): void {
    if (!this.metricsHistory.has(metrics.serverId)) {
      this.metricsHistory.set(metrics.serverId, []);
    }

    const history = this.metricsHistory.get(metrics.serverId)!;
    history.push(metrics);

    // 히스토리 크기 제한
    if (history.length > this.MAX_METRICS_HISTORY) {
      history.shift();
    }
  }

  /**
   * 📈 베이스라인 통계 업데이트
   */
  private updateBaseline(metrics: MetricData): void {
    const key = metrics.serverId;
    let baseline = this.baselineStats.get(key);

    if (!baseline) {
      baseline = {
        cpu: { avg: metrics.cpu, min: metrics.cpu, max: metrics.cpu, count: 1 },
        memory: { avg: metrics.memory, min: metrics.memory, max: metrics.memory, count: 1 },
        responseTime: { avg: metrics.responseTime, min: metrics.responseTime, max: metrics.responseTime, count: 1 },
        errorRate: { avg: metrics.errorRate, min: metrics.errorRate, max: metrics.errorRate, count: 1 }
      };
    } else {
      // 이동 평균 업데이트
      ['cpu', 'memory', 'responseTime', 'errorRate'].forEach(metric => {
        const value = metrics[metric as keyof MetricData] as number;
        const stat = baseline[metric];
        
        stat.avg = (stat.avg * stat.count + value) / (stat.count + 1);
        stat.min = Math.min(stat.min, value);
        stat.max = Math.max(stat.max, value);
        stat.count++;
      });
    }

    this.baselineStats.set(key, baseline);
  }

  /**
   * 🎯 적응형 임계값 적용
   */
  private applyAdaptiveThreshold(rule: PatternRule, serverId: string): PatternRule {
    if (!rule.adaptiveThreshold) return rule;

    const baseline = this.baselineStats.get(serverId);
    if (!baseline || baseline.cpu.count < 50) return rule; // 충분한 데이터가 없으면 원본 룰 사용

    // 동적 임계값 계산 (평균 + 2 * 표준편차)
    const adjustedRule = { ...rule };
    let condition = rule.condition;

    // CPU 임계값 조정
    if (condition.includes('cpu >')) {
      const dynamicThreshold = Math.min(95, baseline.cpu.avg + 20); // 최대 95%
      condition = condition.replace(/cpu\s*>\s*\d+/g, `cpu > ${dynamicThreshold.toFixed(1)}`);
    }

    // 메모리 임계값 조정
    if (condition.includes('memory >')) {
      const dynamicThreshold = Math.min(95, baseline.memory.avg + 15); // 최대 95%
      condition = condition.replace(/memory\s*>\s*\d+/g, `memory > ${dynamicThreshold.toFixed(1)}`);
    }

    // 응답시간 임계값 조정
    if (condition.includes('responseTime >')) {
      const dynamicThreshold = baseline.responseTime.avg * 2; // 평균의 2배
      condition = condition.replace(/responseTime\s*>\s*\d+/g, `responseTime > ${dynamicThreshold.toFixed(0)}`);
    }

    adjustedRule.condition = condition;
    return adjustedRule;
  }

  /**
   * ⚖️ 조건 평가
   */
  private evaluateCondition(condition: string, metrics: MetricData): boolean {
    try {
      // 안전한 조건 평가를 위한 변수 바인딩
      const { cpu, memory, network, disk, responseTime, errorRate } = metrics;
      
      // 조건 문자열을 JavaScript 표현식으로 변환
      const expression = condition
        .replace(/\band\b/gi, '&&')
        .replace(/\bor\b/gi, '||')
        .replace(/\bnot\b/gi, '!');

      // eval 대신 Function 생성자 사용 (더 안전)
      const evalFunction = new Function('cpu', 'memory', 'network', 'disk', 'responseTime', 'errorRate', 
        `return ${expression}`);
      
      return evalFunction(cpu, memory, network, disk, responseTime, errorRate);
      
    } catch (error) {
      console.error(`❌ 조건 평가 오류: ${condition}`, error);
      return false;
    }
  }

  /**
   * 🚨 알림 생성
   */
  private createAlert(rule: PatternRule, metrics: MetricData): PatternAlert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      serverId: metrics.serverId,
      severity: rule.severity,
      message: `${rule.description} (서버: ${metrics.serverId})`,
      metrics,
      timestamp: Date.now(),
      acknowledged: false
    };
  }

  /**
   * 💾 알림 저장
   */
  private storeAlert(alert: PatternAlert): void {
    this.alerts.push(alert);

    // 알림 개수 제한
    if (this.alerts.length > this.MAX_ALERTS) {
      this.alerts = this.alerts.slice(-this.MAX_ALERTS);
    }
  }

  /**
   * 📡 실시간 알림 전송
   */
  private sendRealTimeAlert(alert: PatternAlert): void {
    const hub = getRealTimeHub();
    
    const message: Omit<RealTimeMessage, 'timestamp'> = {
      type: 'pattern_alert',
      data: {
        alert,
        summary: {
          severity: alert.severity,
          server: alert.serverId,
          rule: alert.ruleName,
          message: alert.message
        }
      },
      target: ['admin', 'monitoring'] // 관리자 및 모니터링 그룹에 전송
    };

    hub.broadcast(message);
    console.log(`📡 실시간 알림 전송: ${alert.severity.toUpperCase()} - ${alert.ruleName}`);
  }

  /**
   * ✅ 알림 확인 처리
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    console.log(`✅ 알림 확인: ${alert.ruleName}`);
    return true;
  }

  /**
   * 📊 통계 조회
   */
  getStats(): PatternStats {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    const recentAlerts = this.alerts.filter(a => now - a.timestamp < oneHour).length;
    const alertsByServerity = this.alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 학습 진행률 계산 (베이스라인 데이터 개수 기반)
    const totalBaselines = Array.from(this.baselineStats.values())
      .reduce((sum, baseline) => sum + baseline.cpu.count, 0);
    const learningProgress = Math.min(100, (totalBaselines / 1000) * 100); // 1000개 샘플을 100%로 간주

    return {
      totalRules: this.rules.size,
      activeRules: Array.from(this.rules.values()).filter(r => r.enabled).length,
      totalAlerts: this.alerts.length,
      alertsByServerity,
      recentAlerts,
      averageResponseTime: this.calculateAverageResponseTime(),
      learningProgress
    };
  }

  /**
   * 📈 평균 응답시간 계산
   */
  private calculateAverageResponseTime(): number {
    let totalTime = 0;
    let count = 0;

    this.metricsHistory.forEach(history => {
      history.forEach(metric => {
        totalTime += metric.responseTime;
        count++;
      });
    });

    return count > 0 ? totalTime / count : 0;
  }

  /**
   * 📋 룰 목록 조회
   */
  getRules(): PatternRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * 🚨 알림 목록 조회
   */
  getAlerts(limit: number = 50): PatternAlert[] {
    return this.alerts.slice(-limit).reverse();
  }

  /**
   * 🔍 서버별 최근 메트릭 조회
   */
  getServerMetrics(serverId: string, limit: number = 20): MetricData[] {
    const history = this.metricsHistory.get(serverId);
    return history ? history.slice(-limit) : [];
  }

  /**
   * 📊 베이스라인 통계 조회
   */
  getBaseline(serverId: string): any {
    return this.baselineStats.get(serverId) || null;
  }
}

// 싱글톤 인스턴스
let engineInstance: PatternMatcherEngine | null = null;

export function getPatternMatcherEngine(): PatternMatcherEngine {
  if (!engineInstance) {
    engineInstance = new PatternMatcherEngine();
  }
  return engineInstance;
}

export function resetPatternMatcherEngine(): void {
  engineInstance = null;
}

export default PatternMatcherEngine; 