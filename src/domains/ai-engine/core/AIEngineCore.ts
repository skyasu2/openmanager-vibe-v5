/**
 * 🧠 AI Engine Core Implementation
 *
 * AI 엔진의 핵심 비즈니스 로직 구현
 * - 자연어 질의 처리
 * - 사고 과정 시뮬레이션
 * - 스트리밍 응답 처리
 */

import { generateId } from '@/lib/utils-functions';
import { IAIEngineCore } from '../interfaces';
import {
  AIResponse,
  ConversationItem,
  StreamEvent,
  SystemLogEntry,
  ThinkingStep,
} from '../types';

export class AIEngineCore implements IAIEngineCore {
  private readonly API_ENDPOINT = '/api/ai-agent';

  /**
   * 자연어 질의 처리
   */
  async processQuery(question: string): Promise<AIResponse> {
    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AI 질의 처리 오류:', error);
      return {
        content: '죄송합니다. 현재 AI 서비스에 일시적인 문제가 발생했습니다.',
        metadata: {
          engine: 'fallback',
          processingTime: 0,
        },
      };
    }
  }

  /**
   * 스트리밍 응답 처리
   */
  async processStreamingQuery(
    question: string,
    onEvent: (event: StreamEvent) => void
  ): Promise<ConversationItem> {
    const conversationId = generateId(8);
    const systemLogs = this.generateSystemLogs(question);
    const category = this.determineCategory(question);

    const conversation: ConversationItem = {
      id: conversationId,
      question,
      thinkingSteps: [],
      response: '',
      isComplete: false,
      timestamp: Date.now(),
      category,
      systemLogs,
    };

    // 사고 과정 시뮬레이션
    const thinkingSteps = await this.simulateThinking(question, step => {
      onEvent({
        type: 'thinking',
        step: step.id,
        index: step.progress,
        logs: step.logs,
      });
    });

    conversation.thinkingSteps = thinkingSteps;

    // AI 응답 생성
    onEvent({ type: 'response_start' });

    try {
      const aiResponse = await this.processQuery(question);
      const responseText = aiResponse.content || aiResponse.response || '';

      // 타이핑 효과를 위한 청크 단위 전송
      const chunks = this.splitIntoChunks(responseText, 10);
      for (const chunk of chunks) {
        onEvent({
          type: 'response_chunk',
          chunk,
        });
        await this.delay(50); // 타이핑 효과
      }

      conversation.response = responseText;
      conversation.isComplete = true;

      onEvent({ type: 'complete' });
    } catch (error) {
      onEvent({
        type: 'error',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      });
    }

    return conversation;
  }

  /**
   * 사고 과정 시뮬레이션
   */
  async simulateThinking(
    question: string,
    onStep: (step: ThinkingStep) => void
  ): Promise<ThinkingStep[]> {
    const steps = this.generateThinkingSteps(question);
    const results: ThinkingStep[] = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      step.progress = Math.round(((i + 1) / steps.length) * 100);

      onStep(step);
      results.push(step);

      // 단계별 처리 시간 시뮬레이션
      await this.delay(800 + Math.random() * 1200);

      step.completed = true;
      step.duration = Date.now() - step.timestamp;
      onStep(step);
    }

    return results;
  }

  /**
   * 시스템 로그 생성
   */
  generateSystemLogs(question: string): SystemLogEntry[] {
    const timestamp = new Date().toISOString();
    const logs: SystemLogEntry[] = [];

    // 질문 분석 로그
    logs.push({
      timestamp,
      level: 'info',
      source: 'query-analyzer',
      message: `자연어 질의 수신: "${question.substring(0, 50)}${question.length > 50 ? '...' : ''}"`,
      metadata: { questionLength: question.length },
    });

    // 카테고리 분류 로그
    const category = this.determineCategory(question);
    logs.push({
      timestamp,
      level: 'info',
      source: 'categorizer',
      message: `질의 카테고리 분류: ${category}`,
      metadata: { category },
    });

    // 시스템 상태 로그
    logs.push({
      timestamp,
      level: 'info',
      source: 'system-monitor',
      message: '시스템 상태 정상, AI 엔진 준비 완료',
      metadata: {
        cpuUsage: Math.round(Math.random() * 30 + 20),
        memoryUsage: Math.round(Math.random() * 40 + 30),
      },
    });

    // 조건부 경고 로그
    if (question.includes('오류') || question.includes('문제')) {
      logs.push({
        timestamp,
        level: 'warning',
        source: 'alert-detector',
        message: '잠재적 문제 상황 키워드 감지',
        metadata: { keywords: ['오류', '문제'] },
      });
    }

    return logs;
  }

  /**
   * 질문 카테고리 결정
   */
  determineCategory(question: string): string {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('서버') || lowerQuestion.includes('시스템')) {
      return '시스템 모니터링';
    }
    if (lowerQuestion.includes('오류') || lowerQuestion.includes('에러')) {
      return '장애 분석';
    }
    if (lowerQuestion.includes('성능') || lowerQuestion.includes('속도')) {
      return '성능 분석';
    }
    if (lowerQuestion.includes('로그') || lowerQuestion.includes('기록')) {
      return '로그 분석';
    }
    if (lowerQuestion.includes('예측') || lowerQuestion.includes('미래')) {
      return '예측 분석';
    }

    return '일반 질의';
  }

  /**
   * 사고 과정 단계 생성
   */
  private generateThinkingSteps(question: string): ThinkingStep[] {
    const baseSteps = [
      {
        id: generateId(6),
        title: '질문 분석 중...',
        content: '사용자의 질문을 분석하고 의도를 파악하고 있습니다.',
        logs: [] as any[],
        progress: 0,
        completed: false,
        timestamp: Date.now(),
      },
      {
        id: generateId(6),
        title: '관련 데이터 수집 중...',
        content: '질문과 관련된 시스템 데이터와 로그를 수집하고 있습니다.',
        logs: [] as any[],
        progress: 0,
        completed: false,
        timestamp: Date.now(),
      },
      {
        id: generateId(6),
        title: '패턴 분석 중...',
        content: '수집된 데이터에서 패턴과 이상 징후를 분석하고 있습니다.',
        logs: [] as any[],
        progress: 0,
        completed: false,
        timestamp: Date.now(),
      },
      {
        id: generateId(6),
        title: '답변 생성 중...',
        content: '분석 결과를 바탕으로 최적의 답변을 생성하고 있습니다.',
        logs: [] as any[],
        progress: 0,
        completed: false,
        timestamp: Date.now(),
      },
    ];

    // 질문 유형에 따른 추가 단계
    const category = this.determineCategory(question);
    if (category === '장애 분석') {
      baseSteps.splice(2, 0, {
        id: generateId(6),
        title: '장애 원인 추적 중...',
        content: '시스템 로그를 분석하여 장애의 근본 원인을 추적하고 있습니다.',
        logs: [] as any[],
        progress: 0,
        completed: false,
        timestamp: Date.now(),
      });
    }

    return baseSteps;
  }

  /**
   * 텍스트를 청크로 분할
   */
  private splitIntoChunks(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * 지연 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
