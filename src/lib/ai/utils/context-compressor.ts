/**
 * 🗜️ Context Compressor
 *
 * AI 대화 컨텍스트를 압축하여 토큰 사용량 절감
 * 최근 메시지는 유지하고 이전 메시지는 요약/삭제
 *
 * @created 2026-01-08 v5.85.0
 */

export interface CompressibleMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CompressionResult {
  messages: CompressibleMessage[];
  originalCount: number;
  compressedCount: number;
  estimatedTokensSaved: number;
  compressionRatio: number;
}

export interface CompressionOptions {
  /** 유지할 최근 메시지 수 (기본값: 3) */
  keepRecentCount?: number;
  /** 최대 총 메시지 수 (기본값: 6) */
  maxTotalMessages?: number;
  /** 메시지당 최대 문자 수 (기본값: 1000) */
  maxCharsPerMessage?: number;
  /** 시스템 메시지 유지 여부 (기본값: true) */
  keepSystemMessages?: boolean;
  /** 요약 활성화 (기본값: false - 단순 truncate) */
  enableSummarization?: boolean;
}

/**
 * 토큰 수 추정 (간단한 휴리스틱)
 * 한국어: ~1.5자/토큰, 영어: ~4자/토큰
 */
function estimateTokens(text: string): number {
  const koreanChars = (text.match(/[\uAC00-\uD7AF]/g) || []).length;
  const otherChars = text.length - koreanChars;
  return Math.ceil(koreanChars / 1.5 + otherChars / 4);
}

/**
 * 메시지 요약 (간단한 truncate 버전)
 *
 * 현재: 문장 단위 truncation
 * 향후 개선: LLM 기반 요약 (Cloud Run AI Engine 활용)
 */
function summarizeMessage(message: string, maxChars: number): string {
  if (message.length <= maxChars) return message;

  // 문장 단위로 분리하여 앞부분 유지
  const sentences = message.split(/(?<=[.!?。])\s*/);
  let result = '';

  for (const sentence of sentences) {
    if (result.length + sentence.length > maxChars - 10) break;
    result += `${sentence} `;
  }

  // 최소 컨텐츠 보장
  if (result.length < 50) {
    result = message.slice(0, maxChars - 3);
  }

  return `${result.trim()}...`;
}

/**
 * 메시지에서 핵심 정보 추출
 */
function extractKeyInfo(messages: CompressibleMessage[]): string[] {
  const keywords: string[] = [];

  // 서버 ID 패턴 추출
  const serverPattern = /server[-_]?\d+|srv[-_]?\d+|[가-힣]+서버/gi;
  // 메트릭 키워드
  const metricKeywords = [
    'cpu',
    'memory',
    'disk',
    'network',
    'error',
    'warning',
    '에러',
    '경고',
    '메모리',
    '디스크',
  ];

  for (const msg of messages) {
    const content = msg.content.toLowerCase();

    // 서버 ID 추출
    const servers = msg.content.match(serverPattern);
    if (servers) keywords.push(...servers);

    // 메트릭 키워드 추출
    for (const metric of metricKeywords) {
      if (content.includes(metric)) {
        keywords.push(metric);
      }
    }
  }

  // 중복 제거
  return [...new Set(keywords)];
}

/**
 * 대화 컨텍스트 압축
 *
 * @param messages - 전체 메시지 배열
 * @param options - 압축 옵션
 * @returns 압축된 메시지 및 통계
 *
 * @example
 * const { messages, estimatedTokensSaved } = compressContext(allMessages, {
 *   keepRecentCount: 3,
 *   maxTotalMessages: 6,
 * });
 */
export function compressContext(
  messages: CompressibleMessage[],
  options: CompressionOptions = {}
): CompressionResult {
  const {
    keepRecentCount = 3,
    maxTotalMessages = 6,
    maxCharsPerMessage = 1000,
    keepSystemMessages = true,
    enableSummarization = false,
  } = options;

  const originalCount = messages.length;
  const originalTokens = messages.reduce(
    (sum, m) => sum + estimateTokens(m.content),
    0
  );

  // 1. 시스템 메시지 분리
  const systemMessages = keepSystemMessages
    ? messages.filter((m) => m.role === 'system')
    : [];
  const conversationMessages = messages.filter((m) => m.role !== 'system');

  // 2. 최근 N개 메시지 유지
  const recentMessages = conversationMessages.slice(-keepRecentCount);

  // 3. 이전 메시지 처리
  const olderMessages = conversationMessages.slice(0, -keepRecentCount);
  let processedOlderMessages: CompressibleMessage[] = [];

  if (olderMessages.length > 0 && enableSummarization) {
    // 요약 모드: 핵심 정보 추출 및 요약
    const keyInfo = extractKeyInfo(olderMessages);
    const summaryContent =
      keyInfo.length > 0
        ? `[이전 대화 요약] 주제: ${keyInfo.slice(0, 5).join(', ')}`
        : '[이전 대화 생략]';

    processedOlderMessages = [
      {
        role: 'system' as const,
        content: summaryContent,
      },
    ];
  } else if (olderMessages.length > 0) {
    // 단순 truncate 모드: 오래된 메시지 삭제
    // 최대 총 메시지 수에 맞게 조정
    const availableSlots =
      maxTotalMessages - systemMessages.length - recentMessages.length;
    if (availableSlots > 0) {
      processedOlderMessages = olderMessages
        .slice(-availableSlots)
        .map((m) => ({
          ...m,
          content: summarizeMessage(m.content, maxCharsPerMessage),
        }));
    }
  }

  // 4. 최종 메시지 조합
  const compressedMessages = [
    ...systemMessages,
    ...processedOlderMessages,
    ...recentMessages,
  ];

  // 5. 통계 계산
  const compressedTokens = compressedMessages.reduce(
    (sum, m) => sum + estimateTokens(m.content),
    0
  );

  return {
    messages: compressedMessages,
    originalCount,
    compressedCount: compressedMessages.length,
    estimatedTokensSaved: Math.max(0, originalTokens - compressedTokens),
    compressionRatio:
      originalTokens > 0
        ? Math.round((1 - compressedTokens / originalTokens) * 100)
        : 0,
  };
}

/**
 * 압축이 필요한지 확인
 *
 * @param messageCount - 현재 메시지 수
 * @param threshold - 압축 시작 임계값 (기본값: 4)
 */
export function shouldCompress(messageCount: number, threshold = 4): boolean {
  return messageCount > threshold;
}

export default compressContext;
