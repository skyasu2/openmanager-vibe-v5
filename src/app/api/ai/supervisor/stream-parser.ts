/**
 * 🔧 Stream Transformer: Vercel Data Stream Protocol → Plain Text
 *
 * Cloud Run이 반환하는 Data Stream Protocol을 파싱하여 순수 텍스트로 변환
 *
 * @see https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol
 * @created 2026-01-10 (route.ts에서 분리)
 */

/**
 * Vercel AI SDK Data Stream Protocol 상수
 *
 * @warning 이 프로토콜은 Vercel AI SDK 버전에 의존합니다.
 *          SDK 업그레이드 시 호환성 확인 필요
 *
 * @see https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol
 */
export const DATA_STREAM_PREFIXES = {
  TEXT: '0', // 텍스트 콘텐츠 (주요)
  DATA: '2', // JSON 데이터 배열
  ERROR: '3', // 에러 메시지
  ANNOTATION: '8', // 메시지 주석
  FINISH: 'd', // 완료 신호
  START: 'e', // 시작 신호
} as const;

/**
 * Data Stream Protocol 라인 파싱 정규식
 *
 * @pattern ^(prefix):(content)$
 * - prefix: 숫자 또는 알파벳 한 글자
 * - content: JSON 문자열 또는 객체
 *
 * @fragility 이 정규식은 SDK 프로토콜 변경에 취약합니다.
 *            SDK 버전 업그레이드 시 반드시 테스트 필요
 */
export const DATA_STREAM_LINE_REGEX = /^([0-9a-z]):(.*)$/;

/**
 * JSON 문자열 안전하게 파싱
 */
function safeJsonParse(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/**
 * 텍스트 콘텐츠 추출 (prefix: 0)
 */
function extractTextContent(content: string): string | null {
  const parsed = safeJsonParse(content);
  if (typeof parsed === 'string') {
    return parsed;
  }
  // JSON 파싱 실패 시 raw content 반환 (fallback)
  if (content.startsWith('"') && content.endsWith('"')) {
    return content.slice(1, -1);
  }
  return null;
}

/**
 * 에러 메시지 추출 (prefix: 3)
 */
function extractErrorMessage(content: string): string {
  const parsed = safeJsonParse(content);

  if (typeof parsed === 'string') {
    // 중첩된 JSON 에러 처리
    const innerParsed = safeJsonParse(parsed);
    if (
      innerParsed &&
      typeof innerParsed === 'object' &&
      'error' in innerParsed
    ) {
      const errorObj = innerParsed as { error?: { message?: string } };
      return errorObj.error?.message || parsed;
    }
    return parsed;
  }

  if (parsed && typeof parsed === 'object' && 'message' in parsed) {
    return (parsed as { message: string }).message;
  }

  return content;
}

/**
 * Data Stream Protocol을 Plain Text로 변환하는 TransformStream
 *
 * @description
 * Cloud Run이 반환하는 `0:"텍스트"` 형식을 파싱하여 순수 텍스트만 추출합니다.
 * TextStreamChatTransport와 함께 사용됩니다.
 *
 * @example
 * Input:  0:"Hello "\n0:"World"\nd:{"finishReason":"stop"}
 * Output: Hello World
 *
 * @warning
 * - Vercel AI SDK v6 Data Stream Protocol에 의존
 * - Cloud Run 응답 형식 변경 시 파싱 실패 가능
 * - 장기적으로 SDK의 공식 파서 사용 권장
 */
// NOTE: Reserved for future streaming implementation
export function createDataStreamParserTransform(): TransformStream<
  Uint8Array,
  Uint8Array
> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  return new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 마지막 불완전한 라인은 버퍼에 유지

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const match = trimmed.match(DATA_STREAM_LINE_REGEX);
        if (!match?.[1] || match[2] === undefined) continue;

        const prefix = match[1];
        const content = match[2];

        switch (prefix) {
          case DATA_STREAM_PREFIXES.TEXT: {
            const text = extractTextContent(content);
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
            break;
          }

          case DATA_STREAM_PREFIXES.ERROR: {
            const errorMsg = extractErrorMessage(content);
            controller.enqueue(encoder.encode(`\n\n⚠️ AI 오류: ${errorMsg}`));
            break;
          }

          // DATA, ANNOTATION, FINISH, START: 메타데이터는 무시
          // 필요 시 여기에 추가 처리 로직 구현 가능
        }
      }
    },

    flush(controller) {
      // 버퍼에 남은 불완전한 라인 처리
      if (buffer.trim()) {
        const match = buffer.trim().match(DATA_STREAM_LINE_REGEX);
        if (match?.[1] === DATA_STREAM_PREFIXES.TEXT && match[2]) {
          const text = extractTextContent(match[2]);
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
      }
    },
  });
}
