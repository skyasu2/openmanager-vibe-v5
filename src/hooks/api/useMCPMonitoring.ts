/**
 * 🤖 MCP 기반 서버 모니터링 에이전트 훅
 * 
 * 기능:
 * - 질의응답 with 생각과정 애니메이션
 * - 스트리밍 타이핑 효과
 * - 자동 장애보고서 생성
 * - 실시간 인사이트
 */

import { useState, useRef, useCallback } from 'react';
import type { 
  QueryRequest, 
  QueryResponse, 
  ThinkingStep, 
  MonitoringInsight,
  IncidentReport 
} from '@/core/mcp/ServerMonitoringAgent';

interface StreamEvent {
  type: 'thinking-start' | 'thinking-step' | 'answer-start' | 'answer-chunk' | 'complete' | 'error';
  data: any;
}

interface UseMCPMonitoringOptions {
  enableStreaming?: boolean;
  autoAnalyze?: boolean;
  typingSpeed?: number; // ms per word
}

export function useMCPMonitoring(options: UseMCPMonitoringOptions = {}) {
  const {
    enableStreaming = true,
    autoAnalyze = false,
    typingSpeed = 80
  } = options;

  // 상태 관리
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 생각과정 애니메이션
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [currentStep, setCurrentStep] = useState<ThinkingStep | null>(null);
  
  // 타이핑 애니메이션
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingProgress, setTypingProgress] = useState(0);
  
  // 인사이트 및 보고서
  const [insights, setInsights] = useState<MonitoringInsight[]>([]);
  const [incidentReport, setIncidentReport] = useState<IncidentReport | null>(null);
  
  // 연결 상태
  const [isConnected, setIsConnected] = useState(false);
  const [agentStatus, setAgentStatus] = useState<any>(null);
  
  // Refs
  const streamRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 🧠 질의응답 처리 (일반 모드)
   */
  const askQuestion = useCallback(async (
    query: string, 
    context?: QueryRequest['context']
  ): Promise<QueryResponse | null> => {
    if (isProcessing) return null;
    
    setIsProcessing(true);
    setError(null);
    setCurrentQuery(query);
    setResponse(null);
    setThinkingSteps([]);
    setTypedAnswer('');

    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const requestBody = {
        action: 'query',
        query,
        context,
        stream: false
      };

      const response = await fetch('/api/mcp/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const queryResponse = result.data as QueryResponse;
        setResponse(queryResponse);
        setThinkingSteps(queryResponse.thinkingSteps);
        setInsights(queryResponse.insights);
        setTypedAnswer(queryResponse.answer);
        return queryResponse;
      } else {
        throw new Error(result.error || '질의응답 처리 실패');
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setError(error.message || '질의응답 처리 실패');
        console.error('❌ 질의응답 오류:', error);
      }
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  /**
   * 🎭 스트리밍 질의응답 (생각과정 + 타이핑 애니메이션)
   */
  const askQuestionStreaming = useCallback(async (
    query: string,
    context?: QueryRequest['context']
  ): Promise<void> => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setError(null);
    setCurrentQuery(query);
    setResponse(null);
    setThinkingSteps([]);
    setCurrentStep(null);
    setTypedAnswer('');
    setIsTyping(false);
    setTypingProgress(0);

    try {
      // 기존 스트림 종료
      if (streamRef.current) {
        streamRef.current.close();
      }

      const requestBody = {
        action: 'query',
        query,
        context,
        stream: true
      };

      const response = await fetch('/api/mcp/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Server-Sent Events 처리
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('스트림 리더를 생성할 수 없습니다');
      }

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
              const eventData = JSON.parse(line.slice(6)) as StreamEvent;
              await handleStreamEvent(eventData);
            } catch (parseError) {
              console.warn('스트림 이벤트 파싱 오류:', parseError);
            }
          }
        }
      }

    } catch (error: any) {
      setError(error.message || '스트리밍 질의응답 실패');
      console.error('❌ 스트리밍 오류:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  /**
   * 📡 스트림 이벤트 처리
   */
  const handleStreamEvent = useCallback(async (event: StreamEvent) => {
    switch (event.type) {
      case 'thinking-start':
        setCurrentStep({
          id: 'start',
          step: 0,
          title: '분석 시작',
          description: event.data.message,
          status: 'thinking',
          timestamp: new Date()
        });
        break;

      case 'thinking-step':
        const step = event.data as ThinkingStep;
        setCurrentStep(step);
        setThinkingSteps(prev => {
          const updated = [...prev];
          const existingIndex = updated.findIndex(s => s.id === step.id);
          if (existingIndex >= 0) {
            updated[existingIndex] = step;
          } else {
            updated.push(step);
          }
          return updated;
        });
        break;

      case 'answer-start':
        setIsTyping(true);
        setTypedAnswer('');
        setTypingProgress(0);
        break;

      case 'answer-chunk':
        const { chunk, currentAnswer, progress } = event.data;
        setTypedAnswer(currentAnswer);
        setTypingProgress(progress);
        break;

      case 'complete':
        const finalResponse = event.data as QueryResponse;
        setResponse(finalResponse);
        setInsights(finalResponse.insights);
        setIsTyping(false);
        setTypingProgress(1);
        setCurrentStep(null);
        break;

      case 'error':
        setError(event.data.error);
        setIsTyping(false);
        setCurrentStep(null);
        break;

      default:
        console.warn('알 수 없는 스트림 이벤트 타입:', event.type);
    }
  }, []);

  /**
   * 📊 자동 장애보고서 생성
   */
  const generateIncidentReport = useCallback(async (serverId: string): Promise<IncidentReport | null> => {
    try {
      const response = await fetch(`/api/mcp/monitoring?action=incident-report&serverId=${serverId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const report = result.data as IncidentReport;
        setIncidentReport(report);
        return report;
      } else {
        throw new Error(result.error || '장애보고서 생성 실패');
      }

    } catch (error: any) {
      setError(error.message || '장애보고서 생성 실패');
      console.error('❌ 장애보고서 생성 오류:', error);
      return null;
    }
  }, []);

  /**
   * 🔍 특정 서버 분석
   */
  const analyzeServer = useCallback(async (serverId: string): Promise<QueryResponse | null> => {
    try {
      const requestBody = {
        action: 'analyze-server',
        serverId
      };

      const response = await fetch('/api/mcp/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const queryResponse = result.data as QueryResponse;
        setResponse(queryResponse);
        setInsights(queryResponse.insights);
        return queryResponse;
      } else {
        throw new Error(result.error || '서버 분석 실패');
      }

    } catch (error: any) {
      setError(error.message || '서버 분석 실패');
      console.error('❌ 서버 분석 오류:', error);
      return null;
    }
  }, []);

  /**
   * 🏥 에이전트 상태 확인
   */
  const checkAgentHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/mcp/monitoring?action=health');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setAgentStatus(result.data);
        setIsConnected(result.data.status === 'healthy');
        return result.data;
      } else {
        throw new Error(result.error || '상태 확인 실패');
      }

    } catch (error: any) {
      setIsConnected(false);
      setError(error.message || '에이전트 연결 실패');
      console.error('❌ 에이전트 상태 확인 오류:', error);
      return null;
    }
  }, []);

  /**
   * 🧹 상태 초기화
   */
  const resetState = useCallback(() => {
    setResponse(null);
    setError(null);
    setThinkingSteps([]);
    setCurrentStep(null);
    setTypedAnswer('');
    setIsTyping(false);
    setTypingProgress(0);
    setInsights([]);
    setIncidentReport(null);
    setCurrentQuery('');
    
    if (streamRef.current) {
      streamRef.current.close();
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * ⏹️ 처리 중단
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (streamRef.current) {
      streamRef.current.close();
    }
    setIsProcessing(false);
    setIsTyping(false);
  }, []);

  // 유틸리티 함수들
  const getThinkingProgress = useCallback(() => {
    if (thinkingSteps.length === 0) return 0;
    const completedSteps = thinkingSteps.filter(step => step.status === 'completed').length;
    return completedSteps / thinkingSteps.length;
  }, [thinkingSteps]);

  const getCurrentThinkingMessage = useCallback(() => {
    return currentStep?.description || '분석 중...';
  }, [currentStep]);

  const getInsightsByType = useCallback((type: MonitoringInsight['type']) => {
    return insights.filter(insight => insight.type === type);
  }, [insights]);

  return {
    // 상태
    isProcessing,
    isTyping,
    isConnected,
    error,

    // 데이터
    currentQuery,
    response,
    thinkingSteps,
    currentStep,
    typedAnswer,
    typingProgress,
    insights,
    incidentReport,
    agentStatus,

    // 액션
    askQuestion,
    askQuestionStreaming,
    generateIncidentReport,
    analyzeServer,
    checkAgentHealth,
    resetState,
    cancel,

    // 유틸리티
    getThinkingProgress,
    getCurrentThinkingMessage,
    getInsightsByType,

    // 편의 속성
    hasResponse: !!response,
    hasInsights: insights.length > 0,
    hasIncidentReport: !!incidentReport,
    isReady: isConnected && !isProcessing,
    canAsk: !isProcessing && isConnected
  };
} 