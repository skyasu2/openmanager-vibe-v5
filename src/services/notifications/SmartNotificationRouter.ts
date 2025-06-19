/**
 * 🔔 스마트 통합 알림 라우터 v2.0
 *
 * 웹 알림 전용 시스템:
 * - BrowserNotificationService (브라우저 알림)
 * - EnhancedToastSystem (페이지 내 Toast)
 * - WebSocket 실시간 알림
 * - 사용자 설정 기반 스마트 라우팅
 */

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
    toast: boolean; // 페이지 내 Toast
    websocket: boolean; // 실시간 웹소켓
    database: boolean; // DB 저장 (항상 true)
  };
  severityFilter: {
    browser: 'all' | 'warning' | 'critical';
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

    // 3. 데이터베이스 저장 (항상 실행)
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

      // WebSocket, DB는 항상 활성
      websocket: preferences.channels.websocket,
      database: true,
    };
  }

  /**
   * 🍞 Toast 알림 전송 (기존 EnhancedToastSystem 활용)
   */
  private async sendToastNotification(
    alert: UnifiedAlert,
    result: NotificationResult
  ): Promise<void> {
    try {
      const toastType = this.mapSeverityToToastType(alert.severity);

      // EnhancedToastSystem 사용
      if (typeof window !== 'undefined') {
        const toastEvent = new CustomEvent('show-toast', {
          detail: {
            type: toastType,
            title: alert.title,
            message: alert.message,
            duration: this.getToastDuration(alert.severity),
            action: alert.actionRequired
              ? {
                  label: '확인',
                  onClick: () => console.log(`액션 실행: ${alert.id}`),
                }
              : undefined,
          },
        });
        window.dispatchEvent(toastEvent);
      }

      result.channels.toast.sent = true;
      console.log(`🍞 Toast 알림 전송 성공: ${alert.title}`);
    } catch (error) {
      result.channels.toast.error =
        error instanceof Error ? error.message : 'Toast 전송 실패';
      console.error('❌ Toast 알림 실패:', error);
    }
  }

  /**
   * 🌐 브라우저 알림 전송 (BrowserNotificationService 활용)
   */
  private async sendBrowserNotification(
    alert: UnifiedAlert,
    result: NotificationResult
  ): Promise<void> {
    try {
      let sent = false;

      switch (alert.type) {
        case 'server':
          if (alert.serverName && alert.metrics) {
            sent = await this.browserService.sendServerAlert(
              alert.serverId || alert.id,
              alert.serverName,
              alert.severity,
              alert.message,
              alert.metrics
            );
          }
          break;

        case 'memory':
        case 'system':
        case 'performance':
        case 'security':
        default:
          sent = await this.browserService.sendSystemAlert(
            alert.title,
            alert.message,
            alert.severity
          );
      }

      result.channels.browser.sent = sent;
    } catch (error) {
      result.channels.browser.error =
        error instanceof Error ? error.message : '브라우저 알림 전송 실패';
      console.error('❌ 브라우저 알림 실패:', error);
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
      // 실제 데이터베이스 저장 로직 (Supabase 등)
      const logEntry = {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        serverId: alert.serverId,
        serverName: alert.serverName,
        metrics: alert.metrics,
        timestamp: alert.timestamp.toISOString(),
        actionRequired: alert.actionRequired,
        source: alert.source,
      };

      // 여기에 실제 DB 저장 로직 추가
      console.log('💾 알림 로그 저장:', logEntry);

      result.channels.database.sent = true;
    } catch (error) {
      result.channels.database.error =
        error instanceof Error ? error.message : 'DB 저장 실패';
      console.error('❌ DB 로그 저장 실패:', error);
    }
  }

  // ────────────────────────────────────────────────────────────
  //  유틸리티 메서드들
  // ────────────────────────────────────────────────────────────

  /**
   * 🕐 쿨다운 체크
   */
  private shouldSendAlert(
    alert: UnifiedAlert,
    preferences: NotificationPreferences
  ): boolean {
    if (!preferences.cooldown.enabled) return true;

    const key = preferences.cooldown.perAlert
      ? `${alert.type}-${alert.serverId || alert.id}`
      : 'global';

    const lastSent = this.alertHistory.get(key);
    if (!lastSent) return true;

    const cooldownMs = preferences.cooldown.duration * 60 * 1000;
    return Date.now() - lastSent > cooldownMs;
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
      ? `${alert.type}-${alert.serverId || alert.id}`
      : 'global';

    this.alertHistory.set(key, Date.now());

    // 오래된 기록 정리 (24시간 이상)
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    for (const [k, timestamp] of this.alertHistory.entries()) {
      if (timestamp < cutoff) {
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
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = quietHours.start.split(':').map(Number);
    const [endHour, endMinute] = quietHours.end.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    return startTime <= currentTime && currentTime <= endTime;
  }

  /**
   * 🎯 심각도 필터 체크
   */
  private checkSeverityFilter(
    alertSeverity: UnifiedAlert['severity'],
    filterLevel: 'all' | 'warning' | 'critical'
  ): boolean {
    if (filterLevel === 'all') return true;
    if (filterLevel === 'critical') return alertSeverity === 'critical';
    if (filterLevel === 'warning')
      return alertSeverity === 'warning' || alertSeverity === 'critical';
    return false;
  }

  /**
   * 📊 성공 카운트
   */
  private getSuccessCount(result: NotificationResult): number {
    return Object.values(result.channels).filter(channel => channel.sent)
      .length;
  }

  /**
   * 🍞 Toast 타입 매핑
   */
  private mapSeverityToToastType(
    severity: UnifiedAlert['severity']
  ): 'success' | 'warning' | 'error' | 'info' {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  }

  /**
   * ⏱️ Toast 지속 시간
   */
  private getToastDuration(severity: UnifiedAlert['severity']): number {
    switch (severity) {
      case 'critical':
        return 8000; // 8초
      case 'warning':
        return 5000; // 5초
      case 'info':
        return 3000; // 3초
      default:
        return 4000; // 4초
    }
  }

  /**
   * 📈 통계 정보
   */
  getStats() {
    return {
      totalNotifications: this.notificationCount,
      activeCooldowns: this.alertHistory.size,
      services: {
        browser: this.browserService.getStatus(),
        toast: { enabled: true, type: 'EnhancedToastSystem' },
      },
    };
  }
}

// 싱글톤 인스턴스 export
export const smartNotificationRouter = SmartNotificationRouter.getInstance();
