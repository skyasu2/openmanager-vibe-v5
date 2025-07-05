/**
 * 🔔 브라우저 웹 알림 서비스 (Vercel 최적화)
 *
 * 특징:
 * - 서버 데이터 생성기의 심각/경고 상태 알림만 처리
 * - 통합 상태 판별 기준 사용
 * - 과도한 타이머 제거, 단순한 로직
 * - 30분 세션 기반 전역 상태 관리와 연동
 */

'use client';

import { shouldSendWebNotification } from '@/config/server-status-thresholds';

interface NotificationOptions {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  serverId?: string;
  type: 'server_alert' | 'system_alert' | 'user_action';
  icon?: string;
  tag?: string;
  silent?: boolean;
}

class BrowserNotificationService {
  private isEnabled: boolean = false;
  private permission: NotificationPermission = 'default';
  private notificationHistory: NotificationOptions[] = [];
  private duplicatePreventionTime = 5 * 60 * 1000; // 5분
  private maxHistorySize = 50; // 히스토리 크기 축소 (100 → 50)

  // 서버별 이전 상태 추적 (상태 변화 감지용)
  private previousServerStates = new Map<
    string,
    'healthy' | 'warning' | 'critical'
  >();

  constructor() {
    this.initializePermission();
  }

  /**
   * 🔔 권한 초기화
   */
  private async initializePermission(): Promise<void> {
    // 서버사이드 렌더링 환경 체크
    if (typeof window === 'undefined') {
      // 🚨 빌드 시에는 경고 메시지 출력하지 않음 (Vercel 최적화)
      if (
        process.env.NODE_ENV !== 'production' &&
        process.env.BUILD_TIME_OPTIMIZATION !== 'true'
      ) {
        console.warn('⚠️ 서버 환경에서는 브라우저 알림을 사용할 수 없습니다');
      }
      return;
    }

    if (!('Notification' in window)) {
      console.warn('⚠️ 이 브라우저는 웹 알림을 지원하지 않습니다');
      return;
    }

    this.permission = Notification.permission;

    if (this.permission === 'default') {
      try {
        this.permission = await Notification.requestPermission();
        this.isEnabled = this.permission === 'granted';

        if (this.isEnabled) {
          console.log('✅ 웹 알림 권한이 허용되었습니다');
        }
      } catch (error) {
        console.error('❌ 웹 알림 권한 요청 실패:', error);
      }
    } else {
      this.isEnabled = this.permission === 'granted';
    }
  }

  /**
   * 🚨 서버 상태 알림 처리 (통합 기준 사용)
   */
  processServerNotification(
    serverId: string,
    serverName: string,
    currentStatus: 'healthy' | 'warning' | 'critical'
  ): void {
    if (!this.isEnabled) return;

    const previousStatus = this.previousServerStates.get(serverId);

    // 통합 기준으로 웹 알림 발송 여부 결정
    if (shouldSendWebNotification(currentStatus, previousStatus)) {
      this.sendNotification(
        this.getStatusMessage(serverName, currentStatus, previousStatus),
        currentStatus === 'critical' ? 'critical' : 'warning',
        serverId
      );
    }

    // 현재 상태 저장
    this.previousServerStates.set(serverId, currentStatus);
  }

  /**
   * 📝 상태별 메시지 생성
   */
  private getStatusMessage(
    serverName: string,
    currentStatus: 'healthy' | 'warning' | 'critical',
    previousStatus?: 'healthy' | 'warning' | 'critical'
  ): string {
    if (currentStatus === 'critical') {
      return `🚨 ${serverName} 서버가 심각한 상태입니다`;
    }

    if (currentStatus === 'warning' && previousStatus === 'healthy') {
      return `⚠️ ${serverName} 서버에 주의가 필요합니다`;
    }

    if (
      previousStatus === 'critical' &&
      (currentStatus === 'warning' || currentStatus === 'healthy')
    ) {
      return `✅ ${serverName} 서버가 복구되었습니다`;
    }

    return `📊 ${serverName} 서버 상태가 변경되었습니다`;
  }

  /**
   * 🔔 웹 알림 발송
   */
  private sendNotification(
    message: string,
    type: 'critical' | 'warning' | 'info',
    serverId?: string
  ): void {
    // 브라우저 환경 체크
    if (typeof window === 'undefined') {
      console.warn('⚠️ 서버 환경에서는 웹 알림을 발송할 수 없습니다');
      return;
    }

    if (!this.isEnabled) return;

    try {
      const notification = new Notification('OpenManager 서버 알림', {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: serverId || 'system', // 같은 서버의 알림은 교체
        requireInteraction: type === 'critical', // Critical은 사용자 상호작용 필요
        silent: false,
      });

      // 알림 클릭 이벤트
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // 히스토리에 저장
      this.addToHistory({
        title: 'OpenManager 서버 알림',
        message,
        severity: type === 'critical' ? 'critical' : 'warning',
        serverId,
        type: 'server_alert',
        icon: '/favicon.ico',
        tag: serverId || 'system',
        silent: false,
      });

      console.log(`🔔 웹 알림 발송: ${message}`);
    } catch (error) {
      console.error('❌ 웹 알림 발송 실패:', error);
    }
  }

  /**
   * 📚 히스토리 관리
   */
  private addToHistory(options: NotificationOptions): void {
    this.notificationHistory.unshift(options);

    // 필요시에만 히스토리 정리 (30분 이상 된 항목만 제거)
    if (this.notificationHistory.length > this.maxHistorySize) {
      this.notificationHistory = this.notificationHistory.slice(
        0,
        this.maxHistorySize
      );
    }
  }

  /**
   * 📊 상태 조회
   */
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      permission: this.permission,
      historyCount: this.notificationHistory.length,
      recentNotifications: this.notificationHistory.slice(0, 5),
    };
  }

  /**
   * 🔧 서비스 활성화/비활성화
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled && this.permission === 'granted';
  }

  /**
   * 🧹 히스토리 정리 (수동 호출용)
   */
  clearHistory(): void {
    this.notificationHistory = [];
    this.previousServerStates.clear();
    console.log('🧹 서버 알림 히스토리 초기화 완료');
  }

  /**
   * 🛑 시스템 중지 알림 (새로 추가)
   */
  sendSystemShutdownNotification(reason: string = '30분 자동 종료'): void {
    if (!this.isEnabled) return;

    const title = '🛑 OpenManager 시스템 중지';
    const message = `시스템이 중지되었습니다. (${reason})`;

    this.sendNotification(message, 'warning', 'system-shutdown');

    // 추가: 브라우저 확인 팝업 (선택사항)
    if (typeof window !== 'undefined' && reason === '30분 자동 종료') {
      setTimeout(() => {
        const userConfirm = confirm(
          '⏰ 30분 세션이 종료되었습니다.\n\n새로운 세션을 시작하시겠습니까?'
        );
        if (userConfirm) {
          // 페이지 새로고침으로 새 세션 준비
          window.location.reload();
        }
      }, 2000); // 2초 후 확인 팝업
    }
  }

  /**
   * 🚨 시스템 강제 종료 알림 (새로 추가)
   */
  sendSystemForceShutdownNotification(message: string): void {
    if (!this.isEnabled) return;

    // 브라우저 네이티브 알림
    this.sendNotification(`🚨 ${message}`, 'critical', 'force-shutdown');

    // 즉시 브라우저 알림 팝업
    if (typeof window !== 'undefined') {
      alert(
        `🚨 ${message}\n\n페이지를 새로고침하여 시스템을 다시 시작해주세요.`
      );
    }
  }
}

// 싱글톤 인스턴스
export const browserNotificationService = new BrowserNotificationService();
