import { MCPContext } from './MCPAIRouter';

interface SessionData {
  id: string;
  createdAt: Date;
  lastActivity: Date;
  queries: string[];
  results: any[];
  context: MCPContext;
  patterns: any[];
}

export class SessionManager {
  private sessions: Map<string, SessionData> = new Map();
  private readonly sessionTimeout = 30 * 60 * 1000; // 30분
  private readonly maxSessions = 1000;
  
  constructor() {
    // 주기적으로 만료된 세션 정리
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000); // 5분마다
  }

  /**
   * 🔍 컨텍스트 개선
   */
  async enrichContext(sessionId: string, context: MCPContext): Promise<MCPContext> {
    const session = this.getOrCreateSession(sessionId);
    
    // 이전 분석 결과 패턴 추가
    const enrichedContext: MCPContext = {
      ...context,
      sessionId,
      previousResults: session.results.slice(-5), // 최근 5개 결과
    };

    // 시간 범위가 없으면 기본값 설정
    if (!enrichedContext.timeRange && enrichedContext.serverMetrics) {
      enrichedContext.timeRange = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24시간 전
        end: new Date()
      };
    }

    return enrichedContext;
  }

  /**
   * 📝 세션 업데이트
   */
  async updateSession(sessionId: string, data: {
    query?: string;
    intent?: any;
    results?: any[];
    response?: any;
  }): Promise<void> {
    const session = this.getOrCreateSession(sessionId);
    
    session.lastActivity = new Date();
    
    if (data.query) {
      session.queries.push(data.query);
      // 최대 50개 쿼리 유지
      if (session.queries.length > 50) {
        session.queries = session.queries.slice(-50);
      }
    }
    
    if (data.results) {
      session.results.push(...data.results);
      // 최대 100개 결과 유지
      if (session.results.length > 100) {
        session.results = session.results.slice(-100);
      }
    }

    // 패턴 분석 및 저장
    if (data.intent && data.results) {
      this.analyzeAndStorePatterns(session, data.intent, data.results);
    }
  }

  /**
   * 🆔 세션 가져오기 또는 생성
   */
  private getOrCreateSession(sessionId: string): SessionData {
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      // 세션 수 제한 확인
      if (this.sessions.size >= this.maxSessions) {
        this.cleanupOldestSessions();
      }
      
      session = {
        id: sessionId,
        createdAt: new Date(),
        lastActivity: new Date(),
        queries: [],
        results: [],
        context: {},
        patterns: []
      };
      
      this.sessions.set(sessionId, session);
      console.log(`📝 새 세션 생성: ${sessionId}`);
    }
    
    return session;
  }

  /**
   * 🧹 만료된 세션 정리
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];
    
    this.sessions.forEach((session, sessionId) => {
      if (now - session.lastActivity.getTime() > this.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    });
    
    expiredSessions.forEach(sessionId => {
      this.sessions.delete(sessionId);
    });
    
    if (expiredSessions.length > 0) {
      console.log(`🧹 ${expiredSessions.length}개 만료 세션 정리 완료`);
    }
  }

  /**
   * 🗑️ 가장 오래된 세션들 정리
   */
  private cleanupOldestSessions(): void {
    const sessions = Array.from(this.sessions.entries())
      .sort((a, b) => a[1].lastActivity.getTime() - b[1].lastActivity.getTime());
    
    // 가장 오래된 10% 세션 제거
    const toRemove = Math.floor(sessions.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.sessions.delete(sessions[i][0]);
    }
    
    console.log(`🗑️ ${toRemove}개 오래된 세션 정리 완료`);
  }

  /**
   * 📊 패턴 분석 및 저장
   */
  private analyzeAndStorePatterns(session: SessionData, intent: any, results: any[]): void {
    const pattern = {
      timestamp: new Date(),
      intentType: intent.primary,
      urgency: intent.urgency,
      confidence: intent.confidence,
      engines: results.map(r => r.engine),
      success: results.filter(r => r.success).length / results.length,
      executionTime: results.reduce((sum, r) => sum + r.executionTime, 0)
    };
    
    session.patterns.push(pattern);
    
    // 최대 20개 패턴 유지
    if (session.patterns.length > 20) {
      session.patterns = session.patterns.slice(-20);
    }
  }

  /**
   * 📈 세션 통계 생성
   */
  getSessionStatistics(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    const totalQueries = session.queries.length;
    const totalResults = session.results.length;
    const avgSuccessRate = session.patterns.length > 0 
      ? session.patterns.reduce((sum, p) => sum + p.success, 0) / session.patterns.length
      : 0;
    
    const intentDistribution = session.patterns.reduce((acc, p) => {
      acc[p.intentType] = (acc[p.intentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const urgencyDistribution = session.patterns.reduce((acc, p) => {
      acc[p.urgency] = (acc[p.urgency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      sessionId,
      duration: Date.now() - session.createdAt.getTime(),
      totalQueries,
      totalResults,
      avgSuccessRate,
      intentDistribution,
      urgencyDistribution,
      lastActivity: session.lastActivity
    };
  }

  /**
   * 🔍 유사한 과거 쿼리 찾기
   */
  findSimilarQueries(sessionId: string, currentQuery: string): string[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    
    const currentWords = currentQuery.toLowerCase().split(' ');
    const similarQueries: { query: string; similarity: number }[] = [];
    
    session.queries.forEach(query => {
      const queryWords = query.toLowerCase().split(' ');
      const commonWords = currentWords.filter(word => queryWords.includes(word));
      const similarity = commonWords.length / Math.max(currentWords.length, queryWords.length);
      
      if (similarity > 0.3 && query !== currentQuery) {
        similarQueries.push({ query, similarity });
      }
    });
    
    return similarQueries
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
      .map(item => item.query);
  }

  /**
   * 📊 전체 시스템 통계
   */
  getSystemStatistics(): any {
    const totalSessions = this.sessions.size;
    const activeSessions = Array.from(this.sessions.values())
      .filter(session => Date.now() - session.lastActivity.getTime() < 5 * 60 * 1000).length; // 5분 내 활동
    
    const totalQueries = Array.from(this.sessions.values())
      .reduce((sum, session) => sum + session.queries.length, 0);
    
    const totalPatterns = Array.from(this.sessions.values())
      .reduce((sum, session) => sum + session.patterns.length, 0);
    
    const avgSessionDuration = Array.from(this.sessions.values())
      .reduce((sum, session) => sum + (Date.now() - session.createdAt.getTime()), 0) / totalSessions;
    
    // 전체 의도 분포
    const globalIntentDistribution = Array.from(this.sessions.values())
      .flatMap(session => session.patterns)
      .reduce((acc, pattern) => {
        acc[pattern.intentType] = (acc[pattern.intentType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    return {
      totalSessions,
      activeSessions,
      totalQueries,
      totalPatterns,
      avgSessionDuration: Math.round(avgSessionDuration),
      globalIntentDistribution,
      memoryUsage: this.calculateMemoryUsage()
    };
  }

  /**
   * 💾 메모리 사용량 계산
   */
  private calculateMemoryUsage(): any {
    const sessionSizes = Array.from(this.sessions.values()).map(session => {
      return JSON.stringify(session).length;
    });
    
    const totalSize = sessionSizes.reduce((sum, size) => sum + size, 0);
    const avgSize = sessionSizes.length > 0 ? totalSize / sessionSizes.length : 0;
    
    return {
      totalBytes: totalSize,
      avgSessionBytes: Math.round(avgSize),
      estimatedMB: (totalSize / (1024 * 1024)).toFixed(2)
    };
  }

  /**
   * 🔧 세션 정리 (관리용)
   */
  clearSession(sessionId: string): boolean {
    const result = this.sessions.delete(sessionId);
    if (result) {
      console.log(`🧹 세션 ${sessionId} 정리 완료`);
    }
    return result;
  }

  /**
   * 🔧 모든 세션 정리 (관리용)
   */
  clearAllSessions(): number {
    const count = this.sessions.size;
    this.sessions.clear();
    console.log(`🧹 ${count}개 모든 세션 정리 완료`);
    return count;
  }

  /**
   * 📋 세션 목록 조회
   */
  listSessions(): Array<{ id: string; createdAt: Date; lastActivity: Date; queries: number }> {
    return Array.from(this.sessions.entries()).map(([id, session]) => ({
      id,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      queries: session.queries.length
    }));
  }
} 