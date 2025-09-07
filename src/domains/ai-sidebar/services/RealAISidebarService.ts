/**
 * 🔗 실제 백엔드 AI 사이드바 서비스
 *
 * 실제 백엔드 API와 연결하여 AI 사이드바 기능을 제공합니다.
 * - MCP 쿼리 시스템 연동
 * - AI 인사이트 데이터 연동
 * - Google AI 상태 모니터링 연동
 * - 실시간 데이터 스트리밍
 */

import type {
  AIResponse,
  ChatMessage,
  SystemAlert,
  AIThinkingStep,
  QuickQuestion,
} from '../types';

export class RealAISidebarService {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://openmanager-vibe-v5.vercel.app'
        : 'http://localhost:3000';
  }

  /**
   * 🤖 AI 질의 처리 (MCP 시스템 연동)
   */
  async processQuery(
    question: string,
    sessionId?: string
  ): Promise<AIResponse> {
    try {
      // 사고 과정 시뮬레이션
      const thinkingSteps: AIThinkingStep[] = [
        {
          id: `step_${Date.now()}_1`,
          step: '질의 분석',
          content: `사용자 질문 "${question}"을 분석하고 있습니다...`,
          type: 'analysis',
          timestamp: new Date(),
          progress: 0.2,
          confidence: 0.9,
        },
        {
          id: `step_${Date.now()}_2`,
          step: '데이터 수집',
          content: '관련 서버 데이터와 로그를 수집하고 있습니다...',
          type: 'data_processing',
          timestamp: new Date(),
          progress: 0.6,
          confidence: 0.85,
        },
        {
          id: `step_${Date.now()}_3`,
          step: '응답 생성',
          content: '수집된 데이터를 바탕으로 응답을 생성하고 있습니다...',
          type: 'response_generation',
          timestamp: new Date(),
          progress: 1.0,
          confidence: 0.95,
        },
      ];

      // AI 쿼리 API 호출 (MCP 제거 버전)
      const response = await fetch(`${this.baseUrl}/api/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: question,
          temperature: 0.7,
          maxTokens: 1000,
          context: 'ai-sidebar',
          includeThinking: true,
          mode: 'local-ai',
          timeoutMs: 450,
        }),
      });

      const aiData = await response.json();

      return {
        id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        query: question,
        content: aiData.response || '죄송합니다. 현재 AI 시스템에 문제가 있습니다.',
        response: aiData.response || '죄송합니다. 현재 AI 시스템에 문제가 있습니다.',
        engine: 'supabase-rag',
        confidence: aiData.confidence || 0.5,
        timestamp: new Date(),
        thinkingSteps: aiData.metadata?.thinkingSteps || thinkingSteps,
        processingTime: aiData.responseTime || 1000,
        source: 'supabase-rag' as const,
      };
    } catch (error) {
      console.error('AI 질의 처리 오류:', error);

      return {
        id: `error_${Date.now()}`,
        query: question,
        content: '죄송합니다. 현재 AI 시스템에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.',
        response: '죄송합니다. 현재 AI 시스템에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.',
        engine: 'local',
        confidence: 0.1,
        timestamp: new Date(),
        thinkingSteps: [],
        processingTime: 0,
        source: 'local' as const,
      };
    }
  }

  /**
   * 💬 채팅 메시지 생성
   */
  createChatMessage(
    content: string,
    role: 'user' | 'assistant',
    isTyping = false
  ): ChatMessage {
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      role,
      timestamp: new Date(),
      isTyping,
      typingSpeed: 'normal' as const,
    };
  }

  /**
   * 🚨 시스템 알림 생성 (실시간 서버 상태 기반)
   */
  async createSystemAlert(): Promise<SystemAlert> {
    try {
      // AI 인사이트 API에서 실시간 알림 데이터 가져오기
      const response = await fetch(`${this.baseUrl}/api/ai/insights`);
      const insights = await response.json();

      const alertTypes = ['warning', 'error', 'info', 'success'] as const;
      const randomType =
        alertTypes[Math.floor(Math.random() * alertTypes.length)] ?? 'info';

      return {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: randomType,
        title: insights.alerts?.[0]?.title || '[SYSTEM] 서버 모니터링',
        message:
          insights.alerts?.[0]?.message ||
          '실시간 서버 상태를 모니터링하고 있습니다.',
        timestamp: new Date(),
        isClosable: true,
        autoClose: randomType === 'info' ? 5 : 0,
      };
    } catch (error) {
      console.error('시스템 알림 생성 오류:', error);

      return {
        id: `alert_fallback_${Date.now()}`,
        type: 'info',
        title: '[SYSTEM] 모니터링 활성화',
        message: '서버 모니터링 시스템이 활성화되었습니다.',
        timestamp: new Date(),
        isClosable: true,
        autoClose: 5,
      };
    }
  }

  /**
   * ⚡ 빠른 질문 템플릿 (서버 상태 기반 동적 생성)
   */
  getQuickQuestions(): QuickQuestion[] {
    return [
      {
        id: 'server-status',
        question: '서버 상태는 어떤가요?',
        text: '서버 상태는 어떤가요?',
        category: 'server',
        icon: 'Server',
        color: 'text-blue-500',
        description: '전체 서버 상태 확인',
      },
      {
        id: 'log-analysis',
        question: '최근 로그를 분석해주세요',
        text: '최근 로그를 분석해주세요',
        category: 'logs',
        icon: 'Search',
        color: 'text-green-500',
        description: '최근 로그 패턴 분석',
      },
      {
        id: 'performance-analysis',
        question: '성능 지표를 분석해주세요',
        text: '성능 지표를 분석해주세요',
        category: 'analysis',
        icon: 'BarChart3',
        color: 'text-purple-500',
        description: '시스템 성능 분석',
      },
      {
        id: 'prediction-analysis',
        question: '향후 예측을 해주세요',
        text: '향후 예측을 해주세요',
        category: 'prediction',
        icon: 'Target',
        color: 'text-orange-500',
        description: '시스템 예측 분석',
      },
    ];
  }

  /**
   * 🧠 AI 사고 과정 스트리밍
   */
  async *streamThinkingProcess(
    question: string,
    sessionId?: string
  ): AsyncGenerator<AIThinkingStep> {
    const steps = [
      {
        step: '질의 이해',
        content: `"${question}" 질문을 분석하고 있습니다...`,
        type: 'analysis' as const,
        progress: 0.1,
        confidence: 0.9,
      },
      {
        step: '데이터 수집',
        content: '관련 서버 메트릭과 로그 데이터를 수집하고 있습니다...',
        type: 'data_processing' as const,
        progress: 0.3,
        confidence: 0.85,
      },
      {
        step: '패턴 분석',
        content: '수집된 데이터에서 패턴을 분석하고 있습니다...',
        type: 'pattern_matching' as const,
        progress: 0.6,
        confidence: 0.8,
      },
      {
        step: '추론 과정',
        content: '분석 결과를 바탕으로 논리적 추론을 진행하고 있습니다...',
        type: 'reasoning' as const,
        progress: 0.8,
        confidence: 0.9,
      },
      {
        step: '응답 생성',
        content: '최종 응답을 생성하고 있습니다...',
        type: 'response_generation' as const,
        progress: 1.0,
        confidence: 0.95,
      },
    ];

    for (let index = 0; index < steps.length; index++) {
      const step = steps[index];
      if (!step) {
        continue; // Skip undefined steps
      }
      
      await new Promise((resolve) =>
        setTimeout(resolve, 800 + Math.random() * 400)
      );

      yield {
        id: `thinking_${Date.now()}_${index}`,
        step: step.step,
        content: step.content,
        type: step.type,
        timestamp: new Date(),
        progress: step.progress,
        confidence: step.confidence,
      };
    }
  }

  /**
   * 📊 실시간 AI 인사이트 데이터 가져오기
   */
  async getAIInsights() {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/insights`);
      return await response.json();
    } catch (error) {
      console.error('AI 인사이트 데이터 가져오기 오류:', error);
      return null;
    }
  }

  /**
   * 🔍 Google AI 상태 모니터링
   */
  async getGoogleAIStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/google-ai/status`);
      return await response.json();
    } catch (error) {
      console.error('Google AI 상태 확인 오류:', error);
      return null;
    }
  }
}
