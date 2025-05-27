/**
 * 🚨 Alert System
 * 
 * 임계값 기반 자동 알림 시스템
 * - 서버 메트릭 모니터링
 * - 임계값 초과 시 자동 알림
 * - 알림 히스토리 관리
 * - 알림 규칙 설정
 */

import { virtualServerManager } from './VirtualServerManager';
import { getAlertsConfig } from '@/config';
import { AlertSeverity, ServerMetrics } from '@/types/common';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: 'cpu_usage' | 'memory_usage' | 'disk_usage' | 'response_time';
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  cooldownMinutes: number; // 동일 알림 재발송 방지 시간
  actions: AlertAction[];
  conditions?: {
    duration?: number; // 지속 시간 (초)
    serverTypes?: string[]; // 특정 서버 타입만
    environments?: string[]; // 특정 환경만
  };
}

export interface AlertAction {
  type: 'notification' | 'email' | 'webhook' | 'log';
  config: {
    [key: string]: any;
  };
}

export interface Alert {
  id: string;
  ruleId: string;
  serverId: string;
  hostname: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface AlertStats {
  total: number;
  active: number;
  acknowledged: number;
  resolved: number;
  byServerity: {
    info: number;
    warning: number;
    critical: number;
  };
  byServer: {
    [serverId: string]: number;
  };
}

export class AlertSystem {
  private static instance: AlertSystem;
  private rules: Map<string, AlertRule> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private cooldownTracker: Map<string, Date> = new Map();
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private listeners: Set<(alert: Alert) => void> = new Set();
  private config = getAlertsConfig();

  private constructor() {
    this.initializeDefaultRules();
  }

  static getInstance(): AlertSystem {
    if (!AlertSystem.instance) {
      AlertSystem.instance = new AlertSystem();
    }
    return AlertSystem.instance;
  }

  /**
   * 기본 알림 규칙 초기화
   */
  private initializeDefaultRules() {
    const defaultRules: AlertRule[] = [
      {
        id: 'cpu-critical',
        name: 'CPU 사용률 위험',
        description: 'CPU 사용률이 90% 이상일 때',
        metric: 'cpu_usage',
        operator: '>=',
        threshold: 90,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 5,
        actions: [
          { type: 'notification', config: { immediate: true } },
          { type: 'log', config: { level: 'error' } }
        ],
        conditions: {
          duration: 30 // 30초 지속 시
        }
      },
      {
        id: 'cpu-warning',
        name: 'CPU 사용률 경고',
        description: 'CPU 사용률이 80% 이상일 때',
        metric: 'cpu_usage',
        operator: '>=',
        threshold: 80,
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 10,
        actions: [
          { type: 'notification', config: { immediate: false } },
          { type: 'log', config: { level: 'warn' } }
        ],
        conditions: {
          duration: 60 // 1분 지속 시
        }
      },
      {
        id: 'memory-critical',
        name: '메모리 부족 위험',
        description: '메모리 사용률이 95% 이상일 때',
        metric: 'memory_usage',
        operator: '>=',
        threshold: 95,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 3,
        actions: [
          { type: 'notification', config: { immediate: true } },
          { type: 'log', config: { level: 'error' } }
        ]
      },
      {
        id: 'memory-warning',
        name: '메모리 사용률 경고',
        description: '메모리 사용률이 85% 이상일 때',
        metric: 'memory_usage',
        operator: '>=',
        threshold: 85,
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 15,
        actions: [
          { type: 'notification', config: { immediate: false } },
          { type: 'log', config: { level: 'warn' } }
        ]
      },
      {
        id: 'disk-critical',
        name: '디스크 공간 부족',
        description: '디스크 사용률이 95% 이상일 때',
        metric: 'disk_usage',
        operator: '>=',
        threshold: 95,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 30,
        actions: [
          { type: 'notification', config: { immediate: true } },
          { type: 'log', config: { level: 'error' } }
        ]
      },
      {
        id: 'response-time-critical',
        name: '응답 시간 지연',
        description: '응답 시간이 2초 이상일 때',
        metric: 'response_time',
        operator: '>=',
        threshold: 2000,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 5,
        actions: [
          { type: 'notification', config: { immediate: true } },
          { type: 'log', config: { level: 'error' } }
        ]
      }
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  /**
   * 모니터링 시작
   */
  startMonitoring() {
    if (this.isMonitoring) {
      console.log('⚠️ 알림 시스템이 이미 실행 중입니다.');
      return;
    }

    console.log('🚨 알림 시스템 모니터링 시작');
    this.isMonitoring = true;

    // 설정된 간격으로 메트릭 확인
    this.monitoringInterval = setInterval(async () => {
      await this.checkMetrics();
    }, this.config.checkInterval);
  }

  /**
   * 모니터링 중지
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('🚨 알림 시스템 모니터링 중지');
  }

  /**
   * 메트릭 확인 및 알림 생성
   */
  private async checkMetrics() {
    try {
      const servers = virtualServerManager.getServers();
      
      for (const server of servers) {
        const metrics = await virtualServerManager.getLatestMetrics(server.id);
        if (metrics) {
          await this.evaluateMetrics(server, metrics);
        }
      }
    } catch (error) {
      console.error('메트릭 확인 중 오류:', error);
    }
  }

  /**
   * 메트릭 평가 및 알림 생성
   */
  private async evaluateMetrics(server: any, metrics: ServerMetrics) {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // 서버 타입 조건 확인
      if (rule.conditions?.serverTypes && !rule.conditions.serverTypes.includes(server.type)) {
        continue;
      }

      // 환경 조건 확인
      if (rule.conditions?.environments && !rule.conditions.environments.includes(server.environment)) {
        continue;
      }

      const metricValue = this.getMetricValue(metrics, rule.metric);
      const isTriggered = this.evaluateCondition(metricValue, rule.operator, rule.threshold);

      if (isTriggered) {
        await this.handleTriggeredRule(server, metrics, rule, metricValue);
      }
    }
  }

  /**
   * 메트릭 값 추출
   */
  private getMetricValue(metrics: ServerMetrics, metric: string): number {
    switch (metric) {
      case 'cpu_usage': return metrics.cpu_usage;
      case 'memory_usage': return metrics.memory_usage;
      case 'disk_usage': return metrics.disk_usage;
      case 'response_time': return metrics.response_time;
      default: return 0;
    }
  }

  /**
   * 조건 평가
   */
  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '==': return value === threshold;
      case '!=': return value !== threshold;
      default: return false;
    }
  }

  /**
   * 트리거된 규칙 처리
   */
  private async handleTriggeredRule(server: any, metrics: ServerMetrics, rule: AlertRule, value: number) {
    const cooldownKey = `${server.id}-${rule.id}`;
    const lastAlert = this.cooldownTracker.get(cooldownKey);
    
    // 쿨다운 확인
    if (lastAlert) {
      const cooldownMs = rule.cooldownMinutes * 60 * 1000;
      if (Date.now() - lastAlert.getTime() < cooldownMs) {
        return; // 쿨다운 중
      }
    }

    // 알림 생성
    const alert = this.createAlert(server, rule, value);
    
    // 알림 저장
    this.alerts.set(alert.id, alert);
    this.alertHistory.push(alert);
    
    // 쿨다운 설정
    this.cooldownTracker.set(cooldownKey, new Date());
    
    // 액션 실행
    await this.executeActions(alert, rule.actions);
    
    // 리스너에게 알림
    this.notifyListeners(alert);
    
    console.log(`🚨 알림 생성: ${alert.message}`);
  }

  /**
   * 알림 생성
   */
  private createAlert(server: any, rule: AlertRule, value: number): Alert {
    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: alertId,
      ruleId: rule.id,
      serverId: server.id,
      hostname: server.hostname,
      metric: rule.metric,
      value,
      threshold: rule.threshold,
      severity: rule.severity,
      message: this.generateAlertMessage(server, rule, value),
      timestamp: new Date(),
      acknowledged: false,
      resolved: false
    };
  }

  /**
   * 알림 메시지 생성
   */
  private generateAlertMessage(server: any, rule: AlertRule, value: number): string {
    const metricUnit = this.getMetricUnit(rule.metric);
    return `${server.hostname}: ${rule.name} - ${rule.metric} ${value}${metricUnit} (임계값: ${rule.threshold}${metricUnit})`;
  }

  /**
   * 메트릭 단위 반환
   */
  private getMetricUnit(metric: string): string {
    switch (metric) {
      case 'cpu_usage':
      case 'memory_usage':
      case 'disk_usage':
        return '%';
      case 'response_time':
        return 'ms';
      default:
        return '';
    }
  }

  /**
   * 액션 실행
   */
  private async executeActions(alert: Alert, actions: AlertAction[]) {
    for (const action of actions) {
      try {
        await this.executeAction(alert, action);
      } catch (error) {
        console.error(`액션 실행 실패 (${action.type}):`, error);
      }
    }
  }

  /**
   * 개별 액션 실행
   */
  private async executeAction(alert: Alert, action: AlertAction) {
    switch (action.type) {
      case 'notification':
        this.sendNotification(alert, action.config);
        break;
      case 'log':
        this.logAlert(alert, action.config);
        break;
      case 'email':
        await this.sendEmail(alert, action.config);
        break;
      case 'webhook':
        await this.sendWebhook(alert, action.config);
        break;
    }
  }

  /**
   * 알림 전송
   */
  private sendNotification(alert: Alert, config: any) {
    // 브라우저 알림 또는 WebSocket을 통한 실시간 알림
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`${alert.severity.toUpperCase()}: ${alert.hostname}`, {
          body: alert.message,
          icon: '/favicon.ico'
        });
      }
    }
  }

  /**
   * 로그 기록
   */
  private logAlert(alert: Alert, config: any) {
    const level = config.level || 'info';
    switch (level) {
      case 'error':
        console.error(`[ALERT] ${alert.message}`);
        break;
      case 'warn':
        console.warn(`[ALERT] ${alert.message}`);
        break;
      case 'info':
      default:
        console.info(`[ALERT] ${alert.message}`);
        break;
    }
  }

  /**
   * 이메일 전송 (구현 예정)
   */
  private async sendEmail(alert: Alert, config: any) {
    // 이메일 전송 로직 구현
    console.log('📧 이메일 알림:', alert.message);
  }

  /**
   * 웹훅 전송 (구현 예정)
   */
  private async sendWebhook(alert: Alert, config: any) {
    // 웹훅 전송 로직 구현
    console.log('🔗 웹훅 알림:', alert.message);
  }

  /**
   * 알림 확인
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string) {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.acknowledged) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date();
      console.log(`✅ 알림 확인됨: ${alert.message}`);
    }
  }

  /**
   * 알림 해결
   */
  resolveAlert(alertId: string) {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.alerts.delete(alertId);
      console.log(`✅ 알림 해결됨: ${alert.message}`);
    }
  }

  /**
   * 활성 알림 조회
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * 알림 히스토리 조회
   */
  getAlertHistory(limit?: number): Alert[] {
    const history = [...this.alertHistory].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * 알림 통계
   */
  getAlertStats(): AlertStats {
    const activeAlerts = this.getActiveAlerts();
    const stats: AlertStats = {
      total: this.alertHistory.length,
      active: activeAlerts.length,
      acknowledged: activeAlerts.filter(a => a.acknowledged).length,
      resolved: this.alertHistory.filter(a => a.resolved).length,
      byServerity: {
        info: 0,
        warning: 0,
        critical: 0
      },
      byServer: {}
    };

    // 심각도별 통계
    activeAlerts.forEach(alert => {
      stats.byServerity[alert.severity]++;
    });

    // 서버별 통계
    activeAlerts.forEach(alert => {
      stats.byServer[alert.serverId] = (stats.byServer[alert.serverId] || 0) + 1;
    });

    return stats;
  }

  /**
   * 알림 규칙 추가
   */
  addRule(rule: AlertRule) {
    this.rules.set(rule.id, rule);
  }

  /**
   * 알림 규칙 수정
   */
  updateRule(ruleId: string, updates: Partial<AlertRule>) {
    const rule = this.rules.get(ruleId);
    if (rule) {
      Object.assign(rule, updates);
    }
  }

  /**
   * 알림 규칙 삭제
   */
  deleteRule(ruleId: string) {
    this.rules.delete(ruleId);
  }

  /**
   * 알림 규칙 조회
   */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * 리스너 등록
   */
  onAlert(listener: (alert: Alert) => void) {
    this.listeners.add(listener);
  }

  /**
   * 리스너 제거
   */
  offAlert(listener: (alert: Alert) => void) {
    this.listeners.delete(listener);
  }

  /**
   * 리스너에게 알림
   */
  private notifyListeners(alert: Alert) {
    this.listeners.forEach(listener => {
      try {
        listener(alert);
      } catch (error) {
        console.error('알림 리스너 실행 오류:', error);
      }
    });
  }

  /**
   * 모니터링 상태 확인
   */
  get isRunning(): boolean {
    return this.isMonitoring;
  }
}

// 싱글톤 인스턴스
export const alertSystem = AlertSystem.getInstance(); 