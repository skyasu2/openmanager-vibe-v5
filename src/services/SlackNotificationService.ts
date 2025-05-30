/**
 * 📱 OpenManager Slack 알림 시스템 v2.0
 * 
 * 실시간 알림 기능:
 * - 서버 장애 알림
 * - 메모리 사용률 경고
 * - 시스템 상태 변화 알림
 * - 주기적 상태 리포트
 */

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

export class SlackNotificationService {
  private static instance: SlackNotificationService;
  private webhookUrl: string | null = null;
  private defaultChannel: string = '#openmanager-alerts';
  private isEnabled: boolean = false;
  private alertHistory: Map<string, number> = new Map(); // 스팸 방지용
  private readonly ALERT_COOLDOWN = 300000; // 5분 쿨다운

  static getInstance(): SlackNotificationService {
    if (!this.instance) {
      this.instance = new SlackNotificationService();
    }
    return this.instance;
  }

  constructor() {
    this.initialize();
  }

  /**
   * 🔧 서비스 초기화
   */
  private initialize(): void {
    // 환경변수에서 Slack 웹훅 URL 가져오기
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || null;
    this.defaultChannel = process.env.SLACK_DEFAULT_CHANNEL || '#openmanager-alerts';
    this.isEnabled = !!this.webhookUrl;

    if (this.isEnabled) {
      console.log('📱 Slack 알림 서비스 활성화됨');
      // 서비스 시작 알림
      this.sendSystemNotification(
        '🚀 OpenManager 알림 시스템이 시작되었습니다',
        'info'
      );
    } else {
      console.warn('⚠️ Slack 웹훅 URL이 설정되지 않음 - 알림 비활성화');
    }
  }

  /**
   * 📊 서버 장애 알림
   */
  async sendServerAlert(alert: ServerAlert): Promise<boolean> {
    if (!this.isEnabled) return false;

    const alertKey = `${alert.serverId}-${alert.metric}-${alert.severity}`;
    
    // 스팸 방지: 같은 알림이 5분 내에 발생했으면 무시
    const lastAlert = this.alertHistory.get(alertKey);
    if (lastAlert && Date.now() - lastAlert < this.ALERT_COOLDOWN) {
      return false;
    }

    const severity = this.getSeverityConfig(alert.severity);
    
    const message: SlackMessage = {
      text: `${severity.emoji} 서버 알림: ${alert.hostname}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${severity.emoji} 서버 ${alert.severity.toUpperCase()} 알림`
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*서버:* ${alert.hostname}`
            },
            {
              type: "mrkdwn",
              text: `*서버 ID:* ${alert.serverId}`
            },
            {
              type: "mrkdwn",
              text: `*메트릭:* ${this.getMetricDisplayName(alert.metric)}`
            },
            {
              type: "mrkdwn",
              text: `*현재 값:* ${alert.value}${this.getMetricUnit(alert.metric)}`
            },
            {
              type: "mrkdwn",
              text: `*임계값:* ${alert.threshold}${this.getMetricUnit(alert.metric)}`
            },
            {
              type: "mrkdwn",
              text: `*시각:* ${new Date(alert.timestamp).toLocaleString('ko-KR')}`
            }
          ]
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `🔗 <http://localhost:3000/dashboard/realtime|실시간 대시보드에서 확인>`
            }
          ]
        }
      ]
    };

    // 색상 추가 (attachment 스타일)
    const payload = {
      ...message,
      attachments: [
        {
          color: severity.color,
          blocks: message.blocks
        }
      ]
    };

    const success = await this.sendSlackMessage(payload);
    if (success) {
      this.alertHistory.set(alertKey, Date.now());
    }

    return success;
  }

  /**
   * 🧠 메모리 알림
   */
  async sendMemoryAlert(alert: MemoryAlert): Promise<boolean> {
    if (!this.isEnabled) return false;

    const alertKey = `memory-${alert.severity}`;
    
    // 스팸 방지
    const lastAlert = this.alertHistory.get(alertKey);
    if (lastAlert && Date.now() - lastAlert < this.ALERT_COOLDOWN) {
      return false;
    }

    const severity = this.getSeverityConfig(alert.severity);
    
    const message: SlackMessage = {
      text: `${severity.emoji} 메모리 사용률 ${alert.severity.toUpperCase()}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${severity.emoji} 메모리 사용률 알림`
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*사용률:* ${alert.usagePercent.toFixed(1)}%`
            },
            {
              type: "mrkdwn",
              text: `*사용 메모리:* ${alert.heapUsed}MB`
            },
            {
              type: "mrkdwn",
              text: `*총 메모리:* ${alert.heapTotal}MB`
            },
            {
              type: "mrkdwn",
              text: `*심각도:* ${alert.severity.toUpperCase()}`
            },
            {
              type: "mrkdwn",
              text: `*시각:* ${new Date(alert.timestamp).toLocaleString('ko-KR')}`
            }
          ]
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "🚀 메모리 최적화 실행"
              },
              style: "primary",
              url: "http://localhost:3000/api/system/optimize"
            }
          ]
        }
      ]
    };

    const payload = {
      ...message,
      attachments: [
        {
          color: severity.color,
          blocks: message.blocks
        }
      ]
    };

    const success = await this.sendSlackMessage(payload);
    if (success) {
      this.alertHistory.set(alertKey, Date.now());
    }

    return success;
  }

  /**
   * 🤖 이상 탐지 알림
   */
  async sendAnomalyAlert(alert: AnomalyAlert): Promise<boolean> {
    if (!this.isEnabled) return false;

    const alertKey = `anomaly-${alert.serverId}-${alert.metric}-${alert.severity}`;
    
    // 스팸 방지: 같은 알림이 5분 내에 발생했으면 무시
    const lastAlert = this.alertHistory.get(alertKey);
    if (lastAlert && Date.now() - lastAlert < this.ALERT_COOLDOWN) {
      return false;
    }

    const severity = this.getSeverityConfig(alert.severity);
    
    const message: SlackMessage = {
      text: `${severity.emoji} AI 이상 탐지: ${alert.serverId}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `🤖 AI 이상 탐지 알림 - ${alert.severity.toUpperCase()}`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${alert.description}*`
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*서버 ID:* ${alert.serverId}`
            },
            {
              type: "mrkdwn",
              text: `*메트릭:* ${this.getMetricDisplayName(alert.metric)}`
            },
            {
              type: "mrkdwn",
              text: `*현재 값:* ${alert.currentValue.toFixed(2)}${this.getMetricUnit(alert.metric)}`
            },
            {
              type: "mrkdwn",
              text: `*예상 값:* ${alert.expectedValue.toFixed(2)}${this.getMetricUnit(alert.metric)}`
            },
            {
              type: "mrkdwn",
              text: `*신뢰도:* ${(alert.confidence * 100).toFixed(1)}%`
            },
            {
              type: "mrkdwn",
              text: `*탐지 시각:* ${new Date(alert.timestamp).toLocaleString('ko-KR')}`
            }
          ]
        }
      ]
    };

    // 권장사항이 있으면 추가
    if (alert.recommendations && alert.recommendations.length > 0) {
      message.blocks!.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*🔧 권장 조치사항:*\n${alert.recommendations.map(rec => `• ${rec}`).join('\n')}`
        }
      });
    }

    // 액션 버튼 추가
    message.blocks!.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "📊 대시보드 확인"
          },
          style: "primary",
          url: "http://localhost:3000/dashboard/realtime"
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "🚀 자동 최적화"
          },
          style: "danger",
          url: "http://localhost:3000/api/system/optimize"
        }
      ]
    });

    // 색상 추가 (attachment 스타일)
    const payload = {
      ...message,
      attachments: [
        {
          color: severity.color,
          blocks: message.blocks
        }
      ]
    };

    const success = await this.sendSlackMessage(payload);
    if (success) {
      this.alertHistory.set(alertKey, Date.now());
    }

    return success;
  }

  /**
   * 📈 주간 리포트 알림
   */
  async sendWeeklyReport(reportData: {
    totalServers: number;
    averageUptime: number;
    memoryOptimizations: number;
    criticalAlerts: number;
    warningAlerts: number;
  }): Promise<boolean> {
    if (!this.isEnabled) return false;

    const message: SlackMessage = {
      text: "📊 OpenManager 주간 리포트",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "📊 OpenManager 주간 리포트"
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `지난 주 OpenManager 시스템 운영 현황을 알려드립니다.`
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*🖥️ 모니터링 서버:* ${reportData.totalServers}대`
            },
            {
              type: "mrkdwn",
              text: `*⏱️ 평균 가동시간:* ${reportData.averageUptime.toFixed(1)}시간`
            },
            {
              type: "mrkdwn",
              text: `*🧠 메모리 최적화:* ${reportData.memoryOptimizations}회`
            },
            {
              type: "mrkdwn",
              text: `*🚨 위험 알림:* ${reportData.criticalAlerts}건`
            },
            {
              type: "mrkdwn",
              text: `*⚠️ 경고 알림:* ${reportData.warningAlerts}건`
            }
          ]
        },
        {
          type: "divider"
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `📅 리포트 생성일: ${new Date().toLocaleDateString('ko-KR')}`
            }
          ]
        }
      ]
    };

    return await this.sendSlackMessage(message);
  }

  /**
   * 🔔 시스템 상태 변화 알림
   */
  async sendSystemNotification(message: string, severity: 'info' | 'warning' | 'critical' | 'recovery'): Promise<boolean> {
    if (!this.isEnabled) return false;

    const config = this.getSeverityConfig(severity);
    
    const slackMessage: SlackMessage = {
      text: `${config.emoji} ${message}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${config.emoji} *${message}*`
          }
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `⏰ ${new Date().toLocaleString('ko-KR')}`
            }
          ]
        }
      ]
    };

    const payload = {
      ...slackMessage,
      attachments: [
        {
          color: config.color,
          blocks: slackMessage.blocks
        }
      ]
    };

    return await this.sendSlackMessage(payload);
  }

  /**
   * 📤 Slack 메시지 전송
   */
  private async sendSlackMessage(message: SlackMessage): Promise<boolean> {
    if (!this.webhookUrl) return false;

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: this.defaultChannel,
          username: 'OpenManager Bot',
          icon_emoji: ':robot_face:',
          ...message
        })
      });

      if (response.ok) {
        console.log('📱 Slack 알림 전송 성공');
        return true;
      } else {
        console.error('❌ Slack 알림 전송 실패:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Slack 알림 전송 오류:', error);
      return false;
    }
  }

  /**
   * 🎨 심각도별 설정
   */
  private getSeverityConfig(severity: string): AlertSeverity {
    const configs: Record<string, AlertSeverity> = {
      info: { level: 'info', color: '#36a3d9', emoji: '💡' },
      warning: { level: 'warning', color: '#f59e0b', emoji: '⚠️' },
      critical: { level: 'critical', color: '#ef4444', emoji: '🚨' },
      recovery: { level: 'recovery', color: '#10b981', emoji: '✅' }
    };

    return configs[severity] || configs.info;
  }

  /**
   * 📊 메트릭 표시명
   */
  private getMetricDisplayName(metric: string): string {
    const names: Record<string, string> = {
      cpu_usage: 'CPU 사용률',
      memory_usage: '메모리 사용률',
      disk_usage: '디스크 사용률',
      response_time: '응답 시간',
      network_in: '네트워크 수신',
      network_out: '네트워크 송신'
    };

    return names[metric] || metric;
  }

  /**
   * 📐 메트릭 단위
   */
  private getMetricUnit(metric: string): string {
    const units: Record<string, string> = {
      cpu_usage: '%',
      memory_usage: '%',
      disk_usage: '%',
      response_time: 'ms',
      network_in: 'MB/s',
      network_out: 'MB/s'
    };

    return units[metric] || '';
  }

  /**
   * ⚙️ 설정 업데이트
   */
  updateConfig(webhookUrl?: string, defaultChannel?: string): void {
    if (webhookUrl) {
      this.webhookUrl = webhookUrl;
      this.isEnabled = true;
    }
    if (defaultChannel) {
      this.defaultChannel = defaultChannel;
    }
    
    console.log('📱 Slack 알림 설정 업데이트됨');
  }

  /**
   * 📋 서비스 상태 조회
   */
  getStatus(): {
    enabled: boolean;
    webhook: boolean;
    channel: string;
    alertsSent: number;
  } {
    return {
      enabled: this.isEnabled,
      webhook: !!this.webhookUrl,
      channel: this.defaultChannel,
      alertsSent: this.alertHistory.size
    };
  }
}

// 싱글톤 인스턴스 export
export const slackNotificationService = SlackNotificationService.getInstance(); 