/**
 * 🤖 OpenManager VIBE v5 AI 모니터링 전용 스토리 템플릿
 * AI 엔진 상태, 실시간 처리, 멀티 AI 시스템 표시에 최적화
 */

import React from 'react';
import type { Decorator } from '@storybook/react';

// 🧠 AI 엔진 상태 목업
export const AI_ENGINE_STATES = {
  MCP: {
    name: 'MCP 엔진',
    status: 'active' as const,
    confidence: 92,
    responseTime: 1200,
    lastUpdate: new Date(),
    features: ['의미 검색', '컨텍스트 관리', '실시간 처리'],
  },
  RAG: {
    name: 'RAG 검색',
    status: 'processing' as const,
    confidence: 88,
    responseTime: 800,
    lastUpdate: new Date(),
    features: ['벡터 검색', '문서 임베딩', '지식 베이스'],
  },
  GOOGLE_AI: {
    name: 'Google AI',
    status: 'idle' as const,
    confidence: 95,
    responseTime: 1500,
    lastUpdate: new Date(),
    features: ['Gemini Pro', '대용량 컨텍스트', '다국어 지원'],
  },
  UNIFIED: {
    name: '통합 AI 라우터',
    status: 'active' as const,
    confidence: 90,
    responseTime: 1000,
    lastUpdate: new Date(),
    features: ['자동 폴백', '로드 밸런싱', '에러 처리'],
  },
};

// 📊 실시간 메트릭 생성기
export const generateAIMetrics = () => ({
  timestamp: new Date(),
  engines: {
    mcp: {
      qps: Math.floor(Math.random() * 100) + 50,
      latency: Math.floor(Math.random() * 200) + 100,
      errorRate: Math.random() * 2,
    },
    rag: {
      qps: Math.floor(Math.random() * 80) + 30,
      latency: Math.floor(Math.random() * 150) + 80,
      errorRate: Math.random() * 1.5,
    },
    googleAi: {
      qps: Math.floor(Math.random() * 60) + 20,
      latency: Math.floor(Math.random() * 300) + 150,
      errorRate: Math.random() * 1,
    },
  },
  totalRequests: Math.floor(Math.random() * 10000) + 5000,
  successRate: 95 + Math.random() * 4,
});

// 🎨 AI 테마 컨텍스트
export const AIThemeContext = React.createContext({
  primaryColor: '#8B5CF6', // 보라색 (AI 테마 색상)
  successColor: '#10B981',
  warningColor: '#F59E0B',
  errorColor: '#EF4444',
  mode: 'light',
});

// 🎭 AI 모니터링 데코레이터
export const withAIMonitoring: Decorator = (Story, context) => {
  const [metrics, setMetrics] = React.useState(generateAIMetrics());

  // 실시간 메트릭 업데이트 시뮬레이션
  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(generateAIMetrics());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AIThemeContext.Provider
      value={{
        primaryColor: '#8B5CF6',
        successColor: '#10B981',
        warningColor: '#F59E0B',
        errorColor: '#EF4444',
        mode: context.globals.theme || 'light',
      }}
    >
      <div className="ai-monitoring-wrapper">
        <Story {...context} aiMetrics={metrics} />
      </div>
    </AIThemeContext.Provider>
  );
};

// 🚀 AI 응답 시뮬레이터
export class AIResponseSimulator {
  private responses = [
    '서버 상태를 분석하고 있습니다...',
    'CPU 사용률이 평소보다 15% 높습니다.',
    '메모리 최적화를 권장합니다.',
    '네트워크 트래픽이 정상 범위 내에 있습니다.',
    '3개의 서버에서 경고가 감지되었습니다.',
  ];

  async simulateThinking(duration: number = 2000): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const response = this.responses[Math.floor(Math.random() * this.responses.length)];
        resolve(response);
      }, duration);
    });
  }

  streamResponse(text: string, onChunk: (chunk: string) => void): void {
    const words = text.split(' ');
    let index = 0;

    const streamInterval = setInterval(() => {
      if (index < words.length) {
        onChunk(words[index] + ' ');
        index++;
      } else {
        clearInterval(streamInterval);
      }
    }, 100);
  }
}

// 📈 성능 지표 타입
export interface AIPerformanceMetrics {
  responseTime: number;
  confidence: number;
  tokensUsed: number;
  cacheHitRate: number;
  errorRate: number;
}

// 🎯 AI 엔진 선택기
export const selectBestEngine = (
  query: string,
  engines: typeof AI_ENGINE_STATES
): keyof typeof AI_ENGINE_STATES => {
  // 쿼리 복잡도에 따른 엔진 선택 로직
  const complexity = query.length;
  
  if (complexity < 50) return 'MCP';
  if (complexity < 150) return 'RAG';
  if (complexity < 300) return 'GOOGLE_AI';
  return 'UNIFIED';
};

// 🔄 실시간 상태 업데이트 훅
export const useAIEngineStatus = (engineName: string) => {
  const [status, setStatus] = React.useState('idle');
  const [thinking, setThinking] = React.useState(false);

  const processQuery = React.useCallback(async (query: string) => {
    setThinking(true);
    setStatus('processing');

    const simulator = new AIResponseSimulator();
    const response = await simulator.simulateThinking();

    setThinking(false);
    setStatus('complete');

    return response;
  }, []);

  return { status, thinking, processQuery };
};

// 💡 스토리 헬퍼 함수들
export const aiStoryHelpers = {
  // AI 엔진 상태별 색상
  getEngineStatusColor: (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'processing': return '#F59E0B';
      case 'idle': return '#6B7280';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  },

  // 신뢰도 레벨 계산
  getConfidenceLevel: (confidence: number) => {
    if (confidence >= 90) return { level: '높음', color: '#10B981' };
    if (confidence >= 70) return { level: '보통', color: '#F59E0B' };
    return { level: '낮음', color: '#EF4444' };
  },

  // 응답 시간 평가
  evaluateResponseTime: (ms: number) => {
    if (ms < 500) return { rating: '매우 빠름', color: '#10B981' };
    if (ms < 1000) return { rating: '빠름', color: '#3B82F6' };
    if (ms < 2000) return { rating: '보통', color: '#F59E0B' };
    return { rating: '느림', color: '#EF4444' };
  },
};

// 🌐 다국어 AI 응답 목업
export const AI_RESPONSES = {
  ko: {
    greeting: '안녕하세요! AI 어시스턴트입니다.',
    analyzing: '데이터를 분석하고 있습니다...',
    complete: '분석이 완료되었습니다.',
    error: '오류가 발생했습니다. 다시 시도해주세요.',
  },
  en: {
    greeting: 'Hello! I am your AI assistant.',
    analyzing: 'Analyzing data...',
    complete: 'Analysis complete.',
    error: 'An error occurred. Please try again.',
  },
};

export default {
  AI_ENGINE_STATES,
  generateAIMetrics,
  withAIMonitoring,
  AIResponseSimulator,
  useAIEngineStatus,
  aiStoryHelpers,
  AI_RESPONSES,
};