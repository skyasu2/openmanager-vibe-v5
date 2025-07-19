/**
 * 🤖 통합 AI 질의 훅
 * SimplifiedQueryEngine을 사용하는 새로운 AI 시스템
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

// 질의 요청 타입
export interface AIQueryRequest {
  query: string;
  mode?: 'local' | 'google-ai';
  includeContext?: boolean;
  options?: {
    includeMCPContext?: boolean;
    useCache?: boolean;
    maxResponseTime?: number;
  };
}

// 생각 단계 타입
export interface ThinkingStep {
  step: string;
  description?: string;
  status: 'thinking' | 'processing' | 'completed' | 'error';
  duration?: number;
  timestamp?: Date;
}

// 응답 타입
export interface AIQueryResponse {
  success: boolean;
  response: string;
  confidence: number;
  engine?: string;
  thinkingSteps: ThinkingStep[];
  metadata?: {
    processingTime?: number;
    cacheHit?: boolean;
    mcpUsed?: boolean;
    fallbackUsed?: boolean;
    totalTime?: number;
  };
  error?: string;
  message?: string;
}

// API 호출 함수
const sendAIQuery = async (request: AIQueryRequest): Promise<AIQueryResponse> => {
  const response = await fetch('/api/ai/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '질의 처리 실패');
  }

  return data;
};

// 메인 훅
export const useAIQuery = () => {
  const queryClient = useQueryClient();
  const [isThinking, setIsThinking] = useState(false);
  const [currentSteps, setCurrentSteps] = useState<ThinkingStep[]>([]);

  const mutation = useMutation({
    mutationFn: sendAIQuery,
    onMutate: () => {
      setIsThinking(true);
      setCurrentSteps([]);
    },
    onSuccess: (data) => {
      setIsThinking(false);
      setCurrentSteps(data.thinkingSteps || []);
      // 히스토리 갱신
      queryClient.invalidateQueries({ queryKey: ['ai-history'] });
    },
    onError: (error) => {
      setIsThinking(false);
      console.error('AI 질의 오류:', error);
    },
  });

  return {
    ...mutation,
    isThinking,
    currentSteps,
    sendQuery: mutation.mutate,
    sendQueryAsync: mutation.mutateAsync,
  };
};

// 스트리밍 응답을 위한 훅 (향후 구현)
export const useAIQueryStream = () => {
  const [response, setResponse] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [steps, setSteps] = useState<ThinkingStep[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startStream = async (request: AIQueryRequest) => {
    setIsStreaming(true);
    setResponse('');
    setSteps([]);
    setError(null);

    try {
      const res = await fetch('/api/ai/query/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        throw new Error('스트리밍 시작 실패');
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('스트림 리더 생성 실패');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'step') {
                setSteps(prev => [...prev, data.step]);
              } else if (data.type === 'response') {
                setResponse(prev => prev + data.content);
              } else if (data.type === 'complete') {
                setIsStreaming(false);
              }
            } catch (e) {
              console.error('스트림 파싱 오류:', e);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      setIsStreaming(false);
    }
  };

  return {
    response,
    isStreaming,
    steps,
    error,
    startStream,
  };
};

// 신뢰도별 색상 헬퍼
export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.9) return 'text-green-600 bg-green-50';
  if (confidence >= 0.8) return 'text-blue-600 bg-blue-50';
  if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
};

// 단계 상태별 아이콘 헬퍼
export const getStepIcon = (status: ThinkingStep['status']): string => {
  switch (status) {
    case 'thinking':
      return '🤔';
    case 'processing':
      return '⚙️';
    case 'completed':
      return '✅';
    case 'error':
      return '❌';
    default:
      return '💭';
  }
};

// 응답 시간 포맷팅
export const formatResponseTime = (ms?: number): string => {
  if (!ms) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}초`;
};