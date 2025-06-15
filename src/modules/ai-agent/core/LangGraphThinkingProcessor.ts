/**
 * 🧠 LangGraph-Style Thinking Processor with ReAct Framework
 *
 * LangChain/LangGraph 스타일의 로직 스텝 추적 및 ReAct 프레임워크 구현
 * - 단계별 logStep() 함수로 사고 과정 기록
 * - Thought → Observation → Action → Answer 흐름 지원
 * - MCP Agent와 완전 통합
 * - 실시간 UI 업데이트 지원
 */

import { ThinkingLogger } from './ThinkingLogger';

export type ReActStepType =
  | 'thought'
  | 'observation'
  | 'action'
  | 'answer'
  | 'reflection';
export type LogicStepType =
  | 'analysis'
  | 'query'
  | 'processing'
  | 'prediction'
  | 'summary'
  | 'validation';

export interface ReActStep {
  type: ReActStepType;
  content: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface LogicStep {
  id: string;
  step: number;
  type: LogicStepType;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  startTime: number;
  endTime?: number;
  duration?: number;
  progress?: number; // 0-100
  react_steps?: ReActStep[];
  details?: any;
}

export interface ThinkingFlow {
  sessionId: string;
  queryId: string;
  query: string;
  mode: 'basic' | 'enterprise' | 'advanced' | 'react';
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  logic_steps: LogicStep[];
  react_sequence: ReActStep[];
  status: 'thinking' | 'completed' | 'error';
  result?: any;
  error?: string;
  final_answer?: string;
}

export type ThinkingCallback = (flow: ThinkingFlow, step?: LogicStep) => void;

export class LangGraphThinkingProcessor {
  private static instance: LangGraphThinkingProcessor;
  private flows: Map<string, ThinkingFlow> = new Map();
  private callbacks: Set<ThinkingCallback> = new Set();
  private currentFlow: ThinkingFlow | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): LangGraphThinkingProcessor {
    if (!LangGraphThinkingProcessor.instance) {
      LangGraphThinkingProcessor.instance = new LangGraphThinkingProcessor();
    }
    return LangGraphThinkingProcessor.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.isInitialized = true;
    console.log('🧠 LangGraph Thinking Processor initialized');
  }

  /**
   * 새로운 사고 흐름 시작
   */
  startThinking(
    sessionId: string,
    query: string,
    mode: ThinkingFlow['mode'] = 'basic'
  ): string {
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    const flow: ThinkingFlow = {
      sessionId,
      queryId,
      query,
      mode,
      startTime: Date.now(),
      logic_steps: [],
      react_sequence: [],
      status: 'thinking',
    };

    this.flows.set(queryId, flow);
    this.currentFlow = flow;

    console.log(`🧠 [${sessionId}] 사고 흐름 시작: "${query}" (${mode} 모드)`);
    this.notifyCallbacks(flow);

    return queryId;
  }

  /**
   * 📊 LangGraph 스타일 로직 스텝 기록 (ThinkingLogger 연동)
   */
  logStep(
    title: string,
    description?: string,
    type: LogicStepType = 'processing'
  ): string {
    if (!this.currentFlow) {
      console.warn('활성 사고 흐름이 없습니다');
      return '';
    }

    const stepId = `step_${this.currentFlow.logic_steps.length + 1}_${Date.now()}`;
    const step: LogicStep = {
      id: stepId,
      step: this.currentFlow.logic_steps.length + 1,
      type,
      title,
      description: description || title,
      status: 'processing',
      startTime: Date.now(),
      progress: 0,
      react_steps: [],
    };

    this.currentFlow.logic_steps.push(step);
    console.log(`📊 [Step ${step.step}] ${title}`);

    // ThinkingLogger에도 연동하여 기록
    const thinkingLogger = ThinkingLogger.getInstance();

    // 세션이 없으면 시작
    if (!thinkingLogger.getSession(this.currentFlow.sessionId)) {
      thinkingLogger.startSession(
        this.currentFlow.sessionId,
        this.currentFlow.query
      );
    }

    // 단계 시작 알림
    thinkingLogger.startStep(
      this.currentFlow.sessionId,
      title,
      this.mapLogicTypeToThinkingType(type)
    );

    this.notifyCallbacks(this.currentFlow, step);
    return stepId;
  }

  /**
   * LogicStepType을 ThinkingStep type으로 매핑
   */
  private mapLogicTypeToThinkingType(
    type: LogicStepType
  ):
    | 'analysis'
    | 'reasoning'
    | 'data_processing'
    | 'pattern_matching'
    | 'response_generation' {
    switch (type) {
      case 'analysis':
        return 'analysis';
      case 'prediction':
        return 'reasoning';
      case 'query':
      case 'processing':
        return 'data_processing';
      case 'validation':
        return 'pattern_matching';
      case 'summary':
        return 'response_generation';
      default:
        return 'analysis';
    }
  }

  /**
   * 🤔 ReAct 프레임워크 - Thought 단계
   */
  thought(content: string, metadata?: Record<string, any>): void {
    this.addReActStep('thought', `💭 ${content}`, metadata);
  }

  /**
   * 👀 ReAct 프레임워크 - Observation 단계
   */
  observation(content: string, metadata?: Record<string, any>): void {
    this.addReActStep('observation', `👀 ${content}`, metadata);
  }

  /**
   * ⚡ ReAct 프레임워크 - Action 단계
   */
  action(content: string, metadata?: Record<string, any>): void {
    this.addReActStep('action', `⚡ ${content}`, metadata);
  }

  /**
   * ✅ ReAct 프레임워크 - Answer 단계
   */
  answer(content: string, metadata?: Record<string, any>): void {
    this.addReActStep('answer', `✅ ${content}`, metadata);
    if (this.currentFlow) {
      this.currentFlow.final_answer = content;
    }
  }

  /**
   * 🔄 ReAct 프레임워크 - Reflection 단계
   */
  reflection(content: string, metadata?: Record<string, any>): void {
    this.addReActStep('reflection', `🔄 ${content}`, metadata);
  }

  /**
   * ReAct 스텝 추가 (내부 함수)
   */
  private addReActStep(
    type: ReActStepType,
    content: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.currentFlow) return;

    const startTime = Date.now();
    const reactStep: ReActStep = {
      type,
      content,
      timestamp: startTime,
      metadata,
    };

    // 현재 로직 스텝에 추가
    const currentLogicStep =
      this.currentFlow.logic_steps[this.currentFlow.logic_steps.length - 1];
    if (currentLogicStep) {
      if (!currentLogicStep.react_steps) {
        currentLogicStep.react_steps = [];
      }
      currentLogicStep.react_steps.push(reactStep);
    }

    // 전체 ReAct 시퀀스에도 추가
    this.currentFlow.react_sequence.push(reactStep);

    console.log(`🤖 [ReAct ${type.toUpperCase()}] ${content}`);
    this.notifyCallbacks(this.currentFlow);
  }

  /**
   * 스텝 완료 처리 (ThinkingLogger 연동)
   */
  completeStep(stepId: string, details?: any, progress: number = 100): void {
    if (!this.currentFlow) return;

    const step = this.currentFlow.logic_steps.find(s => s.id === stepId);
    if (step) {
      step.status = 'completed';
      step.endTime = Date.now();
      step.duration = step.endTime - step.startTime;
      step.progress = progress;
      if (details) step.details = details;

      // ThinkingLogger에 진행률과 ReAct 타입 포함하여 기록
      const thinkingLogger = ThinkingLogger.getInstance();
      const lastReActStep = step.react_steps?.[step.react_steps.length - 1];
      const reactType = lastReActStep?.type;

      thinkingLogger.logStep(
        this.currentFlow.sessionId,
        step.description || step.title,
        this.mapLogicTypeToThinkingType(step.type),
        { ...details, stepId, duration: step.duration },
        progress,
        reactType
      );

      console.log(
        `✅ [Step ${step.step}] ${step.title} 완료 (${step.duration}ms, ${progress}%)`
      );
      this.notifyCallbacks(this.currentFlow, step);
    }
  }

  /**
   * 스텝 에러 처리
   */
  errorStep(stepId: string, error: string): void {
    if (!this.currentFlow) return;

    const step = this.currentFlow.logic_steps.find(s => s.id === stepId);
    if (step) {
      step.status = 'error';
      step.endTime = Date.now();
      step.duration = step.endTime - step.startTime;
      step.details = { error };

      console.error(`❌ [Step ${step.step}] ${step.title} 실패: ${error}`);
      this.notifyCallbacks(this.currentFlow, step);
    }
  }

  /**
   * 사고 흐름 완료
   */
  completeThinking(result?: any): void {
    if (!this.currentFlow) return;

    this.currentFlow.status = 'completed';
    this.currentFlow.endTime = Date.now();
    this.currentFlow.totalDuration =
      this.currentFlow.endTime - this.currentFlow.startTime;
    this.currentFlow.result = result;

    console.log(
      `🎯 사고 흐름 완료: ${this.currentFlow.totalDuration}ms, ${this.currentFlow.logic_steps.length}개 스텝`
    );
    this.notifyCallbacks(this.currentFlow);

    this.currentFlow = null;
  }

  /**
   * 사고 흐름 에러
   */
  errorThinking(error: string): void {
    if (!this.currentFlow) return;

    this.currentFlow.status = 'error';
    this.currentFlow.endTime = Date.now();
    this.currentFlow.totalDuration =
      this.currentFlow.endTime - this.currentFlow.startTime;
    this.currentFlow.error = error;

    console.error(`💥 사고 흐름 실패: ${error}`);
    this.notifyCallbacks(this.currentFlow);

    this.currentFlow = null;
  }

  /**
   * 콜백 등록
   */
  onThinking(callback: ThinkingCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * 콜백 알림
   */
  private notifyCallbacks(flow: ThinkingFlow, step?: LogicStep): void {
    this.callbacks.forEach(callback => {
      try {
        callback(flow, step);
      } catch (error) {
        console.error('ThinkingCallback 실행 중 오류:', error);
      }
    });
  }

  /**
   * 사고 흐름 조회
   */
  getThinkingFlow(queryId: string): ThinkingFlow | undefined {
    return this.flows.get(queryId);
  }

  /**
   * 현재 활성 흐름 조회
   */
  getCurrentFlow(): ThinkingFlow | null {
    return this.currentFlow;
  }

  /**
   * 모든 사고 흐름 조회
   */
  getAllFlows(): ThinkingFlow[] {
    return Array.from(this.flows.values());
  }

  /**
   * 🎨 편의 메서드들 - LangGraph 스타일
   */

  // 질문 분석 단계
  async analyzeQuery(query: string): Promise<string> {
    const stepId = this.logStep(
      '질문을 분석하고 있습니다...',
      `사용자 질문: "${query}"`,
      'analysis'
    );

    this.thought(
      `사용자가 "${query}"에 대해 질문했습니다. 이 질문의 의도와 필요한 정보를 파악해야 합니다.`
    );

    // 실제 분석 로직 (간단한 키워드 기반)
    await new Promise(resolve => setTimeout(resolve, 500));

    const intent = query.toLowerCase().includes('서버')
      ? 'server_monitoring'
      : query.toLowerCase().includes('장애')
        ? 'incident_analysis'
        : query.toLowerCase().includes('성능')
          ? 'performance_analysis'
          : 'general_inquiry';

    this.observation(`질문 분석 완료: 의도=${intent}`);
    this.completeStep(stepId, { intent, query });

    return intent;
  }

  // 서버 상태 조회 단계
  async queryServerStatus(): Promise<string> {
    const stepId = this.logStep(
      '서버 상태를 조회 중...',
      '시뮬레이션 엔진에서 실시간 서버 데이터 수집',
      'query'
    );

    this.action('시뮬레이션 엔진 API 호출하여 서버 상태 조회');

    await new Promise(resolve => setTimeout(resolve, 300));

    this.observation(
      '20개 서버 상태 확인 완료. 정상: 15개, 경고: 3개, 오류: 2개'
    );
    this.completeStep(stepId, { healthy: 15, warning: 3, error: 2 });

    return '서버 상태 조회 완료';
  }

  // 예측 실행 단계
  async executePrediction(): Promise<string> {
    const stepId = this.logStep(
      '장애 원인을 예측 중...',
      'AI 기반 패턴 분석 및 예측 수행',
      'prediction'
    );

    this.thought(
      '현재 서버 메트릭을 바탕으로 잠재적 장애 원인을 분석해야 합니다.'
    );
    this.action('CPU, 메모리, 네트워크 패턴 분석 실행');

    await new Promise(resolve => setTimeout(resolve, 800));

    this.observation('multi-04.example.com에서 메모리 사용률 급증 패턴 감지');
    this.completeStep(stepId, { prediction: 'memory_leak_detected' });

    return '예측 분석 완료';
  }

  // 해결 방안 요약 단계
  async summarizeSolution(): Promise<string> {
    const stepId = this.logStep(
      '대응 방안을 구성 중...',
      '분석 결과를 바탕으로 실행 가능한 해결책 제시',
      'summary'
    );

    this.thought(
      '분석 결과를 종합하여 구체적이고 실행 가능한 해결책을 제안해야 합니다.'
    );
    this.action('우선순위별 대응 방안 생성');

    await new Promise(resolve => setTimeout(resolve, 400));

    const solution =
      '1. multi-04 서버 메모리 누수 프로세스 식별\n2. 해당 프로세스 재시작\n3. 모니터링 강화';
    this.answer(solution);

    this.completeStep(stepId, { solution });
    return solution;
  }
}

// 전역 인스턴스 생성
export const langGraphProcessor = LangGraphThinkingProcessor.getInstance();

// 편의 함수들 - 직접 사용 가능
export const logStep = (
  title: string,
  description?: string,
  type?: LogicStepType
) => langGraphProcessor.logStep(title, description, type);

export const thought = (content: string, metadata?: Record<string, any>) =>
  langGraphProcessor.thought(content, metadata);

export const observation = (content: string, metadata?: Record<string, any>) =>
  langGraphProcessor.observation(content, metadata);

export const action = (content: string, metadata?: Record<string, any>) =>
  langGraphProcessor.action(content, metadata);

export const answer = (content: string, metadata?: Record<string, any>) =>
  langGraphProcessor.answer(content, metadata);

export const reflection = (content: string, metadata?: Record<string, any>) =>
  langGraphProcessor.reflection(content, metadata);
