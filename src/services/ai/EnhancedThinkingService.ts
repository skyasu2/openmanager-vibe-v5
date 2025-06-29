/**
 * 🧠 Enhanced AI 사고 과정 추적 서비스
 *
 * 실제 AI 엔진들의 처리 과정을 추적하고 시각화를 위한 데이터를 제공
 */

import { EventEmitter } from 'events';
import { AgentLog } from '@/stores/useAISidebarStore';

export interface EnhancedThinkingStep {
  id: string;
  engine: string;
  type: 'analyzing' | 'processing' | 'searching' | 'generating' | 'completed';
  content: string;
  timestamp: Date;
  progress?: number;
  duration?: number;
}

export interface ThinkingSession {
  sessionId: string;
  question: string;
  startTime: Date;
  steps: EnhancedThinkingStep[];
  isActive: boolean;
}

export class EnhancedThinkingService extends EventEmitter {
  private static instance: EnhancedThinkingService;
  private activeSessions = new Map<string, ThinkingSession>();
  private stepCounter = 0;
  private stepTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private sessionTimeouts: Map<string, NodeJS.Timeout> = new Map();

  // 🕐 타임아웃 설정 - 사용자 요청에 따라 30초씩, 전체 1분
  private readonly STEP_TIMEOUT = 30000; // 30초 - 각 단계별 충분한 대기
  private readonly TOTAL_TIMEOUT = 60000; // 1분 - 전체 세션 타임아웃
  private readonly TYPING_SPEED = 25; // 타이핑 애니메이션 속도 (ms)

  private constructor() {
    super();
    this.setMaxListeners(50); // 다중 세션 지원
  }

  static getInstance(): EnhancedThinkingService {
    if (!EnhancedThinkingService.instance) {
      EnhancedThinkingService.instance = new EnhancedThinkingService();
    }
    return EnhancedThinkingService.instance;
  }

  /**
   * 🚀 사고 과정 세션 시작
   */
  startThinkingSession(question: string): string {
    const sessionId = `thinking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: ThinkingSession = {
      sessionId,
      question,
      startTime: new Date(),
      steps: [],
      isActive: true,
    };

    this.activeSessions.set(sessionId, session);

    // 초기 분석 단계 추가
    this.addThinkingStep(
      sessionId,
      'Unified',
      'analyzing',
      '사용자 질문을 분석하고 있습니다...'
    );

    this.emit('session_started', session);

    // 전체 세션 타임아웃 설정 (1분)
    const sessionTimeout = setTimeout(() => {
      this.handleSessionTimeout(sessionId);
    }, this.TOTAL_TIMEOUT);

    this.sessionTimeouts.set(sessionId, sessionTimeout);

    return sessionId;
  }

  /**
   * 💭 사고 과정 단계 추가
   */
  addThinkingStep(
    sessionId: string,
    engine: string,
    type: EnhancedThinkingStep['type'],
    content: string,
    progress?: number
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.isActive) return;

    const step: EnhancedThinkingStep = {
      id: `step_${++this.stepCounter}`,
      engine,
      type,
      content,
      timestamp: new Date(),
      progress,
    };

    session.steps.push(step);
    this.emit('step_added', { sessionId, step });

    // 자동으로 다음 단계 시뮬레이션 (실제 구현에서는 실제 엔진 응답 대기)
    if (type !== 'completed') {
      this.simulateNextStep(sessionId, engine, type);
    }

    // 단계별 타임아웃 설정 (30초)
    const stepTimeout = setTimeout(() => {
      this.handleStepTimeout(sessionId, step.id);
    }, this.STEP_TIMEOUT);

    this.stepTimeouts.set(step.id, stepTimeout);

    // 진행률 애니메이션 시작
    this.animateStepProgress(sessionId, step.id);
  }

  /**
   * 🔄 다음 단계 시뮬레이션 (실제 환경에서는 실제 엔진 응답으로 대체)
   */
  private simulateNextStep(
    sessionId: string,
    engine: string,
    currentType: string
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.isActive) return;

    // 실제 AI 엔진 처리 과정 시뮬레이션
    setTimeout(
      () => {
        const nextSteps = this.getNextStepsByEngine(engine, currentType);

        if (nextSteps.length > 0) {
          const nextStep = nextSteps[0];
          this.addThinkingStep(
            sessionId,
            engine,
            nextStep.type,
            nextStep.content,
            nextStep.progress
          );
        }

        // MCP 엔진 완료 후 RAG 엔진 시작
        if (engine === 'MCP' && currentType === 'completed') {
          setTimeout(() => {
            this.addThinkingStep(
              sessionId,
              'RAG',
              'searching',
              '관련 문서를 검색하고 있습니다...'
            );
          }, 800);
        }

        // RAG 엔진 완료 후 Google AI 시작
        if (engine === 'RAG' && currentType === 'completed') {
          setTimeout(() => {
            this.addThinkingStep(
              sessionId,
              'Google-AI',
              'generating',
              'Google AI로 최종 답변을 생성하고 있습니다...'
            );
          }, 1200);
        }
      },
      Math.random() * 1500 + 500
    ); // 0.5~2초 랜덤 지연
  }

  /**
   * 🎯 엔진별 다음 단계 정의
   */
  private getNextStepsByEngine(
    engine: string,
    currentType: string
  ): Array<{
    type: EnhancedThinkingStep['type'];
    content: string;
    progress?: number;
  }> {
    const stepMap: Record<string, Record<string, any[]>> = {
      Unified: {
        analyzing: [
          {
            type: 'processing',
            content:
              '질문 유형을 분류하고 적절한 AI 엔진을 선택하고 있습니다...',
            progress: 0.3,
          },
        ],
        processing: [
          {
            type: 'completed',
            content: 'MCP 엔진으로 전환합니다.',
            progress: 1.0,
          },
        ],
      },
      MCP: {
        analyzing: [
          {
            type: 'processing',
            content: '서버 컨텍스트와 시스템 상태를 분석하고 있습니다...',
            progress: 0.4,
          },
        ],
        processing: [
          {
            type: 'generating',
            content: '서버 데이터를 기반으로 초기 분석을 수행하고 있습니다...',
            progress: 0.8,
          },
        ],
        generating: [
          {
            type: 'completed',
            content: 'MCP 엔진 분석 완료. 추가 정보 검색이 필요합니다.',
            progress: 1.0,
          },
        ],
      },
      RAG: {
        searching: [
          {
            type: 'processing',
            content: '벡터 데이터베이스에서 관련 문서를 찾았습니다...',
            progress: 0.6,
          },
        ],
        processing: [
          {
            type: 'generating',
            content: '찾은 문서들을 분석하여 컨텍스트를 구성하고 있습니다...',
            progress: 0.9,
          },
        ],
        generating: [
          {
            type: 'completed',
            content: 'RAG 검색 완료. Google AI로 최종 답변을 생성합니다.',
            progress: 1.0,
          },
        ],
      },
      'Google-AI': {
        generating: [
          {
            type: 'processing',
            content: 'Google AI가 종합적인 답변을 작성하고 있습니다...',
            progress: 0.7,
          },
        ],
        processing: [
          {
            type: 'completed',
            content: '모든 AI 엔진의 분석이 완료되었습니다.',
            progress: 1.0,
          },
        ],
      },
    };

    return stepMap[engine]?.[currentType] || [];
  }

  /**
   * ✅ 사고 과정 세션 완료
   */
  completeThinkingSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.isActive = false;

    // 최종 완료 단계 추가
    const finalStep: EnhancedThinkingStep = {
      id: `step_${++this.stepCounter}`,
      engine: 'System',
      type: 'completed',
      content: '🎉 모든 AI 엔진의 협력으로 답변이 완성되었습니다!',
      timestamp: new Date(),
      progress: 1.0,
    };

    session.steps.push(finalStep);
    this.emit('session_completed', session);

    // 타임아웃 정리
    this.clearSessionTimeouts(sessionId);
  }

  /**
   * 📊 활성 세션 조회
   */
  getActiveSession(sessionId: string): ThinkingSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * 📋 모든 활성 세션 조회
   */
  getAllActiveSessions(): ThinkingSession[] {
    return Array.from(this.activeSessions.values()).filter(
      session => session.isActive
    );
  }

  /**
   * 🧹 세션 정리
   */
  clearSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
  }

  /**
   * 🔧 실제 AI 엔진 연동을 위한 훅
   */
  onEngineStart(sessionId: string, engine: string, operation: string): void {
    this.addThinkingStep(
      sessionId,
      engine,
      'analyzing',
      `${engine} 엔진이 ${operation} 작업을 시작합니다...`
    );
  }

  onEngineProgress(
    sessionId: string,
    engine: string,
    message: string,
    progress: number
  ): void {
    this.addThinkingStep(sessionId, engine, 'processing', message, progress);
  }

  onEngineComplete(sessionId: string, engine: string, result: string): void {
    this.addThinkingStep(sessionId, engine, 'completed', result, 1.0);
  }

  /**
   * 단계 완료 처리
   */
  completeStep(sessionId: string, stepId?: string, duration?: number): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const step = stepId
      ? session.steps.find(s => s.id === stepId)
      : session.steps[session.steps.length - 1];

    if (step) {
      step.progress = 1;
      step.duration = duration || Date.now() - step.timestamp.getTime();

      // 단계 타임아웃 정리
      const timeout = this.stepTimeouts.get(step.id);
      if (timeout) {
        clearTimeout(timeout);
        this.stepTimeouts.delete(step.id);
      }

      this.emit('stepCompleted', session, step);
    }
  }

  /**
   * 단계 타임아웃 처리 (30초)
   */
  private handleStepTimeout(sessionId: string, stepId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const step = session.steps.find(s => s.id === stepId);
    if (step && (step.progress || 0) < 1) {
      // 타임아웃된 단계를 부분 완료로 처리
      step.progress = 0.8; // 80% 완료로 표시
      step.duration = this.STEP_TIMEOUT;

      // 다음 단계로 자동 진행하거나 폴백 처리
      this.handleStepFallback(sessionId, step);

      this.emit('stepTimeout', session, step);
    }

    this.stepTimeouts.delete(stepId);
  }

  /**
   * 세션 타임아웃 처리 (1분)
   */
  private handleSessionTimeout(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.isActive = false;
    session.steps.forEach(step => {
      if ((step.progress || 0) < 1) {
        step.progress = 0.8;
        step.duration = step.duration || this.STEP_TIMEOUT;
      }
    });

    this.clearSessionTimeouts(sessionId);
    this.emit('sessionTimeout', session);
  }

  /**
   * 단계 폴백 처리
   */
  private handleStepFallback(
    sessionId: string,
    timeoutStep: EnhancedThinkingStep
  ): void {
    // 타임아웃된 엔진에서 다른 엔진으로 폴백
    const fallbackEngines: Record<string, string> = {
      MCP: 'Local',
      'Google-AI': 'RAG',
      RAG: 'Unified',
      Unified: 'Local',
      Local: 'Local', // 최종 폴백
    };

    const fallbackEngine = fallbackEngines[timeoutStep.engine] || 'Local';

    // 폴백 단계 추가
    this.addThinkingStep(
      sessionId,
      fallbackEngine,
      timeoutStep.type,
      `${timeoutStep.engine} 엔진 타임아웃으로 ${fallbackEngine} 엔진으로 전환하여 처리합니다.`
    );
  }

  /**
   * 세션 타임아웃 정리
   */
  private clearSessionTimeouts(sessionId: string): void {
    // 세션 타임아웃 정리
    const sessionTimeout = this.sessionTimeouts.get(sessionId);
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      this.sessionTimeouts.delete(sessionId);
    }

    // 해당 세션의 모든 단계 타임아웃 정리
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.steps.forEach(step => {
        const stepTimeout = this.stepTimeouts.get(step.id);
        if (stepTimeout) {
          clearTimeout(stepTimeout);
          this.stepTimeouts.delete(step.id);
        }
      });
    }
  }

  /**
   * AgentLog 형식으로 변환
   */
  convertToAgentLogs(sessionId: string): AgentLog[] {
    const session = this.activeSessions.get(sessionId);
    if (!session) return [];

    return session.steps.map(step => {
      // 타입 매핑
      const mappedType: AgentLog['type'] =
        step.type === 'analyzing'
          ? 'analysis'
          : step.type === 'processing'
            ? 'data_processing'
            : step.type === 'searching'
              ? 'pattern_matching'
              : step.type === 'generating'
                ? 'response_generation'
                : 'info';

      return {
        id: step.id,
        message: step.content,
        type: mappedType,
        timestamp: step.timestamp,
        // 확장 필드 (타입 어설션 사용)
        step: step.type,
        engine: step.engine,
        progress: step.progress || 0,
        duration: step.duration,
        content: step.content,
        metadata: step.progress ? { confidence: step.progress } : undefined,
      } as AgentLog & {
        step: string;
        engine: string;
        progress: number;
        duration?: number;
        content: string;
        metadata?: any;
      };
    });
  }

  /**
   * 단계 진행률 애니메이션
   */
  private animateStepProgress(sessionId: string, stepId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const step = session.steps.find(s => s.id === stepId);
    if (!step) return;

    let progress = 0;
    const increment = 0.02; // 2%씩 증가
    const interval = 200; // 200ms 간격

    const progressInterval = setInterval(() => {
      if ((step.progress || 0) >= 1 || !session.isActive) {
        clearInterval(progressInterval);
        return;
      }

      progress += increment;
      step.progress = Math.min(progress, 0.95); // 95%까지만 자동 증가

      this.emit('stepUpdated', session, step);
    }, interval);
  }

  /**
   * 서비스 정리
   */
  cleanup(): void {
    // 모든 타임아웃 정리
    this.sessionTimeouts.forEach(timeout => clearTimeout(timeout));
    this.stepTimeouts.forEach(timeout => clearTimeout(timeout));

    this.sessionTimeouts.clear();
    this.stepTimeouts.clear();
    this.activeSessions.clear();

    this.removeAllListeners();
  }
}

// 싱글톤 인스턴스 내보내기
export const enhancedThinkingService = EnhancedThinkingService.getInstance();

// 정리 함수 (앱 종료 시 호출)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    enhancedThinkingService.cleanup();
  });
}

// 30초마다 오래된 세션 정리
setInterval(() => {
  const now = Date.now();
  const sessions = enhancedThinkingService.getAllActiveSessions();

  sessions.forEach(session => {
    // 5분 이상 된 세션은 자동 정리
    if (now - session.startTime.getTime() > 300000) {
      enhancedThinkingService.completeThinkingSession(session.sessionId);
    }
  });
}, 30000);

export default enhancedThinkingService;
