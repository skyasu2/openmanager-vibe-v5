/**
 * 🧠 AI Session Manager
 * 
 * 대화 세션을 관리하고 컨텍스트를 유지하는 서비스
 */

import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    processingTime?: number;
    confidence?: number;
  };
}

export interface Session {
  id: string;
  userId?: string;
  messages: Message[];
  context: {
    topics: string[];
    entities: Map<string, string>;
    preferences: Map<string, any>;
  };
  metadata: {
    createdAt: Date;
    lastActiveAt: Date;
    messageCount: number;
    totalTokens: number;
    userAgent?: string;
    ip?: string;
  };
  summary?: string;
}

export class SessionManager {
  private sessions: Map<string, Session>;
  private userSessions: Map<string, string[]>; // userId -> sessionIds
  private readonly MAX_SESSIONS = 10000;
  private readonly MAX_MESSAGES_PER_SESSION = 1000;
  private readonly SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24시간

  constructor() {
    this.sessions = new Map();
    this.userSessions = new Map();
    
    // 주기적으로 오래된 세션 정리
    setInterval(() => this.cleanupOldSessions(), 60 * 60 * 1000); // 1시간마다
  }

  /**
   * 새 세션 생성
   */
  createSession(userId?: string, initialContext?: any): Session {
    const sessionId = uuidv4();
    
    const session: Session = {
      id: sessionId,
      userId,
      messages: [],
      context: {
        topics: [],
        entities: new Map(),
        preferences: new Map()
      },
      metadata: {
        createdAt: new Date(),
        lastActiveAt: new Date(),
        messageCount: 0,
        totalTokens: 0
      }
    };

    // 초기 컨텍스트 설정
    if (initialContext) {
      if (initialContext.topics) {
        session.context.topics = initialContext.topics;
      }
      if (initialContext.entities) {
        Object.entries(initialContext.entities).forEach(([key, value]) => {
          session.context.entities.set(key, value as string);
        });
      }
    }

    this.sessions.set(sessionId, session);
    
    // 사용자별 세션 매핑
    if (userId) {
      const userSessionList = this.userSessions.get(userId) || [];
      userSessionList.push(sessionId);
      this.userSessions.set(userId, userSessionList);
    }

    console.log(`📝 Session created: ${sessionId}`);
    return session;
  }

  /**
   * 세션 조회
   */
  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.metadata.lastActiveAt = new Date();
    }
    return session || null;
  }

  /**
   * 사용자의 모든 세션 조회
   */
  getUserSessions(userId: string): Session[] {
    const sessionIds = this.userSessions.get(userId) || [];
    return sessionIds
      .map(id => this.sessions.get(id))
      .filter(session => session !== undefined) as Session[];
  }

  /**
   * 메시지 추가
   */
  addMessage(sessionId: string, message: Omit<Message, 'id' | 'timestamp'>): Message | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error(`Session not found: ${sessionId}`);
      return null;
    }

    // 메시지 수 제한 체크
    if (session.messages.length >= this.MAX_MESSAGES_PER_SESSION) {
      // 오래된 메시지 제거 (처음 10개)
      session.messages = session.messages.slice(10);
    }

    const newMessage: Message = {
      id: uuidv4(),
      timestamp: new Date(),
      ...message
    };

    session.messages.push(newMessage);
    session.metadata.messageCount++;
    session.metadata.lastActiveAt = new Date();
    
    // 토큰 수 업데이트
    if (message.metadata?.tokens) {
      session.metadata.totalTokens += message.metadata.tokens;
    }

    // 토픽 추출 (간단한 키워드 기반)
    this.extractTopics(session, message.content);
    
    // 엔티티 추출
    this.extractEntities(session, message.content);

    console.log(`💬 Message added to session ${sessionId}`);
    return newMessage;
  }

  /**
   * 세션 컨텍스트 요약
   */
  getSessionContext(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // 최근 10개 메시지 요약
    const recentMessages = session.messages.slice(-10);
    
    // 주요 토픽
    const topTopics = Array.from(session.context.topics).slice(-5);
    
    // 주요 엔티티
    const entities = Object.fromEntries(session.context.entities);
    
    return {
      sessionId,
      messageCount: session.metadata.messageCount,
      recentMessages: recentMessages.map(m => ({
        role: m.role,
        content: m.content.substring(0, 100) + (m.content.length > 100 ? '...' : '')
      })),
      topics: topTopics,
      entities,
      preferences: Object.fromEntries(session.context.preferences),
      summary: this.generateSummary(session)
    };
  }

  /**
   * 세션 요약 생성
   */
  private generateSummary(session: Session): string {
    if (session.messages.length === 0) {
      return '대화가 시작되지 않았습니다.';
    }

    const topics = Array.from(session.context.topics).join(', ');
    const messageCount = session.metadata.messageCount;
    const duration = Date.now() - session.metadata.createdAt.getTime();
    const durationMinutes = Math.floor(duration / 60000);

    return `${messageCount}개 메시지, ${durationMinutes}분 대화. 주요 주제: ${topics || '일반 대화'}`;
  }

  /**
   * 토픽 추출
   */
  private extractTopics(session: Session, content: string): void {
    const keywords = [
      { pattern: /서버|server/gi, topic: '서버 관리' },
      { pattern: /cpu|메모리|memory|디스크|disk/gi, topic: '리소스 모니터링' },
      { pattern: /에러|error|장애|문제/gi, topic: '장애 분석' },
      { pattern: /최적화|개선|performance/gi, topic: '성능 최적화' },
      { pattern: /보안|security|인증/gi, topic: '보안' },
      { pattern: /ai|인공지능|머신러닝/gi, topic: 'AI 기능' }
    ];

    keywords.forEach(({ pattern, topic }) => {
      if (pattern.test(content) && !session.context.topics.includes(topic)) {
        session.context.topics.push(topic);
      }
    });

    // 최대 10개 토픽만 유지
    if (session.context.topics.length > 10) {
      session.context.topics = session.context.topics.slice(-10);
    }
  }

  /**
   * 엔티티 추출
   */
  private extractEntities(session: Session, content: string): void {
    // 서버 이름 패턴 (예: web-server-01, db-main-01)
    const serverPattern = /\b[a-z]+-[a-z]+-\d{2}\b/gi;
    const servers = content.match(serverPattern);
    if (servers) {
      servers.forEach(server => {
        session.context.entities.set(`server:${server}`, server);
      });
    }

    // IP 주소 패턴
    const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
    const ips = content.match(ipPattern);
    if (ips) {
      ips.forEach(ip => {
        session.context.entities.set(`ip:${ip}`, ip);
      });
    }

    // 숫자 값 (메트릭)
    const metricPattern = /(\d+(?:\.\d+)?)\s*(%|GB|MB|ms|초|분)/gi;
    const metrics = content.match(metricPattern);
    if (metrics) {
      metrics.forEach(metric => {
        session.context.entities.set(`metric:${Date.now()}`, metric);
      });
    }
  }

  /**
   * 오래된 세션 정리
   */
  private cleanupOldSessions(): void {
    const now = Date.now();
    let cleaned = 0;

    this.sessions.forEach((session, sessionId) => {
      const lastActive = session.metadata.lastActiveAt.getTime();
      if (now - lastActive > this.SESSION_TTL_MS) {
        this.sessions.delete(sessionId);
        
        // 사용자 매핑에서도 제거
        if (session.userId) {
          const userSessions = this.userSessions.get(session.userId) || [];
          const filtered = userSessions.filter(id => id !== sessionId);
          if (filtered.length === 0) {
            this.userSessions.delete(session.userId);
          } else {
            this.userSessions.set(session.userId, filtered);
          }
        }
        
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} old sessions`);
    }

    // 메모리 제한 체크
    if (this.sessions.size > this.MAX_SESSIONS) {
      // 가장 오래된 세션부터 제거
      const sortedSessions = Array.from(this.sessions.entries())
        .sort((a, b) => a[1].metadata.lastActiveAt.getTime() - b[1].metadata.lastActiveAt.getTime());
      
      const toRemove = sortedSessions.slice(0, this.sessions.size - this.MAX_SESSIONS);
      toRemove.forEach(([sessionId]) => {
        this.sessions.delete(sessionId);
      });
      
      console.log(`⚠️ Removed ${toRemove.length} sessions due to memory limit`);
    }
  }

  /**
   * 세션 삭제
   */
  deleteSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    this.sessions.delete(sessionId);
    
    if (session.userId) {
      const userSessions = this.userSessions.get(session.userId) || [];
      const filtered = userSessions.filter(id => id !== sessionId);
      if (filtered.length === 0) {
        this.userSessions.delete(session.userId);
      } else {
        this.userSessions.set(session.userId, filtered);
      }
    }

    console.log(`🗑️ Session deleted: ${sessionId}`);
    return true;
  }

  /**
   * 통계 정보
   */
  getStats(): any {
    const totalSessions = this.sessions.size;
    const totalUsers = this.userSessions.size;
    let totalMessages = 0;
    let totalTokens = 0;

    this.sessions.forEach(session => {
      totalMessages += session.metadata.messageCount;
      totalTokens += session.metadata.totalTokens;
    });

    return {
      totalSessions,
      totalUsers,
      totalMessages,
      totalTokens,
      averageMessagesPerSession: totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0,
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    };
  }
}