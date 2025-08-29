/**
 * AI 쿼리 처리 핸들러 유틸리티
 * AI 쿼리 처리 및 자동 보고서 생성 로직
 */

import type { AIMode } from '@/types/ai-types';
import type { ChatMessage } from '@/stores/useAISidebarStore';

export interface AIQueryResult {
  success: boolean;
  content: string;
  confidence: number;
  engine: string;
  processingTime: number;
  metadata?: any;
}

export interface AutoReportTrigger {
  shouldGenerate: boolean;
  lastQuery?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * 실제 AI 쿼리 처리
 */
export async function processRealAIQuery(
  query: string,
  engine: AIMode = 'LOCAL',
  sessionId: string,
  onThinkingStart: () => void,
  onThinkingStop: (
    query: string,
    engine: string,
    processingTime: number
  ) => void
): Promise<AIQueryResult> {
  const startTime = Date.now();
  onThinkingStart(); // 생각중 시작

  try {
    console.log(`🤖 실제 AI 쿼리 처리 시작: ${query} (엔진: ${engine})`);

    // 엔진별 API 엔드포인트 선택
    const apiEndpoint =
      engine === 'GOOGLE_ONLY'
        ? '/api/ai/google-ai/generate'
        : engine === 'LOCAL'
          ? '/api/ai/query'
          : '/api/ai/edge-v2';

    // API 엔드포인트 호출
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AI-Mode': engine.toLowerCase(),
      },
      body: JSON.stringify({
        query,
        context: 'ai-sidebar',
        includeThinking: true,
        sessionId,
        mode: engine.toLowerCase(),
        prompt: query, // Google AI용
      }),
    });

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.response) {
      const processingTime = Date.now() - startTime;

      // 성공 시 생각 과정을 저장하고 실시간 표시 중단
      setTimeout(
        () => onThinkingStop(query, data.engine || engine, processingTime),
        500
      );

      return {
        success: true,
        content: data.response,
        confidence: data.confidence || 0.8,
        engine: data.engine || engine,
        processingTime,
        metadata: data.metadata,
      };
    } else {
      onThinkingStop('', engine, 0);
      throw new Error(data.error || 'AI 응답 생성 실패');
    }
  } catch (error) {
    console.error('❌ 실제 AI 쿼리 실패:', error);
    onThinkingStop('', engine, 0);

    return {
      success: false,
      content: `죄송합니다. AI 응답 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      confidence: 0,
      engine: 'error',
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * 자동 장애 보고서 생성
 */
export async function generateAutoReport(
  trigger: AutoReportTrigger,
  sessionId: string
): Promise<ChatMessage | null> {
  if (!trigger.shouldGenerate) return null;

  try {
    console.log('🤖 자동장애보고서 생성 중...');

    // 자동장애보고서 API 호출
    const response = await fetch('/api/ai/auto-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: trigger.lastQuery,
        severity: trigger.severity,
        sessionId,
      }),
    });

    if (response.ok) {
      const reportData = await response.json();
      console.log('✅ 자동장애보고서 생성 완료:', reportData);

      // 보고서를 AI 메시지로 반환
      const reportMessage: ChatMessage = {
        id: `auto-report-${Date.now()}`,
        role: 'assistant',
        content: `📊 **자동 장애 분석 보고서**\n\n${reportData.report}`,
        timestamp: new Date(),
      };

      return reportMessage;
    }

    throw new Error('API 요청 실패');
  } catch (error) {
    console.error('❌ 자동장애보고서 생성 실패:', error);
    return null;
  }
}

/**
 * 프리셋 질문 처리
 */
export async function handlePresetQuestion(
  question: string,
  processQuery: (query: string) => Promise<void>
): Promise<void> {
  console.log('📌 프리셋 질문 선택:', question);
  await processQuery(question);
}

/**
 * 자동 보고서 트리거 감지
 */
export function detectAutoReportTrigger(
  query: string
): AutoReportTrigger | null {
  const lowerQuery = query.toLowerCase();

  // 장애 관련 키워드 검사
  const criticalKeywords = [
    '장애',
    '다운',
    '정지',
    'error',
    'failure',
    'crash',
  ];
  const highKeywords = ['느림', '지연', 'slow', 'timeout', 'delay'];
  const mediumKeywords = ['경고', 'warning', '주의', 'alert'];

  if (criticalKeywords.some((k) => lowerQuery.includes(k))) {
    return {
      shouldGenerate: true,
      lastQuery: query,
      severity: 'critical',
    };
  }

  if (highKeywords.some((k) => lowerQuery.includes(k))) {
    return {
      shouldGenerate: true,
      lastQuery: query,
      severity: 'high',
    };
  }

  if (mediumKeywords.some((k) => lowerQuery.includes(k))) {
    return {
      shouldGenerate: true,
      lastQuery: query,
      severity: 'medium',
    };
  }

  return null;
}

/**
 * Legacy test API - 테스트 호환성을 위한 wrapper
 */
export async function handleAIQuery({
  query,
  engine,
  context
}: {
  query: string;
  engine: AIMode;
  context: any[];
}): Promise<any> {
  const result = await processRealAIQuery(
    query, 
    engine, 
    'test-session',
    () => {},
    () => {}
  );
  
  return result.success ? {
    response: result.content,
    metadata: result.metadata
  } : {
    error: result.content
  };
}

/**
 * Query validation utility
 */
export function validateQuery(query: string): boolean {
  if (!query || query.trim().length === 0) {
    return false;
  }
  
  if (query.length > 5000) {
    return false;
  }
  
  return true;
}

/**
 * Error message formatting utility
 */
export function formatErrorMessage(error: any): string {
  if (error?.message?.includes('fetch')) {
    return '네트워크 연결에 문제가 있습니다. 다시 시도해주세요.';
  }
  
  if (error?.status === 429) {
    return 'API 한도에 도달했습니다. 잠시 후 다시 시도해주세요.';
  }
  
  if (error?.name === 'TimeoutError') {
    return '요청 시간 초과가 발생했습니다. 다시 시도해주세요.';
  }
  
  const message = error?.message || error?.toString() || '알 수 없는 오류';
  return `처리 중 오류가 발생했습니다: ${message}`;
}
