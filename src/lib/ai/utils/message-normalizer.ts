/**
 * Message Normalizer
 *
 * @description AI SDK v5 UIMessage와 레거시 메시지 형식을 통합 처리
 *
 * @usage
 * - UI 컴포넌트: extractTextFromUIMessage(message)
 * - API 라우트: normalizeMessagesForCloudRun(messages)
 *
 * @created 2025-12-30
 * @see https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot-message-streaming
 */

import type { UIMessage } from '@ai-sdk/react';

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * Cloud Run용 정규화된 메시지
 */
export interface NormalizedMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * AI SDK v5 TextPart 타입
 */
interface TextPart {
  type: 'text';
  text: string;
}

/**
 * 하이브리드 메시지 타입 (parts + content 모두 지원)
 */
export interface HybridMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  parts?: Array<{ type: string; text?: string }>;
  content?: string;
  createdAt?: Date | string;
}

// ============================================================================
// 텍스트 추출 함수
// ============================================================================

/**
 * AI SDK v5 UIMessage에서 텍스트 콘텐츠 추출
 *
 * @description UI 컴포넌트용 (AISidebarV4, AIWorkspace)
 * @param message - UIMessage 객체
 * @returns 추출된 텍스트 (없으면 빈 문자열)
 *
 * @example
 * const text = extractTextFromUIMessage(message);
 * // message.parts: [{ type: 'text', text: 'Hello' }]
 * // returns: 'Hello'
 */
export function extractTextFromUIMessage(message: UIMessage): string {
  if (!message.parts || message.parts.length === 0) {
    return '';
  }

  return message.parts
    .filter((part): part is TextPart => part != null && part.type === 'text')
    .map((part) => part.text)
    .join('');
}

/**
 * 하이브리드 메시지에서 텍스트 콘텐츠 추출
 *
 * @description API 라우트용 (AI SDK v5 parts + 레거시 content 모두 지원)
 * @param message - HybridMessage 객체
 * @returns 추출된 텍스트 (없으면 빈 문자열)
 *
 * @example
 * // AI SDK v5 형식
 * extractTextFromHybridMessage({ parts: [{ type: 'text', text: 'Hello' }] })
 * // returns: 'Hello'
 *
 * // 레거시 형식
 * extractTextFromHybridMessage({ content: 'Hello' })
 * // returns: 'Hello'
 */
export function extractTextFromHybridMessage(message: HybridMessage): string {
  // 1. AI SDK v5 parts 배열에서 텍스트 추출
  if (message.parts && Array.isArray(message.parts)) {
    const textParts = message.parts
      .filter(
        (part): part is TextPart =>
          part != null && part.type === 'text' && typeof part.text === 'string'
      )
      .map((part) => part.text);

    if (textParts.length > 0) {
      return textParts.join('\n');
    }
  }

  // 2. 레거시 content 필드 사용
  if (typeof message.content === 'string') {
    return message.content;
  }

  return '';
}

// ============================================================================
// 메시지 정규화 함수
// ============================================================================

/**
 * 메시지 배열을 Cloud Run 호환 형식으로 정규화
 *
 * @description
 * AI SDK v5 UIMessage 형식을 Cloud Run이 기대하는 형식으로 변환
 *
 * Input (AI SDK v5):
 *   { role: 'user', parts: [{ type: 'text', text: '...' }] }
 *
 * Output (Cloud Run):
 *   { role: 'user', content: '...' }
 *
 * @note 빈 content는 '[Non-text content]'로 대체하여 대화 맥락 보존
 *
 * @param messages - HybridMessage 배열
 * @returns NormalizedMessage 배열
 */
export function normalizeMessagesForCloudRun(
  messages: HybridMessage[]
): NormalizedMessage[] {
  return messages.map((msg) => {
    const content = extractTextFromHybridMessage(msg);

    // 빈 content인 경우 플레이스홀더 사용 (맥락 보존)
    // 이미지, Tool Call 등 비텍스트 메시지의 위치를 유지
    if (!content || content.length === 0) {
      return {
        role: msg.role,
        content: '[Non-text content]',
      };
    }

    return {
      role: msg.role,
      content,
    };
  });
}

/**
 * 마지막 사용자 메시지에서 쿼리 텍스트 추출
 *
 * @description 복잡도 분석, 캐시 키 생성 등에 사용
 * @param messages - HybridMessage 배열
 * @returns 마지막 사용자 쿼리 (없으면 빈 문자열)
 *
 * @note 빈 텍스트를 가진 user 메시지는 건너뜁니다 (명확화 플로우에서 발생 가능)
 */
export function extractLastUserQuery(messages: HybridMessage[]): string {
  // 역순으로 순회하여 텍스트가 있는 마지막 사용자 메시지 찾기
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message && message.role === 'user') {
      const text = extractTextFromHybridMessage(message);
      // 빈 메시지는 건너뛰고 다음 사용자 메시지 확인
      if (text && text.trim().length > 0) {
        return text;
      }
    }
  }
  return '';
}
