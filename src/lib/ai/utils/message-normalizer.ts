/**
 * Message Normalizer
 *
 * @description AI SDK v6 UIMessage와 레거시 메시지 형식을 통합 처리
 * @updated 2026-01-27 - 멀티모달 지원 (이미지, 파일)
 *
 * @usage
 * - UI 컴포넌트: extractTextFromUIMessage(message)
 * - API 라우트: normalizeMessagesForCloudRun(messages)
 *
 * @created 2025-12-30
 * @see https://ai-sdk.dev/docs/ai-sdk-core/prompts#image-parts
 */

import type { UIMessage } from '@ai-sdk/react';

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * 이미지 첨부 파일 (Vision Agent용)
 * @see https://ai-sdk.dev/docs/ai-sdk-core/prompts#image-parts
 */
export interface ImageAttachment {
  /** 이미지 데이터: Base64, Data URL, 또는 HTTP(S) URL */
  data: string;
  /** MIME 타입 (예: 'image/png', 'image/jpeg') */
  mimeType: string;
  /** 표시용 파일명 (선택) */
  name?: string;
}

/**
 * 파일 첨부 (PDF, 오디오 등)
 * @see https://ai-sdk.dev/docs/ai-sdk-core/prompts#file-parts
 */
export interface FileAttachment {
  /** 파일 데이터: Base64 또는 HTTP(S) URL */
  data: string;
  /** MIME 타입 (예: 'application/pdf', 'audio/mpeg') */
  mimeType: string;
  /** 파일명 (선택) */
  name?: string;
}

/**
 * Cloud Run용 정규화된 메시지 (멀티모달 지원)
 */
export interface NormalizedMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  /** 이미지 첨부 (Vision Agent) */
  images?: ImageAttachment[];
  /** 파일 첨부 (PDF, 오디오 등) */
  files?: FileAttachment[];
}

/**
 * AI SDK v6 TextPart 타입
 */
interface TextPart {
  type: 'text';
  text: string;
}

/**
 * AI SDK v6 ImagePart 타입
 */
interface ImagePart {
  type: 'image';
  image: string;
  mimeType?: string;
}

/**
 * AI SDK v6 FilePart 타입
 */
interface FilePart {
  type: 'file';
  data: string;
  mimeType: string;
  name?: string;
}

/**
 * 하이브리드 메시지 타입 (parts + content 모두 지원, 멀티모달 포함)
 */
export interface HybridMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  parts?: Array<{
    type: string;
    text?: string;
    image?: string;
    data?: string;
    mimeType?: string;
    name?: string;
  }>;
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
// 멀티모달 추출 함수
// ============================================================================

/**
 * 하이브리드 메시지에서 이미지 첨부 추출
 *
 * @param message - HybridMessage 객체
 * @returns ImageAttachment 배열
 */
export function extractImagesFromHybridMessage(
  message: HybridMessage
): ImageAttachment[] {
  if (!message.parts || !Array.isArray(message.parts)) {
    return [];
  }

  return message.parts
    .filter(
      (part): part is ImagePart =>
        part != null && part.type === 'image' && typeof part.image === 'string'
    )
    .map((part) => ({
      data: part.image,
      mimeType: part.mimeType || 'image/png',
    }));
}

/**
 * 하이브리드 메시지에서 파일 첨부 추출
 *
 * @param message - HybridMessage 객체
 * @returns FileAttachment 배열
 */
export function extractFilesFromHybridMessage(
  message: HybridMessage
): FileAttachment[] {
  if (!message.parts || !Array.isArray(message.parts)) {
    return [];
  }

  return message.parts
    .filter(
      (part): part is FilePart =>
        part != null &&
        part.type === 'file' &&
        typeof part.data === 'string' &&
        typeof part.mimeType === 'string'
    )
    .map((part) => ({
      data: part.data,
      mimeType: part.mimeType,
      name: part.name,
    }));
}

// ============================================================================
// 메시지 정규화 함수
// ============================================================================

/**
 * 메시지 배열을 Cloud Run 호환 형식으로 정규화 (멀티모달 지원)
 *
 * @description
 * AI SDK v6 UIMessage 형식을 Cloud Run이 기대하는 형식으로 변환
 * 이미지와 파일 첨부를 보존하여 Vision Agent에서 사용 가능
 *
 * Input (AI SDK v6):
 *   { role: 'user', parts: [
 *     { type: 'text', text: '...' },
 *     { type: 'image', image: 'base64...' }
 *   ]}
 *
 * Output (Cloud Run):
 *   { role: 'user', content: '...', images: [{ data: 'base64...', mimeType: 'image/png' }] }
 *
 * @note 빈 content는 '[Non-text content]'로 대체하여 대화 맥락 보존
 *
 * @param messages - HybridMessage 배열
 * @returns NormalizedMessage 배열 (멀티모달 포함)
 */
export function normalizeMessagesForCloudRun(
  messages: HybridMessage[]
): NormalizedMessage[] {
  return messages.map((msg) => {
    const content = extractTextFromHybridMessage(msg);
    const images = extractImagesFromHybridMessage(msg);
    const files = extractFilesFromHybridMessage(msg);

    // 기본 메시지 구성
    const normalizedMessage: NormalizedMessage = {
      role: msg.role,
      content: content || '[Non-text content]',
    };

    // 이미지가 있으면 추가
    if (images.length > 0) {
      normalizedMessage.images = images;
    }

    // 파일이 있으면 추가
    if (files.length > 0) {
      normalizedMessage.files = files;
    }

    return normalizedMessage;
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
