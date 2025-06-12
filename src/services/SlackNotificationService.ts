/**
 * 📱 OpenManager Slack 알림 시스템 v2.0
 *
 * 실시간 알림 기능:
 * - 서버 장애 알림
 * - 메모리 사용률 경고
 * - 시스템 상태 변화 알림
 * - 주기적 상태 리포트
 */

import { BrowserNotificationService } from '@/services/notifications/BrowserNotificationService';

// 🚫 Slack 기능 전면 비활성화 (2025-06 데모 전용)
const SLACK_DISABLED = true;

interface SlackMessage {
  text: string;
  blocks?: any[];
  channel?: string;
  username?: string;
  icon_emoji?: string;
}

interface AlertSeverity {
  level: 'info' | 'warning' | 'critical' | 'recovery';
  color: string;
  emoji: string;
}

interface ServerAlert {
  serverId: string;
  hostname: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'warning' | 'critical';
  timestamp: string;
}

interface MemoryAlert {
  usagePercent: number;
  heapUsed: number;
  heapTotal: number;
  severity: 'warning' | 'critical';
  timestamp: string;
}

interface AnomalyAlert {
  serverId: string;
  metric: string;
  currentValue: number;
  expectedValue: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  recommendations: string[];
  timestamp: string;
}

const browser = new BrowserNotificationService();

interface ServerAlertStub {
  serverId: string;
  hostname: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
}

/**
 * 📴 SlackNotificationService (stub)
 *
 * 모든 메서드는 브라우저 알림으로 대체되며, 실제 Slack 호출은 수행하지 않습니다.
 * 기존 API 시그니처만 유지해 다른 코드 변경 없이 교체 가능합니다.
 */
export class SlackNotificationService {
  private static instance: SlackNotificationService | null = null;

  static getInstance(): SlackNotificationService {
    if (!SlackNotificationService.instance) {
      SlackNotificationService.instance = new SlackNotificationService();
    }
    return SlackNotificationService.instance;
  }

  // ────────────────────────────────────────────────────────────
  //  기존 인터페이스 구현 (BrowserNotificationService 로 위임)
  // ────────────────────────────────────────────────────────────

  async sendServerAlert(alert: ServerAlertStub): Promise<boolean> {
    return browser.sendServerAlert(
      alert.serverId,
      alert.hostname,
      alert.severity as any,
      `${alert.metric.toUpperCase()} ${alert.value}% (임계 ${alert.threshold}%)`,
      {
        cpu: alert.metric === 'cpu_usage' ? alert.value : undefined,
        memory: alert.metric === 'memory_usage' ? alert.value : undefined,
        disk: alert.metric === 'disk_usage' ? alert.value : undefined,
      }
    );
  }

  async sendSystemNotification(
    message: string,
    severity: 'info' | 'warning' | 'critical' = 'info'
  ): Promise<boolean> {
    return browser.sendSystemAlert('시스템 알림', message, severity);
  }

  // 以下 메서드는 더 이상 사용되지 않지만, 타입 호환을 위해 no-op 으로 남겨둡니다.
  async sendMemoryAlert(): Promise<boolean> {
    return false;
  }
  async sendAnomalyAlert(alert?: Partial<AnomalyAlert>): Promise<boolean> {
    if (!alert) return false;
    const title = `이상 탐지: ${alert.metric ?? '알 수 없음'}`;
    const message = `${alert.description ?? '이상 징후가 감지되었습니다.'} (현재값: ${alert.currentValue ?? 'N/A'})`;
    return browser.sendSystemAlert(title, message, 'warning');
  }
  async sendWeeklyReport(): Promise<boolean> {
    return false;
  }

  // 설정/상태 관련 메서드 (모두 비활성화 값 반환)
  updateConfig(): void {
    /* no-op */
  }
  getStatus() {
    return {
      enabled: false,
      webhook: false,
      channel: 'browser',
      alertsSent: 0,
    } as const;
  }
}

// 기존 default export 패턴 유지
export const slackNotificationService = SlackNotificationService.getInstance();
