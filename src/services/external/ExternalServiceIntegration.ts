/**
 * 🔗 외부 서비스 통합 관리자
 *
 * 포트폴리오용으로 Slack 기능 제거됨
 * 현재는 콘솔 로깅만 지원
 */

export interface ExternalNotification {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  service: string;
  success: boolean;
  error?: string;
  timestamp: string;
}

export class ExternalServiceIntegration {
  private static instance: ExternalServiceIntegration;

  private constructor() {
    console.log('🔗 외부 서비스 통합 관리자 초기화됨 (콘솔 로깅 모드)');
  }

  public static getInstance(): ExternalServiceIntegration {
    if (!ExternalServiceIntegration.instance) {
      ExternalServiceIntegration.instance = new ExternalServiceIntegration();
    }
    return ExternalServiceIntegration.instance;
  }

  /**
   * 🔔 알림 전송 (콘솔 로깅)
   */
  async sendNotification(
    notification: ExternalNotification
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    try {
      // 콘솔 로깅으로 알림 처리
      const emoji = this.getSeverityEmoji(notification.severity);
      console.log(`${emoji} 시스템 알림: ${notification.title}`);
      console.log('📋 알림 상세:', {
        메시지: notification.message,
        심각도: notification.severity,
        시간: new Date(notification.timestamp).toLocaleString('ko-KR'),
        메타데이터: notification.metadata,
      });

      results.push({
        service: 'console',
        success: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ 알림 처리 오류:', error);
      results.push({
        service: 'console',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }

    return results;
  }

  /**
   * 😀 심각도별 이모지
   */
  private getSeverityEmoji(severity: ExternalNotification['severity']): string {
    const emojis = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🚨',
    };
    return emojis[severity];
  }

  /**
   * 📊 서비스 상태 조회
   */
  getServiceStatus() {
    return [
      {
        id: 'console',
        name: '콘솔 로깅',
        status: 'active',
        configured: true,
        lastUsed: new Date().toISOString(),
      },
    ];
  }

  /**
   * 🧪 연결 테스트
   */
  async testConnections(): Promise<Record<string, boolean>> {
    return {
      console: true, // 콘솔은 항상 사용 가능
    };
  }
}

// 싱글톤 인스턴스 export
export const externalServiceIntegration =
  ExternalServiceIntegration.getInstance();
