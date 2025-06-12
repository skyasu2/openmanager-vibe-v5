export interface ThinkingStep {
  timestamp: string;
  step: string;
  content: string;
  type:
    | 'analysis'
    | 'reasoning'
    | 'data_processing'
    | 'pattern_matching'
    | 'response_generation';
  duration?: number;
  progress?: number; // 0-100 진행률 추가
  reactType?: 'thought' | 'observation' | 'action' | 'answer' | 'reflection'; // ReAct 단계 타입 추가
  metadata?: Record<string, any>;
}

export interface ThinkingSession {
  sessionId: string;
  query: string;
  startTime: number;
  endTime?: number;
  steps: ThinkingStep[];
  status: 'active' | 'completed' | 'error';
  totalDuration?: number;
}

export class ThinkingLogger {
  private static instance: ThinkingLogger;
  private sessions: Map<string, ThinkingSession> = new Map();
  private currentStep: Map<string, { step: string; startTime: number }> =
    new Map();

  private constructor() {}

  static getInstance(): ThinkingLogger {
    if (!ThinkingLogger.instance) {
      ThinkingLogger.instance = new ThinkingLogger();
    }
    return ThinkingLogger.instance;
  }

  /**
   * 새로운 사고 세션 시작
   */
  startSession(sessionId: string, query: string): void {
    const session: ThinkingSession = {
      sessionId,
      query,
      startTime: Date.now(),
      steps: [],
      status: 'active',
    };

    this.sessions.set(sessionId, session);
    console.log(
      `🧠 [${sessionId}] Thinking session started for query: "${query}"`
    );
  }

  /**
   * 처리 단계 시작
   */
  startStep(sessionId: string, step: string, type: ThinkingStep['type']): void {
    this.currentStep.set(sessionId, {
      step,
      startTime: Date.now(),
    });

    const session = this.sessions.get(sessionId);
    if (session) {
      console.log(`⚡ [${sessionId}] Starting step: ${step}`);
    }
  }

  /**
   * 처리 단계 완료 및 로그 기록
   */
  logStep(
    sessionId: string,
    content: string,
    type: ThinkingStep['type'],
    metadata?: Record<string, any>,
    progress?: number,
    reactType?: ThinkingStep['reactType']
  ): void {
    const session = this.sessions.get(sessionId);
    const currentStep = this.currentStep.get(sessionId);

    if (!session || !currentStep) {
      console.warn(`⚠️ [${sessionId}] Session or current step not found`);
      return;
    }

    const duration = Date.now() - currentStep.startTime;

    const thinkingStep: ThinkingStep = {
      timestamp: new Date().toISOString(),
      step: currentStep.step,
      content,
      type,
      duration,
      progress,
      reactType,
      metadata,
    };

    session.steps.push(thinkingStep);
    this.currentStep.delete(sessionId);

    console.log(
      `✅ [${sessionId}] Step completed: ${currentStep.step} (${duration}ms, progress: ${progress || 'N/A'}%)`
    );
  }

  /**
   * 사고 세션 완료
   */
  completeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`⚠️ [${sessionId}] Session not found for completion`);
      return;
    }

    session.endTime = Date.now();
    session.totalDuration = session.endTime - session.startTime;
    session.status = 'completed';

    console.log(
      `🎉 [${sessionId}] Thinking session completed in ${session.totalDuration}ms`
    );
  }

  /**
   * 사고 세션 에러 처리
   */
  errorSession(sessionId: string, error: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`⚠️ [${sessionId}] Session not found for error`);
      return;
    }

    session.endTime = Date.now();
    session.totalDuration = session.endTime - session.startTime;
    session.status = 'error';

    // 에러 단계 추가
    const errorStep: ThinkingStep = {
      timestamp: new Date().toISOString(),
      step: '⚠️ 처리 오류',
      content: `오류가 발생했습니다: ${error}`,
      type: 'analysis',
      duration: 0,
      metadata: { error: true },
    };

    session.steps.push(errorStep);

    console.error(`❌ [${sessionId}] Thinking session failed: ${error}`);
  }

  /**
   * 세션 정보 가져오기
   */
  getSession(sessionId: string): ThinkingSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * 모든 세션 정보 가져오기
   */
  getAllSessions(): ThinkingSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * 세션 삭제 (메모리 정리)
   */
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.currentStep.delete(sessionId);
    console.log(`🗑️ [${sessionId}] Session cleared from memory`);
  }

  /**
   * 오래된 세션들 정리 (1시간 이상)
   */
  cleanup(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const sessionsToDelete: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      if (session.startTime < oneHourAgo) {
        sessionsToDelete.push(sessionId);
      }
    }

    sessionsToDelete.forEach(sessionId => {
      this.clearSession(sessionId);
    });

    if (sessionsToDelete.length > 0) {
      console.log(
        `🧹 Cleaned up ${sessionsToDelete.length} old thinking sessions`
      );
    }
  }

  /**
   * 실시간 로그 생성 (현재 진행중인 단계 포함)
   */
  getLiveSession(sessionId: string): ThinkingSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const liveSession = { ...session };

    // 현재 진행중인 단계가 있으면 추가
    const currentStep = this.currentStep.get(sessionId);
    if (currentStep && session.status === 'active') {
      const inProgressStep: ThinkingStep = {
        timestamp: new Date().toISOString(),
        step: currentStep.step,
        content: '처리 중...',
        type: 'analysis',
        duration: Date.now() - currentStep.startTime,
        metadata: { inProgress: true },
      };

      liveSession.steps = [...session.steps, inProgressStep];
    }

    return liveSession;
  }
}

export const thinkingLogger = ThinkingLogger.getInstance();
