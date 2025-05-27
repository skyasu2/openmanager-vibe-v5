/**
 * 🔄 WebSocket Client Utility
 * 
 * 실시간 데이터 업데이트를 위한 WebSocket 클라이언트
 * - 서버 메트릭 실시간 스트림
 * - 알림 실시간 전송
 * - 시스템 상태 변경 알림
 */

export interface WebSocketMessage {
  type: 'server_metrics' | 'system_status' | 'alert' | 'notification';
  data: any;
  timestamp: string;
}

export interface ServerMetricsUpdate {
  serverId: string;
  metrics: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    response_time: number;
    status: string;
  };
}

export interface SystemStatusUpdate {
  totalServers: number;
  healthyServers: number;
  warningServers: number;
  criticalServers: number;
  averageCpu: number;
  averageMemory: number;
}

export interface AlertMessage {
  id: string;
  serverId: string;
  hostname: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  timestamp: string;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnecting = false;

  constructor(private url: string) {
    this.initializeListeners();
  }

  private initializeListeners() {
    this.listeners.set('server_metrics', new Set());
    this.listeners.set('system_status', new Set());
    this.listeners.set('alert', new Set());
    this.listeners.set('notification', new Set());
    this.listeners.set('connection', new Set());
  }

  /**
   * WebSocket 연결 시작
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Already connecting'));
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('🔄 WebSocket 연결됨');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.notifyListeners('connection', { status: 'connected' });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('WebSocket 메시지 파싱 오류:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('🔄 WebSocket 연결 종료');
          this.isConnecting = false;
          this.notifyListeners('connection', { status: 'disconnected' });
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket 오류:', error);
          this.isConnecting = false;
          this.notifyListeners('connection', { status: 'error', error });
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * WebSocket 연결 종료
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 메시지 처리
   */
  private handleMessage(message: WebSocketMessage) {
    const { type, data } = message;
    this.notifyListeners(type, data);
  }

  /**
   * 리스너에게 알림
   */
  private notifyListeners(type: string, data: any) {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`리스너 실행 오류 (${type}):`, error);
        }
      });
    }
  }

  /**
   * 재연결 처리
   */
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 WebSocket 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts} (${delay}ms 후)`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('재연결 실패:', error);
        });
      }, delay);
    } else {
      console.error('🔄 WebSocket 재연결 최대 시도 횟수 초과');
      this.notifyListeners('connection', { status: 'failed' });
    }
  }

  /**
   * 이벤트 리스너 등록
   */
  on(type: string, listener: (data: any) => void) {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.add(listener);
    }
  }

  /**
   * 이벤트 리스너 제거
   */
  off(type: string, listener: (data: any) => void) {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * 연결 상태 확인
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * 메시지 전송
   */
  send(message: any) {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket이 연결되지 않음');
    }
  }
}

// 싱글톤 WebSocket 클라이언트
let wsClient: WebSocketClient | null = null;

export function getWebSocketClient(): WebSocketClient {
  if (!wsClient) {
    const wsUrl = process.env.NODE_ENV === 'development' 
      ? 'ws://localhost:3001/ws' 
      : `wss://${window.location.host}/ws`;
    wsClient = new WebSocketClient(wsUrl);
  }
  return wsClient;
}

export function useWebSocket() {
  return getWebSocketClient();
} 