// Using mock system for real-time data

import { getThreshold, isCritical, isWarning } from '@/config/rules';
import { adaptGCPMetricsToServerInstances } from '@/utils/server-metrics-adapter';
/**
 * 🚀 WebSocket Manager v2.0
 *
 * 실시간 서버 메트릭 스트리밍 및 클라이언트 관리
 * - 실시간 데이터 브로드캐스트
 * - 클라이언트별 구독 관리
 * - 자동 재연결 및 상태 모니터링
 * - 압축 기반 효율적 전송
 * - 임계값 기반 간단한 알림 (Cloud Run AI 분석은 별도 요청)
 */

import { BehaviorSubject, interval, Subject } from 'rxjs';
import { distinctUntilChanged, filter, throttleTime } from 'rxjs/operators';
// GCPRealDataService 사용
// lightweight-anomaly-detector removed - using AnomalyDetectionService instead

// 🎯 타입 정의
export interface WebSocketClient {
  id: string;
  subscriptions: Set<string>;
  lastSeen: Date;
  metadata: {
    userAgent?: string;
    ip?: string;
    userId?: string;
  };
}

interface MetricData {
  cpu?: number;
  memory?: number;
  disk?: number;
  network?: {
    bytesIn: number;
    bytesOut: number;
  };
  [key: string]: number | { bytesIn: number; bytesOut: number } | undefined;
}

interface AlertData {
  serverId?: string;
  serverName?: string;
  type?: string;
  message?: string;
  priority?: string;
  timestamp?: string;
  anomalies?: Array<{
    serverId: string;
    serverName: string;
    metric_type: string;
    value: number;
    severity: string;
  }>;
  overallScore?: number;
  confidence?: number;
  recommendations?: string[];
  [key: string]:
    | string
    | number
    | string[]
    | Array<{
        serverId: string;
        serverName: string;
        metric_type: string;
        value: number;
        severity: string;
      }>
    | undefined;
}

interface ServerMetricData {
  id: string;
  name: string;
  status: string;
  cpu: number;
  memory: number;
  disk: number;
  network?: number;
  [key: string]: string | number | undefined;
}

interface DataGeneratorResponse {
  data: ServerMetricData[];
}

interface DataGenerator {
  getRealServerMetrics(): Promise<DataGeneratorResponse>;
}

export interface MetricStream {
  serverId: string;
  data: MetricData | AlertData;
  timestamp: string;
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'alert' | 'log';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface StreamSubscription {
  clientId: string;
  streamType: string;
  filters?: {
    serverId?: string;
    priority?: string[];
    features?: string[];
  };
}

export class WebSocketManager {
  private io: SocketIOServer | null = null;
  private clients: Map<string, WebSocketClient> = new Map();
  private streams: Map<string, Subject<MetricStream>> = new Map();
  private connectionCount$ = new BehaviorSubject<number>(0);
  private isActive = false;
  private dataGenerator: DataGenerator; // Mock data generator

  // 스트림 데이터 소스
  private dataSubject = new Subject<MetricStream>();
  private alertSubject = new Subject<AlertData>();

  constructor() {
    // Using mock data generator
    this.dataGenerator = { getRealServerMetrics: async () => ({ data: [] }) };
    this._initializeStreams();
    this.startDataGeneration();
  }

  /**
   * 🔌 Socket.IO 서버 초기화
   */
  _initialize(server: import('http').Server | import('https').Server): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin:
          process.env.NODE_ENV === 'production'
            ? [
                'https://openmanager-vibe-v5.vercel.app',
                'https://openmanager-ai-engine.onrender.com',
              ]
            : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      connectTimeout: 45000,
      allowEIO3: true,
    });

    this.setupEventHandlers();
    this.isActive = true;

    console.log('🚀 WebSocket Manager 초기화 완료');
  }

  /**
   * 📡 이벤트 핸들러 설정
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      const clientId = socket.id;
      const clientInfo: WebSocketClient = {
        id: clientId,
        subscriptions: new Set(),
        lastSeen: new Date(),
        metadata: {
          userAgent: socket.handshake.headers['user-agent'],
          ip: socket.handshake.address,
        },
      };

      this.clients.set(clientId, clientInfo);
      this.updateConnectionCount();

      console.log(
        `✅ 클라이언트 연결: ${clientId} (총 ${this.clients.size}명)`
      );

      // 클라이언트 이벤트 리스너
      socket.on('subscribe', (subscription: StreamSubscription) => {
        this.handleSubscription(clientId, subscription);
      });

      socket.on('unsubscribe', (streamType: string) => {
        this.handleUnsubscription(clientId, streamType);
      });

      socket.on('request-current-status', () => {
        this.sendCurrentStatus(clientId);
      });

      socket.on('disconnect', () => {
        this.handleDisconnection(clientId);
      });

      // 초기 상태 전송
      this.sendWelcomeMessage(clientId);
    });
  }

  /**
   * 🔄 스트림 초기화
   */
  private _initializeStreams(): void {
    // 메인 데이터 스트림들
    const streamTypes = [
      'server-metrics',
      'alerts',
      'logs',
      'network',
      'performance',
    ];

    streamTypes.forEach((type) => {
      this.streams.set(type, new Subject<MetricStream>());
    });

    // 실시간 데이터 구독 및 브로드캐스트
    this.dataSubject
      .pipe(
        throttleTime(1000), // 1초마다 한 번씩만 전송
        distinctUntilChanged(
          (prev, curr) =>
            prev.serverId === curr.serverId && prev.type === curr.type
        )
      )
      .subscribe((data) => {
        this.broadcastToSubscribers('server-metrics', data);
      });

    // 알림 스트림
    this.alertSubject
      .pipe(
        filter(
          (alert) => alert.priority === 'high' || alert.priority === 'critical'
        )
      )
      .subscribe((alert) => {
        this.broadcastToSubscribers('alerts', alert);
      });
  }

  /**
   * 📊 실시간 데이터 생성 시작 - 🎯 데이터 생성기와 동기화 (5초 → 20초)
   */
  private startDataGeneration(): void {
    // 실시간 서버 데이터 브로드캐스트 (20초마다)
    interval(20000).subscribe(() => {
      void (async () => {
        const gcpServerData = await this.dataGenerator
          .getRealServerMetrics()
          .then((response: DataGeneratorResponse) => response.data);
        const allServers = adaptGCPMetricsToServerInstances(gcpServerData);

        const serverMetrics = allServers.map((server) => {
          return {
            id: server.id,
            name: server.name,
            status: server.status,
            metrics: {
              cpu: server.cpu,
              memory: server.memory,
              disk: server.disk,
              network: {
                bytesIn: server.network || 0,
                bytesOut: server.network || 0,
              },
            },
            timestamp: new Date().toISOString(),
          };
        });

        // 임계값 초과 시 알림 발생 (@see src/config/rules/system-rules.json)
        const { isCritical } = await import('@/config/rules');
        if (
          serverMetrics.some(
            (server) =>
              isCritical('cpu', server.metrics.cpu) ||
              isCritical('memory', server.metrics.memory)
          )
        ) {
          this.alertSubject.next({
            serverId: 'anomaly-detector',
            serverName: 'Anomaly Detector',
            type: 'threshold_exceeded',
            message: 'High resource usage detected',
            priority: 'high',
            timestamp: new Date().toISOString(),
          });
        }

        serverMetrics.forEach((server) => {
          const streamData: MetricStream = {
            serverId: server.id,
            data: server.metrics,
            timestamp: server.timestamp,
            type: 'cpu',
            priority: this.calculatePriority(
              server.metrics.cpu,
              server.metrics.memory
            ),
          };

          this.dataSubject.next(streamData);
        });
      })();
    });

    // 30초마다 임계값 기반 경고 확인 (AI 분석은 Cloud Run에서 처리)
    interval(30000).subscribe(() => {
      void (async () => {
        if (!this.isActive || this.clients.size === 0) return;

        try {
          const gcpServerData = await this.dataGenerator
            .getRealServerMetrics()
            .then((response: DataGeneratorResponse) => response.data);
          const allServers = adaptGCPMetricsToServerInstances(gcpServerData);

          // 임계값 기반 알림 (간단한 threshold check)
          const criticalServers: Array<{
            id: string;
            name: string;
            metric: string;
            value: number;
          }> = [];
          const warningServers: Array<{
            id: string;
            name: string;
            metric: string;
            value: number;
          }> = [];

          for (const server of allServers) {
            if (isCritical('cpu', server.cpu)) {
              criticalServers.push({
                id: server.id,
                name: server.name,
                metric: 'cpu',
                value: server.cpu,
              });
            } else if (isWarning('cpu', server.cpu)) {
              warningServers.push({
                id: server.id,
                name: server.name,
                metric: 'cpu',
                value: server.cpu,
              });
            }

            if (isCritical('memory', server.memory)) {
              criticalServers.push({
                id: server.id,
                name: server.name,
                metric: 'memory',
                value: server.memory,
              });
            } else if (isWarning('memory', server.memory)) {
              warningServers.push({
                id: server.id,
                name: server.name,
                metric: 'memory',
                value: server.memory,
              });
            }

            if (isCritical('disk', server.disk)) {
              criticalServers.push({
                id: server.id,
                name: server.name,
                metric: 'disk',
                value: server.disk,
              });
            } else if (isWarning('disk', server.disk)) {
              warningServers.push({
                id: server.id,
                name: server.name,
                metric: 'disk',
                value: server.disk,
              });
            }
          }

          // Critical 알림 발송
          if (criticalServers.length > 0) {
            const criticalAlert: MetricStream = {
              serverId: 'threshold-detector',
              data: {
                serverId: 'threshold-alert',
                serverName: '임계값 모니터링',
                type: 'threshold_exceeded',
                message: `${criticalServers.length}개 항목이 임계치를 초과했습니다`,
                priority: 'critical',
                timestamp: new Date().toISOString(),
                anomalies: criticalServers.map((s) => ({
                  serverId: s.id,
                  serverName: s.name,
                  metric_type: s.metric,
                  value: s.value,
                  severity: 'critical',
                })),
              },
              timestamp: new Date().toISOString(),
              type: 'alert',
              priority: 'critical',
            };

            this.broadcastToSubscribers('alerts', criticalAlert);
            console.log(
              `🚨 CRITICAL 임계값 초과: ${criticalServers.length}개 항목`
            );
          }

          // Warning 알림 발송 (critical보다 낮은 우선순위)
          if (warningServers.length > 0 && criticalServers.length === 0) {
            const warningAlert: MetricStream = {
              serverId: 'threshold-detector',
              data: {
                serverId: 'threshold-alert',
                serverName: '임계값 모니터링',
                type: 'threshold_warning',
                message: `${warningServers.length}개 항목이 경고 수준입니다`,
                priority: 'high',
                timestamp: new Date().toISOString(),
                anomalies: warningServers.map((s) => ({
                  serverId: s.id,
                  serverName: s.name,
                  metric_type: s.metric,
                  value: s.value,
                  severity: 'warning',
                })),
              },
              timestamp: new Date().toISOString(),
              type: 'alert',
              priority: 'high',
            };

            this.broadcastToSubscribers('alerts', warningAlert);
          }
        } catch (error) {
          console.error('❌ 임계값 확인 중 오류:', error);
        }
      })();
    });
  }

  /**
   * 📢 구독자들에게 브로드캐스트
   */
  private broadcastToSubscribers(
    streamType: string,
    data: MetricData | AlertData
  ): void {
    if (!this.io) return;

    const subscribedClients = Array.from(this.clients.values()).filter(
      (client) => client.subscriptions.has(streamType)
    );

    if (subscribedClients.length === 0) return;

    subscribedClients.forEach((client) => {
      this.io?.to(client.id).emit(streamType, data);
    });

    console.log(
      `📡 ${streamType} 브로드캐스트: ${subscribedClients.length}명 클라이언트`
    );
  }

  /**
   * 🔔 구독 처리
   */
  private handleSubscription(
    clientId: string,
    subscription: StreamSubscription
  ): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscriptions.add(subscription.streamType);
    client.lastSeen = new Date();

    console.log(`📝 구독 추가: ${clientId} → ${subscription.streamType}`);

    // 즉시 현재 상태 전송
    this.sendCurrentStatus(clientId);
  }

  /**
   * 🔕 구독 해제 처리
   */
  private handleUnsubscription(clientId: string, streamType: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscriptions.delete(streamType);
    console.log(`📝 구독 해제: ${clientId} → ${streamType}`);
  }

  /**
   * 👋 연결 해제 처리
   */
  private handleDisconnection(clientId: string): void {
    this.clients.delete(clientId);
    this.updateConnectionCount();
    console.log(
      `❌ 클라이언트 연결 해제: ${clientId} (총 ${this.clients.size}명)`
    );
  }

  /**
   * 📊 현재 상태 전송
   */
  private sendCurrentStatus(clientId: string): void {
    if (!this.io) return;

    const status = {
      timestamp: new Date().toISOString(),
      connectionCount: this.clients.size,
      availableStreams: Array.from(this.streams.keys()),
      systemStatus: 'healthy',
      version: 'v5.9.3',
    };

    this.io.to(clientId).emit('current-status', status);
  }

  /**
   * 🎉 환영 메시지 전송
   */
  private sendWelcomeMessage(clientId: string): void {
    if (!this.io) return;

    const welcomeMessage = {
      message: '🚀 OpenManager Vibe 실시간 스트림에 연결되었습니다!',
      features: [
        '실시간 서버 메트릭',
        '즉시 알림',
        '이상 탐지',
        '성능 모니터링',
      ],
      instructions: {
        subscribe: 'subscribe 이벤트로 스트림 구독',
        unsubscribe: 'unsubscribe 이벤트로 구독 해제',
        status: 'request-current-status로 현재 상태 요청',
      },
    };

    this.io.to(clientId).emit('welcome', welcomeMessage);
  }

  /**
   * 📈 연결 수 업데이트
   */
  private updateConnectionCount(): void {
    this.connectionCount$.next(this.clients.size);
  }

  /**
   * 🎯 우선순위 계산 (@see src/config/rules/system-rules.json)
   */
  private calculatePriority(
    cpu: number,
    memory: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    // 외부화된 임계값 사용 (top-level import)
    const cpuThreshold = getThreshold('cpu');
    const memoryThreshold = getThreshold('memory');

    // critical 초과 (임계값 + 10%)
    if (
      cpu > cpuThreshold.critical + 10 ||
      memory > memoryThreshold.critical + 5
    )
      return 'critical';
    // critical 수준
    if (cpu > cpuThreshold.critical || memory > memoryThreshold.critical)
      return 'high';
    // warning 수준
    if (cpu > cpuThreshold.warning || memory > memoryThreshold.warning)
      return 'medium';
    return 'low';
  }

  // === 공개 메서드들 ===

  /**
   * 📊 현재 연결 상태 반환
   */
  getConnectionStats(): {
    totalConnections: number;
    activeStreams: number;
    uptime: number;
  } {
    return {
      totalConnections: this.clients.size,
      activeStreams: this.streams.size,
      uptime:
        typeof process !== 'undefined' && typeof process.uptime === 'function'
          ? process.uptime()
          : 0,
    };
  }

  /**
   * 🔔 수동 알림 발송
   */
  sendAlert(alert: AlertData): void {
    this.alertSubject.next(alert);
  }

  /**
   * 📡 커스텀 브로드캐스트
   */
  broadcast(streamType: string, data: MetricData | AlertData): void {
    this.broadcastToSubscribers(streamType, data);
  }

  /**
   * 🚨 수동 임계값 확인 실행 (AI 분석은 Cloud Run API 사용 권장)
   */
  async analyzeIncident(serverId?: string): Promise<void> {
    try {
      const gcpServerData = await this.dataGenerator
        .getRealServerMetrics()
        .then((response: DataGeneratorResponse) => response.data);
      const allServers = adaptGCPMetricsToServerInstances(gcpServerData);

      // 특정 서버 또는 전체 서버 필터링
      let targetServers = allServers;
      if (serverId) {
        targetServers = allServers.filter((s) => s.id === serverId);
      }

      // 임계값 기반 분석 (AI 분석 없이 단순 threshold check)
      const issues: Array<{
        id: string;
        name: string;
        metric: string;
        value: number;
        severity: 'critical' | 'warning';
      }> = [];

      for (const server of targetServers) {
        if (isCritical('cpu', server.cpu)) {
          issues.push({
            id: server.id,
            name: server.name,
            metric: 'cpu',
            value: server.cpu,
            severity: 'critical',
          });
        } else if (isWarning('cpu', server.cpu)) {
          issues.push({
            id: server.id,
            name: server.name,
            metric: 'cpu',
            value: server.cpu,
            severity: 'warning',
          });
        }
        if (isCritical('memory', server.memory)) {
          issues.push({
            id: server.id,
            name: server.name,
            metric: 'memory',
            value: server.memory,
            severity: 'critical',
          });
        } else if (isWarning('memory', server.memory)) {
          issues.push({
            id: server.id,
            name: server.name,
            metric: 'memory',
            value: server.memory,
            severity: 'warning',
          });
        }
        if (isCritical('disk', server.disk)) {
          issues.push({
            id: server.id,
            name: server.name,
            metric: 'disk',
            value: server.disk,
            severity: 'critical',
          });
        } else if (isWarning('disk', server.disk)) {
          issues.push({
            id: server.id,
            name: server.name,
            metric: 'disk',
            value: server.disk,
            severity: 'warning',
          });
        }
      }

      if (issues.length > 0) {
        const hasCritical = issues.some((i) => i.severity === 'critical');
        const timestamp = new Date().toISOString();

        const manualAlert: MetricStream = {
          serverId: 'manual-analysis',
          data: {
            serverId: 'manual-threshold-check',
            serverName: '수동 임계값 확인',
            type: 'manual_threshold_check',
            message: `${issues.length}개 임계값 이슈 발견 (${hasCritical ? 'Critical' : 'Warning'})`,
            priority: hasCritical ? 'critical' : 'high',
            timestamp,
            anomalies: issues.map((i) => ({
              serverId: i.id,
              serverName: i.name,
              metric_type: i.metric,
              value: i.value,
              severity: i.severity,
            })),
            recommendations: [
              'AI 분석은 /api/ai/supervisor 또는 /api/ai/intelligent-monitoring 호출 권장',
            ],
          },
          timestamp,
          type: 'alert',
          priority: hasCritical ? 'critical' : 'high',
        };

        this.broadcastToSubscribers('alerts', manualAlert);

        console.log(`📋 수동 임계값 확인 완료:`, {
          issues: issues.length,
          severity: hasCritical ? 'critical' : 'warning',
        });
      } else {
        console.log(`✅ 수동 확인 완료: 임계값 이슈 없음`);
      }
    } catch (error) {
      console.error('❌ 수동 임계값 확인 실패:', error);
    }
  }

  /**
   * 🛑 WebSocket 서버 종료
   */
  shutdown(): void {
    this.isActive = false;

    if (this.io) {
      this.io.close();
      console.log('🛑 WebSocket 서버 종료');
    }

    // 모든 스트림 정리
    for (const stream of this.streams.values()) {
      stream.complete();
    }
    this.streams.clear();
    this.clients.clear();
  }
}

// 싱글톤 인스턴스
export const webSocketManager = new WebSocketManager();
