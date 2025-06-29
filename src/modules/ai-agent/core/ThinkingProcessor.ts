/**
 * AI Agent Thinking Processor
 *
 * 🧠 AI 사고 과정 표시 시스템
 * - 실시간 사고 과정 스트리밍
 * - 단계별 분석 과정 표시
 * - 복사 방지 및 보안 기능
 * - 사고 과정 로깅
 */

export interface ThinkingStep {
  id: string;
  step: number;
  type:
    | 'analysis'
    | 'classification'
    | 'processing'
    | 'generation'
    | 'validation';
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  startTime: number;
  endTime?: number;
  duration?: number;
  details?: any;
  progress?: number; // 0-100
}

export interface ThinkingSession {
  sessionId: string;
  queryId: string;
  query: string;
  mode: 'basic' | 'enterprise' | 'advanced';
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  steps: ThinkingStep[];
  status: 'thinking' | 'completed' | 'error';
  result?: any;
  error?: string;
}

export type ThinkingCallback = (
  session: ThinkingSession,
  step?: ThinkingStep
) => void;

export class ThinkingProcessor {
  private sessions: Map<string, ThinkingSession> = new Map();
  private callbacks: Set<ThinkingCallback> = new Set();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.isInitialized = true;
    console.log('🧠 Thinking Processor initialized');
  }

  /**
   * 새로운 사고 세션 시작
   */
  startThinking(
    queryId: string,
    query: string,
    mode: 'basic' | 'enterprise' | 'advanced'
  ): string {
    const sessionId = this.generateSessionId();

    const session: ThinkingSession = {
      sessionId,
      queryId,
      query,
      mode,
      startTime: Date.now(),
      steps: [],
      status: 'thinking',
    };

    this.sessions.set(sessionId, session);
    this.notifyCallbacks(session);

    console.log(`🧠 Started thinking session: ${sessionId}`);
    return sessionId;
  }

  /**
   * 사고 단계 추가
   */
  addThinkingStep(
    sessionId: string,
    type: ThinkingStep['type'],
    title: string,
    description: string,
    details?: any
  ): string {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Thinking session not found: ${sessionId}`);
    }

    const stepId = this.generateStepId();
    const step: ThinkingStep = {
      id: stepId,
      step: session.steps.length + 1,
      type,
      title,
      description,
      status: 'processing',
      startTime: Date.now(),
      details,
      progress: 0,
    };

    session.steps.push(step);
    this.notifyCallbacks(session, step);

    return stepId;
  }

  /**
   * 사고 단계 업데이트
   */
  updateThinkingStep(
    sessionId: string,
    stepId: string,
    updates: Partial<
      Pick<ThinkingStep, 'status' | 'progress' | 'description' | 'details'>
    >
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const step = session.steps.find(s => s.id === stepId);
    if (!step) return;

    Object.assign(step, updates);

    if (updates.status === 'completed' || updates.status === 'error') {
      step.endTime = Date.now();
      step.duration = step.endTime - step.startTime;
    }

    this.notifyCallbacks(session, step);
  }

  /**
   * 사고 과정 완료
   */
  completeThinking(sessionId: string, result?: any, error?: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.endTime = Date.now();
    session.totalDuration = session.endTime - session.startTime;
    session.status = error ? 'error' : 'completed';
    session.result = result;
    session.error = error;

    // 미완료 단계들을 완료 처리
    session.steps.forEach(step => {
      if (step.status === 'processing' || step.status === 'pending') {
        step.status = error ? 'error' : 'completed';
        step.endTime = Date.now();
        step.duration = step.endTime - step.startTime;
      }
    });

    this.notifyCallbacks(session);

    console.log(
      `🧠 Completed thinking session: ${sessionId} (${session.totalDuration}ms)`
    );
  }

  /**
   * 사고 과정 콜백 등록
   */
  onThinking(callback: ThinkingCallback): () => void {
    this.callbacks.add(callback);

    // 구독 해제 함수 반환
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * 사고 세션 조회
   */
  getThinkingSession(sessionId: string): ThinkingSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * 활성 사고 세션 목록
   */
  getActiveThinkingSessions(): ThinkingSession[] {
    return Array.from(this.sessions.values()).filter(
      s => s.status === 'thinking'
    );
  }

  /**
   * 사고 과정 통계
   */
  getThinkingStats(): {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    errorSessions: number;
    averageDuration: number;
    averageSteps: number;
  } {
    const sessions = Array.from(this.sessions.values());
    const completed = sessions.filter(s => s.status === 'completed');
    const errors = sessions.filter(s => s.status === 'error');

    const avgDuration =
      completed.length > 0
        ? completed.reduce((sum, s) => sum + (s.totalDuration || 0), 0) /
          completed.length
        : 0;

    const avgSteps =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.steps.length, 0) / sessions.length
        : 0;

    return {
      totalSessions: sessions.length,
      activeSessions: this.getActiveThinkingSessions().length,
      completedSessions: completed.length,
      errorSessions: errors.length,
      averageDuration: Math.round(avgDuration),
      averageSteps: Math.round(avgSteps * 10) / 10,
    };
  }

  /**
   * 모드별 사고 과정 템플릿
   */
  getThinkingTemplate(
    mode: 'basic' | 'enterprise' | 'advanced',
    intentType: string
  ): ThinkingStep[] {
    const baseSteps: Omit<ThinkingStep, 'id' | 'startTime' | 'step'>[] = [
      {
        type: 'analysis',
        title: '질문 분석',
        description: '사용자 질문을 분석하고 있습니다...',
        status: 'pending',
      },
      {
        type: 'classification',
        title: '의도 분류',
        description: '질문의 의도를 분류하고 있습니다...',
        status: 'pending',
      },
    ];

    if (mode === 'advanced') {
      baseSteps.push(
        {
          type: 'processing',
          title: '고급 분석',
          description: '서버 데이터를 심층 분석하고 있습니다...',
          status: 'pending',
        },
        {
          type: 'processing',
          title: '상관관계 분석',
          description: '다중 서버 간 상관관계를 분석하고 있습니다...',
          status: 'pending',
        },
        {
          type: 'processing',
          title: '예측 분석',
          description: '향후 트렌드를 예측하고 있습니다...',
          status: 'pending',
        }
      );
    }

    baseSteps.push(
      {
        type: 'generation',
        title: '응답 생성',
        description: '최적의 응답을 생성하고 있습니다...',
        status: 'pending',
      },
      {
        type: 'validation',
        title: '응답 검증',
        description: '생성된 응답을 검증하고 있습니다...',
        status: 'pending',
      }
    );

    return baseSteps.map((step, index) => ({
      ...step,
      id: this.generateStepId(),
      step: index + 1,
      startTime: Date.now(),
    }));
  }

  /**
   * 사고 과정 시뮬레이션 (데모용)
   */
  async simulateThinking(
    sessionId: string,
    steps: ThinkingStep[],
    onProgress?: (step: ThinkingStep) => void
  ): Promise<void> {
    for (const step of steps) {
      // 단계 시작
      this.updateThinkingStep(sessionId, step.id, {
        status: 'processing',
        progress: 0,
      });

      // 진행률 시뮬레이션
      for (let progress = 0; progress <= 100; progress += 20) {
        this.updateThinkingStep(sessionId, step.id, { progress });
        onProgress?.(step);

        // 실제 처리 시간 시뮬레이션
        await this.delay(100 + Math.random() * 200);
      }

      // 단계 완료
      this.updateThinkingStep(sessionId, step.id, {
        status: 'completed',
        progress: 100,
      });

      // 단계 간 간격
      await this.delay(200);
    }
  }

  /**
   * 사고 과정 보안 검증
   */
  validateThinkingAccess(sessionId: string, userId?: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    // 여기에 사용자 권한 검증 로직 추가
    // 예: 세션 소유자 확인, 관리자 권한 확인 등

    return true;
  }

  /**
   * 사고 과정 데이터 보호
   */
  getProtectedThinkingData(sessionId: string): Partial<ThinkingSession> | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // 민감한 정보 제거
    return {
      sessionId: session.sessionId,
      queryId: session.queryId,
      mode: session.mode,
      startTime: session.startTime,
      endTime: session.endTime,
      totalDuration: session.totalDuration,
      status: session.status,
      steps: session.steps.map(step => ({
        id: step.id,
        step: step.step,
        type: step.type,
        title: step.title,
        description: step.description,
        status: step.status,
        startTime: step.startTime,
        endTime: step.endTime,
        progress: step.progress,
        duration: step.duration,
        // details는 제외 (민감한 정보 포함 가능)
      })),
    };
  }

  /**
   * 세션 정리
   */
  cleanupOldSessions(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      const sessionAge = now - session.startTime;
      if (sessionAge > maxAge) {
        toDelete.push(sessionId);
      }
    }

    toDelete.forEach(sessionId => {
      this.sessions.delete(sessionId);
    });

    if (toDelete.length > 0) {
      console.log(`🧹 Cleaned up ${toDelete.length} old thinking sessions`);
    }
  }

  private generateSessionId(): string {
    return `thinking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateStepId(): string {
    return `step_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private notifyCallbacks(session: ThinkingSession, step?: ThinkingStep): void {
    this.callbacks.forEach(callback => {
      try {
        callback(session, step);
      } catch (error) {
        console.error('Thinking callback error:', error);
      }
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 정리 작업
   */
  async cleanup(): Promise<void> {
    this.sessions.clear();
    this.callbacks.clear();
    console.log('🧹 Thinking Processor cleanup completed');
  }
}
