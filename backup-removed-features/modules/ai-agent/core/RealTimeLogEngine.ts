/**
 * 🚀 실시간 AI 로그 엔진 v1.0
 * 
 * 실제 AI 에이전트의 로그를 실시간으로 수집, 파싱, 스트리밍
 * - 동적 로그 파서 (AI 엔진 변경에 대응)
 * - 실시간 로그 스트리밍 
 * - 로그 저장 및 관리
 * - WebSocket을 통한 실시간 전송
 */

import { EventEmitter } from 'events';
import { AdminLogger, AIInteractionLog } from './AdminLogger';
import { WebSocketManager } from '../../../services/websocket/WebSocketManager';

export interface RealTimeLogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'DEBUG' | 'PROCESSING' | 'SUCCESS' | 'ERROR' | 'WARNING' | 'ANALYSIS';
  module: string;
  message: string;
  details?: string;
  sessionId: string;
  metadata: {
    processingTime?: number;
    confidence?: number;
    algorithm?: string;
    dataSource?: string;
    apiCall?: boolean;
    cacheHit?: boolean;
    [key: string]: any;
  };
}

export interface LogPattern {
  id: string;
  pattern: RegExp;
  extractor: (match: RegExpMatchArray) => Partial<RealTimeLogEntry>;
  priority: number;
}

export interface ProcessingSession {
  sessionId: string;
  questionId: string;
  question: string;
  startTime: number;
  logs: RealTimeLogEntry[];
  status: 'active' | 'completed' | 'failed';
  metadata: {
    userId?: string;
    category?: string;
    mode?: string;
  };
}

export class RealTimeLogEngine extends EventEmitter {
  private static instance: RealTimeLogEngine | null = null;
  private adminLogger: AdminLogger;
  private webSocketManager: WebSocketManager | null = null;
  private activeSessions: Map<string, ProcessingSession> = new Map();
  private logPatterns: LogPattern[] = [];
  private isInitialized = false;

  constructor() {
    super();
    this.adminLogger = new AdminLogger();
    this.initializeLogPatterns();
  }

  static getInstance(): RealTimeLogEngine {
    if (!RealTimeLogEngine.instance) {
      RealTimeLogEngine.instance = new RealTimeLogEngine();
    }
    return RealTimeLogEngine.instance;
  }

  async initialize(webSocketManager?: WebSocketManager): Promise<void> {
    if (this.isInitialized) return;

    await this.adminLogger.initialize();
    this.webSocketManager = webSocketManager || null;
    
    // 이벤트 리스너 설정
    this.setupEventListeners();
    
    this.isInitialized = true;
    console.log('🚀 실시간 AI 로그 엔진 초기화 완료');
  }

  /**
   * 동적 로그 패턴 초기화 (AI 엔진 변경에 대응)
   */
  private initializeLogPatterns(): void {
    this.logPatterns = [
      // NodeJS/Express 패턴
      {
        id: 'nodejs_init',
        pattern: /\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\] \[(\w+)\] \[(\w+)\] (.+)/,
        extractor: (match) => ({
          timestamp: match[1],
          level: match[2] as any,
          module: match[3],
          message: match[4]
        }),
        priority: 1
      },
      
      // Redis 연결 패턴
      {
        id: 'redis_connection',
        pattern: /Redis (\w+):? (.+)(?:Latency: (\d+)ms)?/,
        extractor: (match) => ({
          level: 'DEBUG',
          module: 'RedisConnector',
          message: `Redis ${match[1]}: ${match[2]}`,
          details: match[3] ? `Latency: ${match[3]}ms` : undefined,
          metadata: { 
            apiCall: true,
            latency: match[3] ? parseInt(match[3]) : undefined
          }
        }),
        priority: 2
      },

      // API 호출 패턴
      {
        id: 'api_call',
        pattern: /API (\w+) (\/[\w\/\-]+)(?:\s+(\d+)ms)?/,
        extractor: (match) => ({
          level: 'PROCESSING',
          module: 'APIManager',
          message: `API ${match[1]} ${match[2]}`,
          details: match[3] ? `Response time: ${match[3]}ms` : undefined,
          metadata: { 
            apiCall: true,
            endpoint: match[2],
            responseTime: match[3] ? parseInt(match[3]) : undefined
          }
        }),
        priority: 2
      },

      // NLP 처리 패턴
      {
        id: 'nlp_processing',
        pattern: /NLP (.+) Keywords: \[([^\]]+)\] Confidence: (0\.\d+)/,
        extractor: (match) => ({
          level: 'ANALYSIS',
          module: 'NLPProcessor',
          message: `NLP ${match[1]}`,
          details: `Keywords: [${match[2]}], Confidence: ${match[3]}`,
          metadata: { 
            algorithm: 'compromise.js',
            keywords: match[2].split(', '),
            confidence: parseFloat(match[3])
          }
        }),
        priority: 3
      },

      // ML 알고리즘 패턴
      {
        id: 'ml_processing',
        pattern: /(\w+) algorithm (\w+)(?:\s+Score: (0\.\d+))?/,
        extractor: (match) => ({
          level: 'PROCESSING',
          module: 'MLEngine',
          message: `${match[1]} algorithm ${match[2]}`,
          details: match[3] ? `Score: ${match[3]}` : undefined,
          metadata: { 
            algorithm: `${match[1]}_${match[2]}`,
            score: match[3] ? parseFloat(match[3]) : undefined
          }
        }),
        priority: 3
      }
    ];

    console.log(`📋 ${this.logPatterns.length}개 로그 패턴 로드됨`);
  }

  /**
   * 새 처리 세션 시작
   */
  startSession(questionId: string, question: string, metadata: any = {}): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: ProcessingSession = {
      sessionId,
      questionId,
      question,
      startTime: Date.now(),
      logs: [],
      status: 'active',
      metadata
    };

    this.activeSessions.set(sessionId, session);
    
    // 시작 로그 추가
    this.addLog(sessionId, {
      level: 'INFO',
      module: 'SessionManager',
      message: 'AI processing session started',
      details: `Question: "${question.length > 50 ? question.substring(0, 50) + '...' : question}"`,
      metadata: { ...metadata, sessionStart: true }
    });

    console.log(`🎬 새 세션 시작: ${sessionId}`);
    return sessionId;
  }

  /**
   * 실시간 로그 추가 (동적 파싱)
   */
  addLog(sessionId: string, logData: Partial<RealTimeLogEntry> & { message: string }): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.warn(`⚠️ 세션을 찾을 수 없음: ${sessionId}`);
      return;
    }

    // 로그 엔트리 생성
    const logEntry: RealTimeLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      level: logData.level || 'INFO',
      module: logData.module || 'Unknown',
      message: logData.message,
      details: logData.details,
      sessionId: sessionId,
      metadata: {
        processingTime: Date.now() - session.startTime,
        ...logData.metadata
      }
    };

    // 동적 로그 파싱 적용
    const enrichedLog = this.applyLogPatterns(logEntry);
    
    // 세션에 로그 추가
    session.logs.push(enrichedLog);

    // AdminLogger에 기록
    this.recordToAdminLogger(session, enrichedLog);

    // 실시간 브로드캐스트
    this.broadcastLog(enrichedLog);

    // 이벤트 발생
    this.emit('logAdded', { sessionId, log: enrichedLog });

    console.log(`📝 로그 추가: [${enrichedLog.level}] ${enrichedLog.module} - ${enrichedLog.message}`);
  }

  /**
   * 동적 로그 패턴 적용
   */
  private applyLogPatterns(log: RealTimeLogEntry): RealTimeLogEntry {
    const combinedText = `${log.message} ${log.details || ''}`;
    
    // 우선순위 순으로 패턴 적용
    const sortedPatterns = [...this.logPatterns].sort((a, b) => b.priority - a.priority);
    
    for (const pattern of sortedPatterns) {
      const match = combinedText.match(pattern.pattern);
      if (match) {
        const extracted = pattern.extractor(match);
        
        // 추출된 데이터로 로그 엔리치
        return {
          ...log,
          ...extracted,
          metadata: {
            ...log.metadata,
            ...extracted.metadata,
            patternMatch: pattern.id
          }
        };
      }
    }

    return log;
  }

  /**
   * 실제 API 호출 로그 (검증 가능)
   */
  async addApiCallLog(sessionId: string, endpoint: string, method: string = 'GET'): Promise<boolean> {
    const startTime = Date.now();
    
    this.addLog(sessionId, {
      level: 'PROCESSING',
      module: 'APIManager',
      message: `Making ${method} request to ${endpoint}`,
      metadata: { apiCall: true, endpoint, method }
    });

    try {
      // 실제 API 호출
      const response = await fetch(endpoint, { method });
      const responseTime = Date.now() - startTime;
      
      this.addLog(sessionId, {
        level: response.ok ? 'SUCCESS' : 'ERROR',
        module: 'APIManager',
        message: `${method} ${endpoint} completed`,
        details: `Status: ${response.status}, Response time: ${responseTime}ms`,
        metadata: { 
          apiCall: true, 
          endpoint, 
          method,
          statusCode: response.status,
          responseTime,
          success: response.ok
        }
      });

      return response.ok;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.addLog(sessionId, {
        level: 'ERROR',
        module: 'APIManager',
        message: `${method} ${endpoint} failed`,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}, Time: ${responseTime}ms`,
        metadata: { 
          apiCall: true, 
          endpoint, 
          method,
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return false;
    }
  }

  /**
   * 세션 완료
   */
  completeSession(sessionId: string, result: 'success' | 'failed', answer?: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.warn(`⚠️ 세션을 찾을 수 없음: ${sessionId}`);
      return;
    }

    const totalTime = Date.now() - session.startTime;
    session.status = result === 'success' ? 'completed' : 'failed';

    this.addLog(sessionId, {
      level: result === 'success' ? 'SUCCESS' : 'ERROR',
      module: 'SessionManager',
      message: `AI processing session ${result}`,
      details: `Total time: ${totalTime}ms, Logs: ${session.logs.length}`,
      metadata: { 
        sessionEnd: true, 
        totalTime, 
        totalLogs: session.logs.length,
        answer: answer?.substring(0, 100) 
      }
    });

    // AdminLogger에 전체 상호작용 기록
    this.recordInteractionToAdminLogger(session, result, answer);

    console.log(`🎬 세션 완료: ${sessionId} (${result})`);
  }

  /**
   * AdminLogger에 기록
   */
  private recordToAdminLogger(session: ProcessingSession, log: RealTimeLogEntry): void {
    // AdminLogger 형식에 맞게 변환하여 기록하는 로직 추가 가능
  }

  /**
   * 전체 상호작용을 AdminLogger에 기록
   */
  private recordInteractionToAdminLogger(session: ProcessingSession, result: string, answer?: string): void {
    const mode: 'basic' | 'advanced' = (session.metadata.mode === 'advanced') ? 'advanced' : 'basic';
    
    const interactionLog: Omit<AIInteractionLog, 'id' | 'timestamp'> = {
      sessionId: session.sessionId,
      userId: session.metadata.userId,
      query: session.question,
      queryType: session.metadata.category || 'general',
      mode: mode,
      powerMode: 'active',
      response: answer,
      responseTime: Date.now() - session.startTime,
      success: result === 'success',
      intent: {
        name: session.metadata.category || 'general',
        confidence: 0.8,
        entities: {}
      },
      thinkingSessionId: session.sessionId,
      thinkingSteps: session.logs.length,
      thinkingDuration: Date.now() - session.startTime,
      metadata: {
        contextLength: session.question.length,
        cacheHit: session.logs.some(log => log.metadata.cacheHit),
        pluginsUsed: Array.from(new Set(session.logs.map(log => log.module)))
      }
    };

    this.adminLogger.logInteraction(interactionLog);
  }

  /**
   * 실시간 브로드캐스트
   */
  private broadcastLog(log: RealTimeLogEntry): void {
    if (this.webSocketManager) {
      // WebSocket을 통한 실시간 전송 (public broadcast 메서드 사용)
      try {
        this.webSocketManager.broadcast('ai-logs', {
          type: 'ai-log',
          data: log,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.warn('WebSocket 브로드캐스트 실패:', error);
      }
    }

    // 내부 이벤트 발생
    this.emit('realTimeLog', log);
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    // 세션 정리 (완료된 세션은 1시간 후 제거) - 동시성 안전
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 10 * 60 * 1000); // 10분마다 정리
  }

  /**
   * 만료된 세션 안전하게 정리
   */
  private cleanupExpiredSessions(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const sessionsToDelete: string[] = [];
    
    // 먼저 삭제할 세션 ID 수집 (읽기 전용)
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.status !== 'active' && session.startTime < oneHourAgo) {
        sessionsToDelete.push(sessionId);
      }
    }
    
    // 수집된 세션들을 안전하게 삭제
    for (const sessionId of sessionsToDelete) {
      const session = this.activeSessions.get(sessionId);
      if (session && session.status !== 'active' && session.startTime < oneHourAgo) {
        this.activeSessions.delete(sessionId);
        console.log(`🗑️ 세션 정리: ${sessionId}`);
      }
    }
    
    if (sessionsToDelete.length > 0) {
      console.log(`🧹 만료된 세션 ${sessionsToDelete.length}개 정리 완료`);
    }
  }

  /**
   * 활성 세션 조회
   */
  getActiveSession(sessionId: string): ProcessingSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * 세션 로그 조회
   */
  getSessionLogs(sessionId: string): RealTimeLogEntry[] {
    const session = this.activeSessions.get(sessionId);
    return session ? [...session.logs] : [];
  }

  /**
   * 새 로그 패턴 추가 (동적 확장)
   */
  addLogPattern(pattern: LogPattern): void {
    this.logPatterns.push(pattern);
    this.logPatterns.sort((a, b) => b.priority - a.priority);
    console.log(`📋 새 로그 패턴 추가: ${pattern.id}`);
  }

  /**
   * 로그 패턴 제거
   */
  removeLogPattern(patternId: string): boolean {
    const index = this.logPatterns.findIndex(p => p.id === patternId);
    if (index !== -1) {
      this.logPatterns.splice(index, 1);
      console.log(`📋 로그 패턴 제거: ${patternId}`);
      return true;
    }
    return false;
  }

  /**
   * 시스템 종료
   */
  shutdown(): void {
    this.removeAllListeners();
    this.activeSessions.clear();
    console.log('🛑 실시간 AI 로그 엔진 종료');
  }
}

export default RealTimeLogEngine.getInstance(); 