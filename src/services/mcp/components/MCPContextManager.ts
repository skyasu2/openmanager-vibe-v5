/**
 * 🎯 MCP 컨텍스트 관리자 v1.0
 *
 * 담당 기능:
 * - 세션 컨텍스트 저장 및 복원
 * - 대화 히스토리 관리
 * - 임시 데이터 캐싱
 * - 컨텍스트 정리 및 최적화
 */

interface SessionContext {
  sessionId: string;
  data: any;
  timestamp: number;
  expiresAt?: number;
  metadata?: {
    userAgent?: string;
    clientId?: string;
    version?: string;
  };
}

interface ContextStats {
  totalSessions: number;
  activeSessions: number;
  totalSize: number;
  oldestSession: number;
  newestSession: number;
}

export class MCPContextManager {
  private contexts: Map<string, SessionContext> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private maxContexts = 1000;
  private defaultTTL = 24 * 60 * 60 * 1000; // 24시간

  constructor() {
    this.startCleanupScheduler();
  }

  /**
   * 🧹 정리 스케줄러 시작
   */
  private startCleanupScheduler(): void {
    // 1시간마다 만료된 컨텍스트 정리
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredContexts();
      },
      60 * 60 * 1000
    );

    console.log('🧹 컨텍스트 정리 스케줄러 시작됨 (1시간 간격)');
  }

  /**
   * 🗑️ 만료된 컨텍스트 정리
   */
  private cleanupExpiredContexts(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, context] of this.contexts.entries()) {
      const expiresAt =
        context.expiresAt || context.timestamp + this.defaultTTL;

      if (now > expiresAt) {
        this.contexts.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🗑️ ${cleanedCount}개 만료된 컨텍스트 정리됨`);
    }

    // 컨텍스트 수가 최대치를 초과하면 오래된 것부터 제거
    if (this.contexts.size > this.maxContexts) {
      this.removeOldestContexts(this.contexts.size - this.maxContexts);
    }
  }

  /**
   * 🗑️ 오래된 컨텍스트 제거
   */
  private removeOldestContexts(count: number): void {
    const sortedContexts = Array.from(this.contexts.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, count);

    for (const [sessionId] of sortedContexts) {
      this.contexts.delete(sessionId);
    }

    console.log(`🗑️ ${count}개 오래된 컨텍스트 제거됨`);
  }

  /**
   * 💾 컨텍스트 저장
   */
  async storeContext(sessionId: string, context: any): Promise<boolean> {
    try {
      const now = Date.now();
      const sessionContext: SessionContext = {
        sessionId,
        data: context,
        timestamp: now,
        expiresAt: now + this.defaultTTL,
        metadata: {
          version: '1.0',
          clientId: 'mcp-client',
        },
      };

      this.contexts.set(sessionId, sessionContext);

      console.log(
        `💾 컨텍스트 저장됨: ${sessionId} (크기: ${JSON.stringify(context).length}바이트)`
      );

      return true;
    } catch (error) {
      console.error(`❌ 컨텍스트 저장 실패: ${sessionId}`, error);
      return false;
    }
  }

  /**
   * 📖 컨텍스트 조회
   */
  async retrieveContext(sessionId: string): Promise<any> {
    try {
      const sessionContext = this.contexts.get(sessionId);

      if (!sessionContext) {
        console.warn(`⚠️ 컨텍스트를 찾을 수 없습니다: ${sessionId}`);
        return null;
      }

      // 만료 확인
      const now = Date.now();
      const expiresAt =
        sessionContext.expiresAt || sessionContext.timestamp + this.defaultTTL;

      if (now > expiresAt) {
        console.warn(`⚠️ 만료된 컨텍스트: ${sessionId}`);
        this.contexts.delete(sessionId);
        return null;
      }

      console.log(`📖 컨텍스트 조회됨: ${sessionId}`);
      return sessionContext.data;
    } catch (error) {
      console.error(`❌ 컨텍스트 조회 실패: ${sessionId}`, error);
      return null;
    }
  }

  /**
   * 🔄 컨텍스트 업데이트
   */
  async updateContext(sessionId: string, updates: any): Promise<boolean> {
    try {
      const existingContext = this.contexts.get(sessionId);

      if (!existingContext) {
        console.warn(`⚠️ 업데이트할 컨텍스트를 찾을 수 없습니다: ${sessionId}`);
        return false;
      }

      const updatedContext: SessionContext = {
        ...existingContext,
        data: { ...existingContext.data, ...updates },
        timestamp: Date.now(), // 업데이트 시간 갱신
      };

      this.contexts.set(sessionId, updatedContext);

      console.log(`🔄 컨텍스트 업데이트됨: ${sessionId}`);
      return true;
    } catch (error) {
      console.error(`❌ 컨텍스트 업데이트 실패: ${sessionId}`, error);
      return false;
    }
  }

  /**
   * 🗑️ 컨텍스트 삭제
   */
  async deleteContext(sessionId: string): Promise<boolean> {
    try {
      const deleted = this.contexts.delete(sessionId);

      if (deleted) {
        console.log(`🗑️ 컨텍스트 삭제됨: ${sessionId}`);
      } else {
        console.warn(`⚠️ 삭제할 컨텍스트를 찾을 수 없습니다: ${sessionId}`);
      }

      return deleted;
    } catch (error) {
      console.error(`❌ 컨텍스트 삭제 실패: ${sessionId}`, error);
      return false;
    }
  }

  /**
   * 📋 활성 세션 목록
   */
  getActiveSessions(): string[] {
    const now = Date.now();
    const activeSessions: string[] = [];

    for (const [sessionId, context] of this.contexts.entries()) {
      const expiresAt =
        context.expiresAt || context.timestamp + this.defaultTTL;

      if (now <= expiresAt) {
        activeSessions.push(sessionId);
      }
    }

    return activeSessions;
  }

  /**
   * 📊 컨텍스트 통계
   */
  getContextStats(): ContextStats {
    const now = Date.now();
    let activeSessions = 0;
    let totalSize = 0;
    let oldestSession = now;
    let newestSession = 0;

    for (const context of this.contexts.values()) {
      const expiresAt =
        context.expiresAt || context.timestamp + this.defaultTTL;

      if (now <= expiresAt) {
        activeSessions++;
      }

      totalSize += JSON.stringify(context.data).length;
      oldestSession = Math.min(oldestSession, context.timestamp);
      newestSession = Math.max(newestSession, context.timestamp);
    }

    return {
      totalSessions: this.contexts.size,
      activeSessions,
      totalSize,
      oldestSession: oldestSession === now ? 0 : oldestSession,
      newestSession,
    };
  }

  /**
   * 🔍 컨텍스트 검색
   */
  searchContexts(query: string): SessionContext[] {
    const results: SessionContext[] = [];
    const searchTerm = query.toLowerCase();

    for (const context of this.contexts.values()) {
      const dataStr = JSON.stringify(context.data).toLowerCase();

      if (
        dataStr.includes(searchTerm) ||
        context.sessionId.toLowerCase().includes(searchTerm)
      ) {
        results.push(context);
      }
    }

    console.log(`🔍 컨텍스트 검색 결과: "${query}" - ${results.length}개 발견`);
    return results;
  }

  /**
   * 📤 컨텍스트 내보내기
   */
  exportContexts(sessionIds?: string[]): any {
    const exportData: Record<string, any> = {};
    const targetSessions = sessionIds || Array.from(this.contexts.keys());

    for (const sessionId of targetSessions) {
      const context = this.contexts.get(sessionId);
      if (context) {
        exportData[sessionId] = {
          data: context.data,
          timestamp: context.timestamp,
          expiresAt: context.expiresAt,
          metadata: context.metadata,
        };
      }
    }

    console.log(
      `📤 ${Object.keys(exportData).length}개 컨텍스트 내보내기 완료`
    );
    return exportData;
  }

  /**
   * 📥 컨텍스트 가져오기
   */
  importContexts(data: Record<string, any>): number {
    let importedCount = 0;

    for (const [sessionId, contextData] of Object.entries(_data)) {
      try {
        const sessionContext: SessionContext = {
          sessionId,
          data: contextData.data,
          timestamp: contextData.timestamp || Date.now(),
          expiresAt: contextData.expiresAt,
          metadata: contextData.metadata,
        };

        this.contexts.set(sessionId, sessionContext);
        importedCount++;
      } catch (error) {
        console.warn(`⚠️ 컨텍스트 가져오기 실패: ${sessionId}`, error);
      }
    }

    console.log(`📥 ${importedCount}개 컨텍스트 가져오기 완료`);
    return importedCount;
  }

  /**
   * 🧹 모든 컨텍스트 정리
   */
  clearAllContexts(): void {
    const count = this.contexts.size;
    this.contexts.clear();
    console.log(`🧹 ${count}개 모든 컨텍스트 정리됨`);
  }

  /**
   * ⚙️ 설정 변경
   */
  configure(options: { maxContexts?: number; defaultTTL?: number }): void {
    if (options.maxContexts !== undefined) {
      this.maxContexts = options.maxContexts;
      console.log(`⚙️ 최대 컨텍스트 수 변경: ${this.maxContexts}`);
    }

    if (options.defaultTTL !== undefined) {
      this.defaultTTL = options.defaultTTL;
      console.log(`⚙️ 기본 TTL 변경: ${this.defaultTTL}ms`);
    }
  }

  /**
   * 🛑 정리 스케줄러 중지
   */
  stopCleanupScheduler(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('🛑 컨텍스트 정리 스케줄러 중지됨');
    }
  }

  /**
   * 🔄 컨텍스트 압축 (메모리 최적화)
   */
  compressContexts(): void {
    let compressedCount = 0;

    for (const [sessionId, context] of this.contexts.entries()) {
      try {
        // 데이터 압축 시뮬레이션 (실제로는 gzip 등 사용)
        const originalSize = JSON.stringify(context.data).length;

        // 불필요한 메타데이터 제거
        if (context.data && typeof context.data === 'object') {
          delete context.data._debug;
          delete context.data._temp;
          delete context.data._cache;
        }

        const compressedSize = JSON.stringify(context.data).length;

        if (compressedSize < originalSize) {
          this.contexts.set(sessionId, context);
          compressedCount++;
        }
      } catch (error) {
        console.warn(`⚠️ 컨텍스트 압축 실패: ${sessionId}`, error);
      }
    }

    console.log(`🔄 ${compressedCount}개 컨텍스트 압축 완료`);
  }
}
