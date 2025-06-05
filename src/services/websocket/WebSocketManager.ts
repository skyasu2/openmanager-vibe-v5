/**
 * 🚀 WebSocket Manager v2.0
 * 
 * 실시간 서버 메트릭 스트리밍 및 클라이언트 관리
 * - 실시간 데이터 브로드캐스트
 * - 클라이언트별 구독 관리
 * - 자동 재연결 및 상태 모니터링
 * - 압축 기반 효율적 전송
 */

import { Server as SocketIOServer } from 'socket.io';
import { Observable, Subject, BehaviorSubject, interval } from 'rxjs';
import { map, filter, throttleTime, distinctUntilChanged } from 'rxjs/operators';
import { enhancedDataGenerator, ScenarioType } from '../../utils/enhanced-data-generator';
import { lightweightAnomalyDetector } from '../ai/lightweight-anomaly-detector';

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

export interface MetricStream {
  serverId: string;
  data: any;
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
  
  // 스트림 데이터 소스
  private dataSubject = new Subject<MetricStream>();
  private alertSubject = new Subject<any>();
  
  constructor() {
    this.initializeStreams();
    this.startDataGeneration();
  }
  
  /**
   * 🔌 Socket.IO 서버 초기화
   */
  initialize(server: any): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? ['https://openmanager-vibe-v5.vercel.app', 'https://openmanager-ai-engine.onrender.com']
          : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      connectTimeout: 45000,
      allowEIO3: true
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
        }
      };
      
      this.clients.set(clientId, clientInfo);
      this.updateConnectionCount();
      
      console.log(`✅ 클라이언트 연결: ${clientId} (총 ${this.clients.size}명)`);
      
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
  private initializeStreams(): void {
    // 메인 데이터 스트림들
    const streamTypes = ['server-metrics', 'alerts', 'logs', 'network', 'performance'];
    
    streamTypes.forEach(type => {
      this.streams.set(type, new Subject<MetricStream>());
    });
    
    // 실시간 데이터 구독 및 브로드캐스트
    this.dataSubject.pipe(
      throttleTime(1000), // 1초마다 한 번씩만 전송
      distinctUntilChanged((prev, curr) => 
        prev.serverId === curr.serverId && prev.type === curr.type
      )
    ).subscribe(data => {
      this.broadcastToSubscribers('server-metrics', data);
    });
    
    // 알림 스트림
    this.alertSubject.pipe(
      filter(alert => alert.priority === 'high' || alert.priority === 'critical')
    ).subscribe(alert => {
      this.broadcastToSubscribers('alerts', alert);
    });
  }
  
  /**
   * 📊 실시간 데이터 생성 시작
   */
  private startDataGeneration(): void {
    // 5초마다 새로운 서버 메트릭 생성
    interval(5000).subscribe(() => {
      if (!this.isActive || this.clients.size === 0) return;
      
      try {
        // 다양한 시나리오로 현실적 데이터 생성
        const scenarios: ScenarioType[] = ['normal', 'stress', 'spike'];
        const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        
        const serverMetrics = enhancedDataGenerator.generateRealisticServerMetrics(
          3, // 3개 서버
          randomScenario
        );
        
        serverMetrics.forEach(server => {
          const streamData: MetricStream = {
            serverId: server.serverId,
            data: {
              serverName: server.serverName,
              cpu: server.metrics.cpu,
              memory: server.metrics.memory,
              disk: server.metrics.disk,
              network: {
                bytesIn: server.network.bytesIn,
                bytesOut: server.network.bytesOut,
                latency: server.network.latency
              },
              application: {
                responseTime: server.application.responseTime,
                throughput: server.application.throughput,
                errorRate: server.application.errorRate
              },
              status: server.status,
              scenario: randomScenario
            },
            timestamp: new Date().toISOString(),
            type: 'cpu',
            priority: this.calculatePriority(server.metrics.cpu, server.metrics.memory)
          };
          
          this.dataSubject.next(streamData);
          
          // 임계값 초과 시 알림 발생
          if (server.metrics.cpu > 85 || server.metrics.memory > 90) {
            this.alertSubject.next({
              serverId: server.serverId,
              serverName: server.serverName,
              type: 'threshold_exceeded',
              message: `${server.serverName}: CPU ${server.metrics.cpu.toFixed(1)}%, 메모리 ${server.metrics.memory.toFixed(1)}%`,
              priority: server.metrics.cpu > 95 ? 'critical' : 'high',
              timestamp: new Date().toISOString()
            });
          }
        });
        
      } catch (error) {
        console.error('❌ 데이터 생성 중 오류:', error);
      }
    });
    
    // 30초마다 이상 탐지 실행
    interval(30000).subscribe(async () => {
      if (!this.isActive || this.clients.size === 0) return;
      
      try {
        const testMetrics = enhancedDataGenerator.generateRealisticServerMetrics(10, 'normal');
        const formattedMetrics = testMetrics.map(m => ({
          timestamp: m.timestamp,
          cpu: m.metrics.cpu,
          memory: m.metrics.memory,
          disk: m.metrics.disk
        }));
        
        const anomalyResult = await lightweightAnomalyDetector.detectAnomalies(
          formattedMetrics,
          ['cpu', 'memory'],
          { sensitivity: 0.8 }
        );
        
        if (anomalyResult.anomalies.length > 0) {
          const anomalyAlert: MetricStream = {
            serverId: 'anomaly-detector',
            data: {
              anomalies: anomalyResult.anomalies.slice(0, 3),
              overallScore: anomalyResult.overallScore,
              confidence: anomalyResult.confidence,
              recommendations: anomalyResult.recommendations
            },
            timestamp: new Date().toISOString(),
            type: 'alert',
            priority: 'medium'
          };
          
          this.broadcastToSubscribers('alerts', anomalyAlert);
        }
        
      } catch (error) {
        console.error('❌ 이상 탐지 중 오류:', error);
      }
    });
  }
  
  /**
   * 📢 구독자들에게 브로드캐스트
   */
  private broadcastToSubscribers(streamType: string, data: any): void {
    if (!this.io) return;
    
    const subscribedClients = Array.from(this.clients.values())
      .filter(client => client.subscriptions.has(streamType));
    
    if (subscribedClients.length === 0) return;
    
    subscribedClients.forEach(client => {
      this.io?.to(client.id).emit(streamType, data);
    });
    
    console.log(`📡 ${streamType} 브로드캐스트: ${subscribedClients.length}명 클라이언트`);
  }
  
  /**
   * 🔔 구독 처리
   */
  private handleSubscription(clientId: string, subscription: StreamSubscription): void {
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
    console.log(`❌ 클라이언트 연결 해제: ${clientId} (총 ${this.clients.size}명)`);
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
      version: 'v5.9.3'
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
        '성능 모니터링'
      ],
      instructions: {
        subscribe: 'subscribe 이벤트로 스트림 구독',
        unsubscribe: 'unsubscribe 이벤트로 구독 해제',
        status: 'request-current-status로 현재 상태 요청'
      }
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
   * 🎯 우선순위 계산
   */
  private calculatePriority(cpu: number, memory: number): 'low' | 'medium' | 'high' | 'critical' {
    if (cpu > 95 || memory > 95) return 'critical';
    if (cpu > 85 || memory > 85) return 'high';
    if (cpu > 70 || memory > 70) return 'medium';
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
      uptime: process.uptime()
    };
  }
  
  /**
   * 🔔 수동 알림 발송
   */
  sendAlert(alert: any): void {
    this.alertSubject.next(alert);
  }
  
  /**
   * 📡 커스텀 브로드캐스트
   */
  broadcast(streamType: string, data: any): void {
    this.broadcastToSubscribers(streamType, data);
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
    this.streams.forEach(stream => stream.complete());
    this.streams.clear();
    this.clients.clear();
  }
}

// 싱글톤 인스턴스
export const webSocketManager = new WebSocketManager(); 