/**
 * 🧠 AI Agent Context Manager
 *
 * AI Agent 엔진용 컨텍스트 관리자
 * - 대화 컨텍스트 관리
 * - 상태 추적
 * - 메모리 관리
 */

export interface AgentContext {
  conversationId: string;
  userIntent: string;
  previousActions: string[];
  currentState: Record<string, any>;
  metadata: Record<string, any>;
  lastQuery?: string;
  lastIntent?: string;
  lastResponse?: string;
}

export class ContextManager {
  private contexts: Map<string, AgentContext> = new Map();
  private maxContextSize: number = 100;

  constructor(maxSize?: number) {
    if (maxSize) {
      this.maxContextSize = maxSize;
    }
  }

  /**
   * 초기화
   */
  async initialize(): Promise<void> {
    // 필요시 초기화 로직 추가
  }

  /**
   * 컨텍스트 로드
   */
  async loadContext(conversationId: string): Promise<AgentContext | null> {
    return this.contexts.get(conversationId) || null;
  }

  /**
   * 컨텍스트 업데이트
   */
  async updateContext(
    conversationId: string,
    updates: Partial<AgentContext>
  ): Promise<void> {
    const existing = this.contexts.get(conversationId);
    if (existing) {
      this.contexts.set(conversationId, { ...existing, ...updates });
    } else {
      const newContext: AgentContext = {
        conversationId,
        userIntent: '',
        previousActions: [],
        currentState: {},
        metadata: {},
        ...updates,
      };
      this.contexts.set(conversationId, newContext);
    }

    // 크기 제한 관리
    if (this.contexts.size > this.maxContextSize) {
      const firstKey = this.contexts.keys().next().value;
      this.contexts.delete(firstKey);
    }
  }

  /**
   * 정리
   */
  cleanup(): void {
    this.contexts.clear();
  }

  /**
   * 컨텍스트 존재 확인
   */
  hasContext(conversationId: string): boolean {
    return this.contexts.has(conversationId);
  }

  /**
   * 모든 컨텍스트 가져오기
   */
  getAllContexts(): AgentContext[] {
    return Array.from(this.contexts.values());
  }
}
