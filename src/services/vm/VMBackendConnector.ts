/**
 * 🔌 VM Backend Connector
 *
 * VM AI 백엔드와의 WebSocket 및 HTTP 연결 관리
 */

import { io, Socket } from 'socket.io-client';
import axios, { AxiosInstance } from 'axios';
import { isNotNull } from '@/types/type-utils';

// Type definitions for better type safety
interface SessionContext {
  previousQueries?: string[];
  userPreferences?: Record<string, unknown>;
  sessionData?: Record<string, unknown>;
  [key: string]: unknown;
}

interface SessionMetadata {
  timestamp?: string;
  source?: string;
  messageId?: string;
  [key: string]: unknown;
}

interface AnalysisResult {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  data?: unknown;
  insights?: unknown[];
  recommendations?: string[];
  error?: string;
  [key: string]: unknown;
}

interface StreamResult {
  response?: string;
  content?: string;
  sessionId?: string;
  status: 'completed' | 'partial';
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

interface StreamError {
  message: string;
  code?: string;
  sessionId?: string;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

interface HealthStatus {
  status: 'ok' | 'error' | 'disabled';
  message?: string;
  timestamp?: string;
  services?: Record<string, unknown>;
  [key: string]: unknown;
}

interface JobMetadata {
  createdAt: Date;
  userId?: string;
  priority?: 'low' | 'medium' | 'high';
  [key: string]: unknown;
}

interface VMConfig {
  websocketUrl: string;
  apiBaseUrl: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
  enabled: boolean;
}

interface AISession {
  id: string;
  userId: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: SessionMetadata;
  }>;
  summary: string;
  context: SessionContext;
  metadata: {
    createdAt: Date;
    lastActiveAt: Date;
    messageCount: number;
  };
}

interface DeepAnalysisJob {
  id: string;
  type: 'pattern' | 'anomaly' | 'optimization' | 'prediction' | 'correlation';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  query: string;
  context?: SessionContext;
  result?: AnalysisResult;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  metadata: JobMetadata;
}

interface StreamData {
  type: 'thinking' | 'result' | 'progress' | 'error';
  content: string;
  metadata?: SessionMetadata;
  progress?: number;
}

export class VMBackendConnector {
  private config: VMConfig;
  private socket: Socket | null = null;
  private httpClient: AxiosInstance;
  private connectionAttempts = 0;
  private isConnecting = false;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor() {
    // VM AI 백엔드 환경변수로부터 설정 읽기
    const websocketUrl =
      process.env.NEXT_PUBLIC_VM_WEBSOCKET_URL || 'ws://localhost:3001/ws';
    const vmEnabled =
      process.env.NEXT_PUBLIC_VM_BACKEND_ENABLED === 'true' &&
      websocketUrl !== 'ws://localhost:3001/ws';

    this.config = {
      websocketUrl,
      apiBaseUrl:
        process.env.NEXT_PUBLIC_VM_API_BASE_URL ||
        websocketUrl.replace('ws://', 'http://').replace('/ws', '/api') ||
        'http://localhost:3001/api',
      reconnectAttempts: parseInt(
        process.env.NEXT_PUBLIC_VM_RECONNECT_ATTEMPTS || '5'
      ),
      reconnectDelay: parseInt(
        process.env.NEXT_PUBLIC_VM_RECONNECT_DELAY || '1000'
      ),
      heartbeatInterval: parseInt(
        process.env.NEXT_PUBLIC_VM_HEARTBEAT_INTERVAL || '30000'
      ),
      enabled: vmEnabled,
    };

    // HTTP 클라이언트 설정
    this.httpClient = axios.create({
      baseURL: this.config.apiBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 요청/응답 인터셉터
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('🔥 VM Backend HTTP Error:', error.message);
        // VM 백엔드 연결 실패 시 로컬 모드로 폴백
        return Promise.reject(
          new Error(`VM Backend unavailable: ${error.message}`)
        );
      }
    );
  }

  /**
   * VM 백엔드 사용 가능 여부 확인
   */
  get isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * WebSocket 연결 상태 확인
   */
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * WebSocket 연결 설정
   */
  async connect(): Promise<boolean> {
    if (!this.config.enabled) {
      console.log('🔌 VM Backend is disabled, using local mode');
      return false;
    }

    if (this.socket?.connected || this.isConnecting) {
      return true;
    }

    this.isConnecting = true;

    try {
      console.log('🔌 Connecting to VM Backend:', this.config.websocketUrl);

      this.socket = io(this.config.websocketUrl, {
        reconnection: true,
        reconnectionAttempts: this.config.reconnectAttempts,
        reconnectionDelay: this.config.reconnectDelay,
        transports: ['websocket', 'polling'],
      });

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        if (isNotNull(this.socket)) {
          this.socket.on('connect', () => {
            clearTimeout(timeout);
            this.isConnecting = false;
            this.connectionAttempts = 0;
            console.log('✅ Connected to VM Backend');
            this.startHeartbeat();
            this.setupEventListeners();
            resolve(true);
          });

          this.socket.on('connect_error', (error) => {
            clearTimeout(timeout);
            this.isConnecting = false;
            this.connectionAttempts++;
            console.error('❌ VM Backend connection error:', error.message);
            reject(error);
          });
        } else {
          reject(new Error('Socket is null'));
        }
      });
    } catch (error) {
      this.isConnecting = false;
      console.error('❌ Failed to connect to VM Backend:', error);
      return false;
    }
  }

  /**
   * WebSocket 연결 해제
   */
  disconnect(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    console.log('🔌 Disconnected from VM Backend');
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', () => {
      console.log('🔌 VM Backend disconnected');
      this.stopHeartbeat();
    });

    // AI 스트리밍 이벤트
    this.socket.on('ai:stream:data', (data: StreamData) => {
      this.emit('stream:data', data);
    });

    this.socket.on('ai:stream:complete', (result: StreamResult) => {
      this.emit('stream:complete', result);
    });

    this.socket.on('ai:stream:error', (error: StreamError) => {
      this.emit('stream:error', error);
    });
  }

  /**
   * 하트비트 시작
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat', { timestamp: Date.now() });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * 하트비트 중지
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ===================
  // Session Management
  // ===================

  /**
   * 새 세션 생성
   */
  async createSession(
    userId: string,
    initialContext?: SessionContext
  ): Promise<AISession | null> {
    if (!this.config.enabled) return null;

    try {
      const response = await this.httpClient.post('/ai/session', {
        userId,
        initialContext,
      });
      return response.data.session;
    } catch (error) {
      console.error('❌ Failed to create session:', error);
      return null;
    }
  }

  /**
   * 세션 조회
   */
  async getSession(sessionId: string): Promise<AISession | null> {
    if (!this.config.enabled) return null;

    try {
      const response = await this.httpClient.get(`/ai/session/${sessionId}`);
      return response.data.session;
    } catch (error) {
      console.error('❌ Failed to get session:', error);
      return null;
    }
  }

  /**
   * 세션에 메시지 추가
   */
  async addMessage(
    sessionId: string,
    message: { role: string; content: string; metadata?: SessionMetadata }
  ): Promise<boolean> {
    if (!this.config.enabled) return false;

    try {
      await this.httpClient.post(`/ai/session/${sessionId}/message`, message);
      return true;
    } catch (error) {
      console.error('❌ Failed to add message:', error);
      return false;
    }
  }

  /**
   * 사용자의 모든 세션 조회
   */
  async getUserSessions(userId: string): Promise<AISession[]> {
    if (!this.config.enabled) return [];

    try {
      const response = await this.httpClient.get(`/ai/session/user/${userId}`);
      return response.data.sessions;
    } catch (error) {
      console.error('❌ Failed to get user sessions:', error);
      return [];
    }
  }

  // ===================
  // Deep Analysis
  // ===================

  /**
   * 심층 분석 시작
   */
  async startDeepAnalysis(
    type: string,
    query: string,
    context?: SessionContext
  ): Promise<DeepAnalysisJob | null> {
    if (!this.config.enabled) return null;

    try {
      const response = await this.httpClient.post('/ai/deep-analysis', {
        type,
        query,
        context,
      });
      return response.data.job;
    } catch (error) {
      console.error('❌ Failed to start deep analysis:', error);
      return null;
    }
  }

  /**
   * 분석 작업 상태 조회
   */
  async getAnalysisJob(jobId: string): Promise<DeepAnalysisJob | null> {
    if (!this.config.enabled) return null;

    try {
      const response = await this.httpClient.get(`/ai/deep-analysis/${jobId}`);
      return response.data.job;
    } catch (error) {
      console.error('❌ Failed to get analysis job:', error);
      return null;
    }
  }

  /**
   * 분석 결과 조회
   */
  async getAnalysisResult(jobId: string): Promise<AnalysisResult | null> {
    if (!this.config.enabled) return null;

    try {
      const response = await this.httpClient.get(
        `/ai/deep-analysis/${jobId}/result`
      );
      return response.data.result;
    } catch (error) {
      console.error('❌ Failed to get analysis result:', error);
      return null;
    }
  }

  // ===================
  // Real-time Streaming
  // ===================

  /**
   * AI 스트리밍 시작
   */
  async startAIStream(data: {
    sessionId?: string;
    query: string;
    context?: SessionContext;
  }): Promise<boolean> {
    if (!this.socket?.connected) {
      console.warn('⚠️ WebSocket not connected, attempting to connect...');
      const connected = await this.connect();
      if (!connected) return false;
    }

    try {
      if (isNotNull(this.socket)) {
        this.socket.emit('ai:stream:start', data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to start AI stream:', error);
      return false;
    }
  }

  /**
   * AI 스트리밍 중지
   */
  stopAIStream(): void {
    if (this.socket?.connected) {
      this.socket.emit('ai:stream:stop');
    }
  }

  /**
   * 세션 구독
   */
  subscribeToSession(sessionId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('session:subscribe', sessionId);
    }
  }

  // ===================
  // Health Check
  // ===================

  /**
   * VM 백엔드 상태 확인
   */
  async getHealthStatus(): Promise<HealthStatus> {
    if (!this.config.enabled) {
      return { status: 'disabled', message: 'VM Backend is disabled' };
    }

    try {
      const response = await this.httpClient.get('/health');
      return response.data;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ===================
  // Event Management
  // ===================

  /**
   * 이벤트 리스너 추가
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.add(callback);
    }
  }

  /**
   * 이벤트 리스너 제거
   */
  off(event: string, callback: (...args: any[]) => void): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * 이벤트 발생
   */
  private emit(event: string, data: unknown): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ Event listener error:', error);
        }
      });
    }
  }
}

// 싱글톤 인스턴스
export const vmBackendConnector = new VMBackendConnector();
export default vmBackendConnector;
