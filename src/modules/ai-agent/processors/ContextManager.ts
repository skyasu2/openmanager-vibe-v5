/**
 * Context Manager
 * 
 * 🧠 AI 컨텍스트 관리 시스템
 * - 세션 기반 컨텍스트 관리
 * - 대화 히스토리 추적
 * - 서버 컨텍스트 관리
 */

export interface SessionContext {
  sessionId: string;
  userId?: string;
  startTime: number;
  lastActivity: number;
  conversationHistory: any[];
  serverContext: any;
  userPreferences?: any;
  lastQuery?: string;
  lastIntent?: string;
  lastResponse?: string;
}

export interface ConversationEntry {
  timestamp: string;
  query: string;
  intent: string;
  response: string;
  confidence: number;
  entities: Record<string, any>;
}

export interface ServerContext {
  lastQueriedServers: string[];
  recentIssues: string[];
  monitoringFocus: string[];
  alertHistory: AlertEntry[];
}

export interface AlertEntry {
  timestamp: string;
  serverId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  resolved: boolean;
}

export interface UserPreferences {
  preferredResponseStyle: 'detailed' | 'concise' | 'technical';
  notificationLevel: 'all' | 'important' | 'critical';
  timezone: string;
  language: string;
}

export class ContextManager {
  private sessions: Map<string, SessionContext> = new Map();
  private maxSessionAge: number = 24 * 60 * 60 * 1000; // 24시간
  private maxHistoryLength: number = 50;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log('🧠 Context Manager initialized');
  }

  async loadContext(sessionId: string, additionalContext?: Record<string, any>): Promise<SessionContext> {
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      session = {
        sessionId,
        startTime: Date.now(),
        lastActivity: Date.now(),
        conversationHistory: [],
        serverContext: {},
        ...additionalContext
      };
      this.sessions.set(sessionId, session);
    }

    session.lastActivity = Date.now();
    return session;
  }

  async updateContext(sessionId: string, updates: Partial<SessionContext>): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      session.lastActivity = Date.now();
    }
  }

  async cleanup(): Promise<void> {
    this.sessions.clear();
    console.log('🧹 Context Manager cleanup completed');
  }

  /**
   * 대화 히스토리에 엔트리 추가
   */
  async addConversationEntry(sessionId: string, entry: Omit<ConversationEntry, 'timestamp'>): Promise<void> {
    const context = this.sessions.get(sessionId);
    if (!context) return;

    const conversationEntry: ConversationEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };

    context.conversationHistory.push(conversationEntry);

    // 히스토리 길이 제한
    if (context.conversationHistory.length > this.maxHistoryLength) {
      context.conversationHistory = context.conversationHistory.slice(-this.maxHistoryLength);
    }

    // 서버 컨텍스트 업데이트
    this.updateServerContext(context, entry);

    context.lastActivity = Date.now();
    this.sessions.set(sessionId, context);
  }

  /**
   * 서버 알림 추가
   */
  async addServerAlert(sessionId: string, alert: Omit<AlertEntry, 'timestamp'>): Promise<void> {
    const context = this.sessions.get(sessionId);
    if (!context) return;

    const alertEntry: AlertEntry = {
      ...alert,
      timestamp: new Date().toISOString()
    };

    if (!context.serverContext.alertHistory) {
      context.serverContext.alertHistory = [];
    }
    context.serverContext.alertHistory.push(alertEntry);

    // 알림 히스토리 제한 (최근 100개)
    if (context.serverContext.alertHistory.length > 100) {
      context.serverContext.alertHistory = context.serverContext.alertHistory.slice(-100);
    }

    context.lastActivity = Date.now();
    this.sessions.set(sessionId, context);
  }

  /**
   * 사용자 선호도 업데이트
   */
  async updateUserPreferences(sessionId: string, preferences: Partial<UserPreferences>): Promise<void> {
    const context = this.sessions.get(sessionId);
    if (!context) return;

    context.userPreferences = { ...context.userPreferences, ...preferences };
    context.lastActivity = Date.now();
    
    this.sessions.set(sessionId, context);
  }

  /**
   * 컨텍스트 기반 추천 생성
   */
  async generateContextualRecommendations(sessionId: string): Promise<string[]> {
    const context = this.sessions.get(sessionId);
    if (!context) return [];

    const recommendations: string[] = [];

    // 최근 질문 패턴 분석
    const recentIntents = context.conversationHistory
      .slice(-5)
      .map(entry => entry.intent);

    if (recentIntents.includes('performance_analysis')) {
      recommendations.push('성능 최적화 방안 확인');
    }

    if (recentIntents.includes('log_analysis')) {
      recommendations.push('로그 모니터링 설정');
    }

    // 서버 컨텍스트 기반 추천
    if (context.serverContext.recentIssues.length > 0) {
      recommendations.push('최근 이슈 해결 상태 확인');
    }

    // 알림 기반 추천
    const criticalAlerts = context.serverContext.alertHistory
      .filter((alert: any) => alert.severity === 'critical' && !alert.resolved);

    if (criticalAlerts.length > 0) {
      recommendations.push('긴급 알림 처리');
    }

    return recommendations;
  }

  /**
   * 세션 통계 조회
   */
  async getSessionStats(sessionId: string): Promise<any> {
    const context = this.sessions.get(sessionId);
    if (!context) return null;

    const now = new Date();
    const startTime = new Date(context.startTime);
    const duration = now.getTime() - startTime.getTime();

    return {
      sessionId: context.sessionId,
      duration: Math.round(duration / 1000 / 60), // 분 단위
      totalQueries: context.conversationHistory.length,
      uniqueIntents: [...new Set(context.conversationHistory.map(e => e.intent))].length,
      averageConfidence: context.conversationHistory.length > 0
        ? context.conversationHistory.reduce((sum, e) => sum + e.confidence, 0) / context.conversationHistory.length
        : 0,
      recentActivity: context.lastActivity,
      serversFocused: context.serverContext.lastQueriedServers.length,
      alertsReceived: context.serverContext.alertHistory.length
    };
  }

  /**
   * 서버 컨텍스트 업데이트
   */
  private updateServerContext(context: SessionContext, entry: Omit<ConversationEntry, 'timestamp'>): void {
    // 서버 ID 추출 및 추가
    if (entry.entities.server_id) {
      const serverIds = Array.isArray(entry.entities.server_id) 
        ? entry.entities.server_id 
        : [entry.entities.server_id];
      
      for (const serverId of serverIds) {
        if (!context.serverContext.lastQueriedServers.includes(serverId)) {
          context.serverContext.lastQueriedServers.push(serverId);
        }
      }

      // 최근 조회 서버 제한 (최근 10개)
      if (context.serverContext.lastQueriedServers.length > 10) {
        context.serverContext.lastQueriedServers = context.serverContext.lastQueriedServers.slice(-10);
      }
    }

    // 모니터링 포커스 업데이트
    if (entry.intent.includes('analysis') || entry.intent.includes('monitoring')) {
      if (!context.serverContext.monitoringFocus.includes(entry.intent)) {
        context.serverContext.monitoringFocus.push(entry.intent);
      }
    }
  }

  /**
   * 전체 세션 수 조회
   */
  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * 세션 존재 여부 확인
   */
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }
} 