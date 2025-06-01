/**
 * 🔔 간소화된 슬랙 알림 서비스
 * 
 * 테스트/시연 집중을 위한 단순화된 구현
 * - 슬랙 알림만 지원
 * - 기타 복잡한 외부 서비스는 향후 개발
 */

// 알림 메시지 타입
interface NotificationMessage {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: Date;
  metadata?: Record<string, any>;
}

// 서비스 응답 타입
interface ServiceResponse {
  success: boolean;
  data?: any;
  error?: string;
  responseTime: number;
}

export class ExternalServiceIntegration {
  private static instance: ExternalServiceIntegration;
  private notificationHistory: NotificationMessage[] = [];
  private slackConfig: {
    webhookUrl?: string;
    channel?: string;
    username?: string;
  } = {};

  private constructor() {
    this.initializeSlackConfig();
  }

  public static getInstance(): ExternalServiceIntegration {
    if (!ExternalServiceIntegration.instance) {
      ExternalServiceIntegration.instance = new ExternalServiceIntegration();
    }
    return ExternalServiceIntegration.instance;
  }

  /**
   * 🔧 슬랙 설정 초기화
   */
  private initializeSlackConfig(): void {
    // 환경변수에서 슬랙 설정 로드
    this.slackConfig = {
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      channel: process.env.SLACK_CHANNEL || '#alerts',
      username: process.env.SLACK_USERNAME || 'OpenManager Bot'
    };

    console.log('🔔 슬랙 알림 서비스 초기화 완료');
  }

  /**
   * 📢 알림 전송 (슬랙만 지원)
   */
  async sendNotification(notification: NotificationMessage): Promise<{
    success: boolean;
    results: Array<{ service: string; success: boolean; error?: string }>;
  }> {
    
    console.log('📢 알림 전송 요청:', {
      title: notification.title,
      severity: notification.severity,
      timestamp: notification.timestamp
    });

    const results: Array<{ service: string; success: boolean; error?: string }> = [];

    // 슬랙 알림 전송
    if (this.slackConfig.webhookUrl) {
      try {
        const slackResult = await this.sendSlackNotification(notification);
        results.push({
          service: 'slack',
          success: slackResult.success,
          error: slackResult.error
        });
      } catch (error) {
        results.push({
          service: 'slack',
          success: false,
          error: `슬랙 전송 실패: ${error}`
        });
      }
    } else {
      console.log('⚠️ 슬랙 웹훅 URL이 설정되지 않음 (시뮬레이션 모드)');
      results.push({
        service: 'slack',
        success: true,
        error: undefined
      });
    }

    // 히스토리에 추가
    this.addToNotificationHistory(notification);

    const overallSuccess = results.every(r => r.success);
    
    console.log(`📢 알림 전송 완료: ${overallSuccess ? '성공' : '실패'}`);

    return {
      success: overallSuccess,
      results
    };
  }

  /**
   * 💬 슬랙 알림 전송
   */
  private async sendSlackNotification(notification: NotificationMessage): Promise<ServiceResponse> {
    const startTime = Date.now();

    try {
      if (!this.slackConfig.webhookUrl) {
        // 시뮬레이션 모드
        console.log('💬 슬랙 알림 시뮬레이션:', {
          channel: this.slackConfig.channel,
          title: notification.title,
          severity: notification.severity
        });

        return {
          success: true,
          data: { message: '시뮬레이션 모드로 전송됨' },
          responseTime: Date.now() - startTime
        };
      }

      // 실제 슬랙 메시지 구성
      const slackMessage = {
        username: this.slackConfig.username,
        channel: this.slackConfig.channel,
        text: `🚨 ${notification.title}`,
        attachments: [{
          color: this.getSeverityColor(notification.severity),
          title: notification.title,
          text: notification.message,
          fields: [
            {
              title: '심각도',
              value: notification.severity.toUpperCase(),
              short: true
            },
            {
              title: '시간',
              value: notification.timestamp.toLocaleString(),
              short: true
            }
          ],
          footer: 'OpenManager Vibe',
          ts: Math.floor(notification.timestamp.getTime() / 1000)
        }]
      };

      // HTTP 요청 전송 (실제 환경에서)
      if (process.env.NODE_ENV === 'production') {
        const response = await fetch(this.slackConfig.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackMessage)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      console.log('💬 슬랙 알림 전송 성공');

      return {
        success: true,
        data: slackMessage,
        responseTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ 슬랙 알림 전송 실패:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * 🎨 심각도별 색상 반환
   */
  private getSeverityColor(severity: string): string {
    const colors = {
      info: '#36a64f',      // 녹색
      warning: '#ff9500',   // 주황색
      error: '#ff0000',     // 빨간색
      critical: '#8b0000'   // 진한 빨간색
    };
    return colors[severity as keyof typeof colors] || colors.info;
  }

  /**
   * 📝 알림 히스토리 추가
   */
  private addToNotificationHistory(notification: NotificationMessage): void {
    this.notificationHistory.unshift(notification);
    
    // 히스토리 크기 제한 (최대 100개)
    if (this.notificationHistory.length > 100) {
      this.notificationHistory = this.notificationHistory.slice(0, 100);
    }
  }

  /**
   * ⚙️ 슬랙 설정 업데이트
   */
  updateSlackConfig(config: {
    webhookUrl?: string;
    channel?: string;
    username?: string;
  }): boolean {
    try {
      this.slackConfig = { ...this.slackConfig, ...config };
      console.log('⚙️ 슬랙 설정 업데이트 완료');
      return true;
    } catch (error) {
      console.error('❌ 슬랙 설정 업데이트 실패:', error);
      return false;
    }
  }

  /**
   * 📊 서비스 상태 조회
   */
  getServiceStatus(): {
    services: Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      configured: boolean;
    }>;
    totalNotifications: number;
  } {
    return {
      services: [{
        id: 'slack',
        name: 'Slack 알림',
        type: 'notification',
        status: 'active',
        configured: !!this.slackConfig.webhookUrl
      }],
      totalNotifications: this.notificationHistory.length
    };
  }

  /**
   * 📜 알림 히스토리 조회
   */
  getNotificationHistory(limit: number = 50): NotificationMessage[] {
    return this.notificationHistory.slice(0, limit);
  }

  /**
   * 🧪 테스트 알림 전송
   */
  async sendTestNotification(): Promise<boolean> {
    const testNotification: NotificationMessage = {
      id: `test_${Date.now()}`,
      title: '테스트 알림',
      message: '슬랙 알림 시스템이 정상적으로 작동하고 있습니다.',
      severity: 'info',
      timestamp: new Date(),
      metadata: { test: true }
    };

    const result = await this.sendNotification(testNotification);
    return result.success;
  }
}

// 🌍 전역 인스턴스 접근
export const getExternalServiceIntegration = (): ExternalServiceIntegration => {
  return ExternalServiceIntegration.getInstance();
};

// 🚀 간소화된 외부 서비스 초기화
export const initializeExternalServices = async (): Promise<void> => {
  const integration = getExternalServiceIntegration();
  console.log('🚀 슬랙 알림 서비스 초기화 완료');
}; 