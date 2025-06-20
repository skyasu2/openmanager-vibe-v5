/**
 * 🔔 브라우저 네이티브 알림 서비스
 *
 * ✅ 기능:
 * - 서버 모니터링 심각/경고 상황 웹 알림
 * - 중복 알림 방지 (동일 서버/타입 5분 제한)
 * - 알림 권한 관리
 * - Vercel 환경 최적화
 * - 배치 알림 처리
 */

'use client';

interface NotificationOptions {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  serverId?: string;
  type?: string;
  icon?: string;
  tag?: string;
  silent?: boolean;
  requireInteraction?: boolean;
}

interface NotificationHistory {
  id: string;
  serverId?: string;
  type?: string;
  severity: string;
  timestamp: number;
  title: string;
  message: string;
}

class BrowserNotificationService {
  private permission: NotificationPermission = 'default';
  private isEnabled: boolean = false;
  private notificationHistory: NotificationHistory[] = [];
  private duplicatePreventionTime = 5 * 60 * 1000; // 5분
  private maxHistorySize = 100;
  private pendingNotifications: NotificationOptions[] = [];
  private isProcessing = false;

  constructor() {
    this.initialize();
  }

  /**
   * 🚀 서비스 초기화
   */
  private async initialize(): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('🚫 브라우저가 웹 알림을 지원하지 않습니다.');
      return;
    }

    this.permission = Notification.permission;
    this.isEnabled = this.permission === 'granted';

    // 히스토리 정리 스케줄러
    setInterval(
      () => {
        this.cleanupHistory();
      },
      10 * 60 * 1000
    ); // 10분마다 정리

    console.log('🔔 브라우저 알림 서비스 초기화 완료:', {
      permission: this.permission,
      enabled: this.isEnabled,
    });
  }

  /**
   * 🔐 알림 권한 요청
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    try {
      this.permission = await Notification.requestPermission();
      this.isEnabled = this.permission === 'granted';

      if (this.isEnabled) {
        console.log('✅ 웹 알림 권한 허용됨');
        // 권한 허용 시 대기 중인 알림 처리
        this.processPendingNotifications();
      } else {
        console.warn('⚠️ 웹 알림 권한 거부됨');
      }

      return this.permission;
    } catch (error) {
      console.error('❌ 알림 권한 요청 실패:', error);
      return 'denied';
    }
  }

  /**
   * 🚨 서버 모니터링 알림 전송 (메인 기능)
   */
  async sendServerAlert(options: NotificationOptions): Promise<boolean> {
    // 권한 확인
    if (!this.isEnabled) {
      console.log('🔕 웹 알림 비활성화됨 - 대기열에 추가');
      this.pendingNotifications.push(options);
      return false;
    }

    // 심각도 필터링 (warning 이상만 웹 알림)
    if (options.severity === 'info') {
      console.log('🔕 Info 레벨 알림은 웹 알림에서 제외');
      return false;
    }

    // 중복 방지 검사
    if (this.isDuplicateNotification(options)) {
      console.log('🔄 중복 알림 방지:', options.title);
      return false;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.message,
        icon: options.icon || this.getDefaultIcon(options.severity),
        tag: options.tag || `${options.serverId}-${options.type}`,
        silent: options.silent || false,
        requireInteraction: options.severity === 'critical',
        badge: '/favicon.ico',
        data: {
          serverId: options.serverId,
          type: options.type,
          severity: options.severity,
          timestamp: Date.now(),
        },
      });

      // 알림 이벤트 리스너
      notification.onclick = () => {
        window.focus();
        notification.close();
        // 서버 상세 페이지로 이동 (옵션)
        if (options.serverId) {
          console.log('🖱️ 서버 알림 클릭:', options.serverId);
        }
      };

      notification.onclose = () => {
        console.log('🔔 알림 닫힘:', options.title);
      };

      notification.onerror = error => {
        console.error('❌ 알림 표시 실패:', error);
      };

      // 히스토리에 추가
      this.addToHistory(options);

      // 자동 닫기 (critical이 아닌 경우)
      if (options.severity !== 'critical') {
        setTimeout(() => {
          notification.close();
        }, 8000); // 8초 후 자동 닫기
      }

      console.log('✅ 웹 알림 전송 성공:', options.title);
      return true;
    } catch (error) {
      console.error('❌ 웹 알림 전송 실패:', error);
      return false;
    }
  }

  /**
   * 🔍 중복 알림 검사
   */
  private isDuplicateNotification(options: NotificationOptions): boolean {
    const now = Date.now();
    const key = `${options.serverId}-${options.type}-${options.severity}`;

    return this.notificationHistory.some(item => {
      const itemKey = `${item.serverId}-${item.type}-${item.severity}`;
      const timeDiff = now - item.timestamp;

      return itemKey === key && timeDiff < this.duplicatePreventionTime;
    });
  }

  /**
   * 📝 히스토리에 추가
   */
  private addToHistory(options: NotificationOptions): void {
    const historyItem: NotificationHistory = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      serverId: options.serverId,
      type: options.type,
      severity: options.severity,
      timestamp: Date.now(),
      title: options.title,
      message: options.message,
    };

    this.notificationHistory.unshift(historyItem);

    // 히스토리 크기 제한
    if (this.notificationHistory.length > this.maxHistorySize) {
      this.notificationHistory = this.notificationHistory.slice(
        0,
        this.maxHistorySize
      );
    }
  }

  /**
   * 🧹 히스토리 정리
   */
  private cleanupHistory(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24시간

    const beforeCount = this.notificationHistory.length;
    this.notificationHistory = this.notificationHistory.filter(
      item => now - item.timestamp < maxAge
    );

    const cleanedCount = beforeCount - this.notificationHistory.length;
    if (cleanedCount > 0) {
      console.log(`🧹 알림 히스토리 정리: ${cleanedCount}개 항목 제거`);
    }
  }

  /**
   * 📋 대기 중인 알림 처리
   */
  private async processPendingNotifications(): Promise<void> {
    if (this.isProcessing || this.pendingNotifications.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(
      `📋 대기 중인 알림 처리: ${this.pendingNotifications.length}개`
    );

    const notifications = [...this.pendingNotifications];
    this.pendingNotifications = [];

    for (const notification of notifications) {
      await this.sendServerAlert(notification);
      // 알림 간 간격 (너무 많은 알림 방지)
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.isProcessing = false;
  }

  /**
   * 🎨 기본 아이콘 가져오기
   */
  private getDefaultIcon(severity: string): string {
    switch (severity) {
      case 'critical':
        return '/icons/alert-critical.png';
      case 'warning':
        return '/icons/alert-warning.png';
      default:
        return '/icons/alert-info.png';
    }
  }

  /**
   * 🧪 테스트 알림
   */
  async sendTestNotification(): Promise<boolean> {
    return await this.sendServerAlert({
      title: 'OpenManager 테스트 알림',
      message: '웹 알림이 정상적으로 작동합니다.',
      severity: 'warning',
      serverId: 'test-server',
      type: 'test',
      tag: 'test-notification',
    });
  }

  /**
   * 📊 상태 조회
   */
  getStatus() {
    return {
      permission: this.permission,
      isEnabled: this.isEnabled,
      historyCount: this.notificationHistory.length,
      pendingCount: this.pendingNotifications.length,
      lastNotification: this.notificationHistory[0] || null,
      duplicatePreventionTime: this.duplicatePreventionTime,
      stats: {
        total: this.notificationHistory.length,
        bySeverity: {
          critical: this.notificationHistory.filter(
            n => n.severity === 'critical'
          ).length,
          warning: this.notificationHistory.filter(
            n => n.severity === 'warning'
          ).length,
          info: this.notificationHistory.filter(n => n.severity === 'info')
            .length,
        },
        recent24h: this.notificationHistory.filter(
          n => Date.now() - n.timestamp < 24 * 60 * 60 * 1000
        ).length,
      },
    };
  }

  /**
   * 📜 히스토리 조회
   */
  getHistory(limit: number = 20): NotificationHistory[] {
    return this.notificationHistory.slice(0, limit);
  }

  /**
   * 🧹 히스토리 초기화
   */
  clearHistory(): void {
    this.notificationHistory = [];
    console.log('🧹 알림 히스토리 초기화 완료');
  }

  /**
   * ⚙️ 설정 업데이트
   */
  updateSettings(settings: {
    duplicatePreventionTime?: number;
    maxHistorySize?: number;
  }): void {
    if (settings.duplicatePreventionTime) {
      this.duplicatePreventionTime = settings.duplicatePreventionTime;
    }
    if (settings.maxHistorySize) {
      this.maxHistorySize = settings.maxHistorySize;
    }
    console.log('⚙️ 알림 설정 업데이트:', settings);
  }
}

// 싱글톤 인스턴스
export const browserNotificationService = new BrowserNotificationService();

// 편의 함수들
export const requestNotificationPermission = () =>
  browserNotificationService.requestPermission();

export const sendServerAlert = (options: NotificationOptions) =>
  browserNotificationService.sendServerAlert(options);

export const sendTestNotification = () =>
  browserNotificationService.sendTestNotification();

export const getNotificationStatus = () =>
  browserNotificationService.getStatus();

export const getNotificationHistory = (limit?: number) =>
  browserNotificationService.getHistory(limit);

export default browserNotificationService;
