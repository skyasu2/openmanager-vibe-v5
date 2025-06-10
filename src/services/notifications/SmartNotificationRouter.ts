/**
 * 🔔 스마트 통합 알림 라우터 v1.0
 *
 * 기존 시스템과 완전 통합:
 * - SlackNotificationService (기존)
 * - EnhancedToastSystem (기존)
 * - BrowserNotificationService (신규)
 * - 사용자 설정 기반 스마트 라우팅
 */

import { slackNotificationService } from '../SlackNotificationService';
import { EnhancedToastSystem } from '../../components/ui/EnhancedToastSystem';
import { BrowserNotificationService } from './BrowserNotificationService';

// 통합 알림 인터페이스
export interface UnifiedAlert {
  id: string;
  serverId?: string;
  serverName?: string;
  type: 'server' | 'memory' | 'system' | 'performance' | 'security' | 'custom';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  metrics?: {
    cpu?: number;
    memory?: number;
    disk?: number;
    network?: number;
    responseTime?: number;
  };
  actionRequired?: boolean;
  autoResolve?: boolean;
  source?: string;
}

// 사용자 알림 설정
export interface NotificationPreferences {
  userId: string;
  channels: {
    browser: boolean; // 브라우저 알림
    slack: boolean; // 슬랙 알림
    toast: boolean; // 페이지 내 Toast
    websocket: boolean; // 실시간 웹소켓
    database: boolean; // DB 저장 (항상 true)
  };
  severityFilter: {
    browser: 'all' | 'warning' | 'critical';
    slack: 'all' | 'warning' | 'critical';
    toast: 'all' | 'warning' | 'critical';
  };
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "08:00"
    timezone: string; // "Asia/Seoul"
  };
  cooldown: {
    enabled: boolean;
    duration: number; // 분 단위 (기본 5분)
    perAlert: boolean; // 알림별 개별 쿨다운
  };
}

// 알림 전송 결과
export interface NotificationResult {
  id: string;
  channels: {
    browser: { sent: boolean; error?: string };
    slack: { sent: boolean; error?: string };
    toast: { sent: boolean; error?: string };
    database: { sent: boolean; error?: string };
  };
  timestamp: Date;
  preferences: NotificationPreferences;
}

export class SmartNotificationRouter {
  private static instance: SmartNotificationRouter;
  private browserService: BrowserNotificationService;
  private alertHistory: Map<string, number> = new Map();
  private notificationCount: number = 0;

  static getInstance(): SmartNotificationRouter {
    if (!this.instance) {
      this.instance = new SmartNotificationRouter();
    }
    return this.instance;
  }

  constructor() {
    this.browserService = new BrowserNotificationService();
    console.log('🔔 스마트 알림 라우터 초기화 완료');
  }

  /**
   * 🚀 통합 알림 전송 (메인 메서드)
   */
  async sendAlert(
    alert: UnifiedAlert,
    preferences: NotificationPreferences
  ): Promise<NotificationResult> {
    console.log(
      `🔔 통합 알림 처리: ${alert.title} (심각도: ${alert.severity})`
    );

    const result: NotificationResult = {
      id: alert.id,
      channels: {
        browser: { sent: false },
        slack: { sent: false },
        toast: { sent: false },
        database: { sent: false },
      },
      timestamp: new Date(),
      preferences,
    };

    // 쿨다운 체크
    if (!this.shouldSendAlert(alert, preferences)) {
      console.log(`⏰ 쿨다운으로 인해 알림 스킵: ${alert.id}`);
      return result;
    }

    // 조용한 시간 체크
    const activeChannels = this.selectActiveChannels(alert, preferences);

    // 병렬로 모든 채널에 전송
    const tasks = [];

    // 1. Toast 알림 (항상 우선 실행 - 즉시 표시)
    if (activeChannels.toast) {
      tasks.push(this.sendToastNotification(alert, result));
    }

    // 2. 브라우저 알림
    if (activeChannels.browser) {
      tasks.push(this.sendBrowserNotification(alert, result));
    }

    // 3. 슬랙 알림
    if (activeChannels.slack) {
      tasks.push(this.sendSlackNotification(alert, result));
    }

    // 4. 데이터베이스 저장 (항상 실행)
    tasks.push(this.saveToDatabaseLog(alert, result));

    // 모든 알림 병렬 처리
    await Promise.allSettled(tasks);

    // 쿨다운 기록 업데이트
    this.updateCooldown(alert, preferences);
    this.notificationCount++;

    console.log(
      `✅ 통합 알림 처리 완료: ${this.getSuccessCount(result)}개 채널 성공`
    );
    return result;
  }

  /**
   * 🎯 활성 채널 선택 (조용한 시간, 심각도 필터 적용)
   */
  private selectActiveChannels(
    alert: UnifiedAlert,
    preferences: NotificationPreferences
  ): NotificationPreferences['channels'] {
    const isQuietTime = this.isQuietHours(preferences.quietHours);

    return {
      // Toast는 페이지 내에서만 보이므로 조용한 시간 무관
      toast:
        preferences.channels.toast &&
        this.checkSeverityFilter(
          alert.severity,
          preferences.severityFilter.toast
        ),

      // 브라우저 알림: 조용한 시간에는 심각한 알림만
      browser:
        preferences.channels.browser &&
        this.checkSeverityFilter(
          alert.severity,
          preferences.severityFilter.browser
        ) &&
        (!isQuietTime || alert.severity === 'critical'),

      // 슬랙 알림: 조용한 시간에는 심각한 알림만
      slack:
        preferences.channels.slack &&
        this.checkSeverityFilter(
          alert.severity,
          preferences.severityFilter.slack
        ) &&
        (!isQuietTime || alert.severity === 'critical'),

      // WebSocket, DB는 항상 활성
      websocket: preferences.channels.websocket,
      database: true,
    };
  }

  /**
   * 🍞 Toast 알림 전송
   */
  private async sendToastNotification(
    alert: UnifiedAlert,
    result: NotificationResult
  ): Promise<void> {
    try {
      if (alert.type === 'server' && alert.serverName) {
        // 서버 알림용 특별 Toast
        EnhancedToastSystem.showServerAlert({
          id: alert.id,
          serverId: alert.serverId || '',
          serverName: alert.serverName,
          type: 'custom', // EnhancedToastSystem의 타입으로 매핑
          severity: alert.severity,
          message: alert.message,
          timestamp: alert.timestamp,
          actionRequired: alert.actionRequired,
        });
      } else {
        // 일반 알림
        switch (alert.severity) {
          case 'critical':
            EnhancedToastSystem.showError(alert.title, alert.message);
            break;
          case 'warning':
            EnhancedToastSystem.showWarning(alert.title, alert.message);
            break;
          case 'info':
            EnhancedToastSystem.showInfo(alert.title, alert.message);
            break;
        }
      }

      result.channels.toast.sent = true;
    } catch (error) {
      result.channels.toast.error =
        error instanceof Error ? error.message : 'Toast 전송 실패';
      console.error('❌ Toast 알림 실패:', error);
    }
  }

  /**
   * 🌐 브라우저 알림 전송
   */
  private async sendBrowserNotification(
    alert: UnifiedAlert,
    result: NotificationResult
  ): Promise<void> {
    try {
      const sent = await this.browserService.sendNotification({
        title: alert.title,
        body: alert.message,
        icon: '/icons/alert-icon.png',
        badge: '/icons/badge-icon.png',
        tag: `${alert.serverId || 'system'}-${alert.type}`,
        data: {
          alertId: alert.id,
          serverId: alert.serverId,
          severity: alert.severity,
          timestamp: alert.timestamp.getTime(),
        },
        requireInteraction: alert.severity === 'critical',
        silent: alert.severity === 'info',
      });

      result.channels.browser.sent = sent;
    } catch (error) {
      result.channels.browser.error =
        error instanceof Error ? error.message : '브라우저 알림 실패';
      console.error('❌ 브라우저 알림 실패:', error);
    }
  }

  /**
   * 💬 슬랙 알림 전송 (기존 서비스 활용)
   */
  private async sendSlackNotification(
    alert: UnifiedAlert,
    result: NotificationResult
  ): Promise<void> {
    try {
      let sent = false;

      switch (alert.type) {
        case 'server':
          if (alert.serverName && alert.metrics) {
            sent = await slackNotificationService.sendServerAlert({
              serverId: alert.serverId || alert.id,
              hostname: alert.serverName,
              metric: this.getPrimaryMetric(alert.metrics),
              value: this.getPrimaryMetricValue(alert.metrics),
              threshold: this.getThresholdForMetric(alert.metrics),
              severity: alert.severity === 'info' ? 'warning' : alert.severity,
              timestamp: alert.timestamp.toISOString(),
            });
          }
          break;

        case 'memory':
          if (alert.metrics?.memory) {
            sent = await slackNotificationService.sendMemoryAlert({
              usagePercent: alert.metrics.memory,
              heapUsed: Math.round(alert.metrics.memory * 1024 * 1024), // 추정값
              heapTotal: Math.round(100 * 1024 * 1024), // 추정값
              severity: alert.severity === 'info' ? 'warning' : alert.severity,
              timestamp: alert.timestamp.toISOString(),
            });
          }
          break;

        default:
          sent = await slackNotificationService.sendSystemNotification(
            `${alert.title}: ${alert.message}`,
            alert.severity
          );
      }

      result.channels.slack.sent = sent;
    } catch (error) {
      result.channels.slack.error =
        error instanceof Error ? error.message : 'Slack 전송 실패';
      console.error('❌ Slack 알림 실패:', error);
    }
  }

  /**
   * 💾 데이터베이스 로그 저장
   */
  private async saveToDatabaseLog(
    alert: UnifiedAlert,
    result: NotificationResult
  ): Promise<void> {
    try {
      console.log(`💾 DB 로그 저장: ${alert.id} - ${alert.title}`);

      // 로컬 스토리지를 활용한 DB 저장 (개발 환경용)
      const logData = {
        id: alert.id,
        serverId: alert.serverId,
        serverName: alert.serverName,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        timestamp: alert.timestamp.toISOString(),
        metrics: alert.metrics,
        actionRequired: alert.actionRequired,
        autoResolve: alert.autoResolve,
        source: alert.source,
        channels: Object.keys(result.channels).filter(
          ch => result.channels[ch].sent
        ),
        preferences: result.preferences.userId,
        createdAt: new Date().toISOString(),
      };

      // 기존 로그 가져오기
      const existingLogs = JSON.parse(
        localStorage.getItem('notification_logs') || '[]'
      );

      // 새 로그 추가 (최대 1000개 유지)
      const updatedLogs = [logData, ...existingLogs].slice(0, 1000);

      // 로컬 스토리지에 저장
      localStorage.setItem('notification_logs', JSON.stringify(updatedLogs));

      // API 엔드포인트로도 전송 (실제 DB 연동)
      try {
        await fetch('/api/notifications/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logData),
        });
        console.log('✅ 서버 DB 저장 성공');
      } catch (apiError) {
        console.warn('⚠️ 서버 DB 저장 실패, 로컬만 저장됨:', apiError);
      }

      result.channels.database.sent = true;
      console.log('💾 알림 로그 저장 완료:', {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        totalLogs: updatedLogs.length,
      });
    } catch (error) {
      result.channels.database.error =
        error instanceof Error ? error.message : 'DB 저장 실패';
      console.error('❌ DB 로그 저장 실패:', error);
    }
  }

  /**
   * ⏰ 쿨다운 체크
   */
  private shouldSendAlert(
    alert: UnifiedAlert,
    preferences: NotificationPreferences
  ): boolean {
    if (!preferences.cooldown.enabled) return true;

    const key = preferences.cooldown.perAlert
      ? `${alert.serverId || 'system'}-${alert.type}-${alert.severity}`
      : `${alert.serverId || 'system'}-${alert.type}`;

    const lastSent = this.alertHistory.get(key) || 0;
    const cooldownMs = preferences.cooldown.duration * 60 * 1000;

    return Date.now() - lastSent >= cooldownMs;
  }

  /**
   * 📝 쿨다운 기록 업데이트
   */
  private updateCooldown(
    alert: UnifiedAlert,
    preferences: NotificationPreferences
  ): void {
    if (!preferences.cooldown.enabled) return;

    const key = preferences.cooldown.perAlert
      ? `${alert.serverId || 'system'}-${alert.type}-${alert.severity}`
      : `${alert.serverId || 'system'}-${alert.type}`;

    this.alertHistory.set(key, Date.now());

    // 오래된 기록 정리 (24시간 이상)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    for (const [k, timestamp] of this.alertHistory.entries()) {
      if (timestamp < oneDayAgo) {
        this.alertHistory.delete(k);
      }
    }
  }

  /**
   * 🌙 조용한 시간 체크
   */
  private isQuietHours(
    quietHours: NotificationPreferences['quietHours']
  ): boolean {
    if (!quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now
      .toLocaleTimeString('en-GB', { hour12: false })
      .substring(0, 5);

    return currentTime >= quietHours.start || currentTime <= quietHours.end;
  }

  /**
   * 🎯 심각도 필터 체크
   */
  private checkSeverityFilter(
    alertSeverity: UnifiedAlert['severity'],
    filterLevel: 'all' | 'warning' | 'critical'
  ): boolean {
    switch (filterLevel) {
      case 'all':
        return true;
      case 'warning':
        return alertSeverity === 'warning' || alertSeverity === 'critical';
      case 'critical':
        return alertSeverity === 'critical';
      default:
        return true;
    }
  }

  /**
   * 📊 성공한 채널 수 계산
   */
  private getSuccessCount(result: NotificationResult): number {
    return Object.values(result.channels).filter(channel => channel.sent)
      .length;
  }

  /**
   * 🛠️ 유틸리티 메서드들
   */
  private getPrimaryMetric(
    metrics: NonNullable<UnifiedAlert['metrics']>
  ): string {
    if (metrics.cpu !== undefined) return 'cpu_usage';
    if (metrics.memory !== undefined) return 'memory_usage';
    if (metrics.disk !== undefined) return 'disk_usage';
    if (metrics.responseTime !== undefined) return 'response_time';
    return 'unknown';
  }

  private getPrimaryMetricValue(
    metrics: NonNullable<UnifiedAlert['metrics']>
  ): number {
    return (
      metrics.cpu || metrics.memory || metrics.disk || metrics.responseTime || 0
    );
  }

  private getThresholdForMetric(
    metrics: NonNullable<UnifiedAlert['metrics']>
  ): number {
    // 기본 임계값들
    if (metrics.cpu !== undefined) return 85;
    if (metrics.memory !== undefined) return 90;
    if (metrics.disk !== undefined) return 80;
    if (metrics.responseTime !== undefined) return 5000;
    return 100;
  }

  /**
   * 📈 통계 정보
   */
  getStats() {
    return {
      totalNotifications: this.notificationCount,
      activeCooldowns: this.alertHistory.size,
      services: {
        slack: slackNotificationService.getStatus(),
        browser: this.browserService.getStatus(),
        toast: { enabled: true, type: 'EnhancedToastSystem' },
      },
    };
  }
}

// 전역 인스턴스 내보내기
export const smartNotificationRouter = SmartNotificationRouter.getInstance();
