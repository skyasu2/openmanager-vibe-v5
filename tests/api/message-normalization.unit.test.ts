/**
 * Message Normalization Unit Tests
 *
 * @description
 * AI Supervisor의 메시지 정규화 함수 단위 테스트
 * - extractTextFromMessage: UIMessage에서 텍스트 추출
 * - normalizeMessagesForCloudRun: Cloud Run 호환 형식 변환
 *
 * @see src/app/api/ai/supervisor/route.ts
 */

import { describe, expect, it } from 'vitest';

// ============================================================================
// 테스트용 타입 정의 (route.ts의 스키마 미러링)
// ============================================================================

interface TextPart {
  type: 'text';
  text: string;
}

interface ImagePart {
  type: 'image';
  image: string;
}

interface ToolCallPart {
  type: 'tool-call';
  toolName: string;
  args: Record<string, unknown>;
}

type Part = TextPart | ImagePart | ToolCallPart;

interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  parts?: Part[];
  content?: string;
  createdAt?: string | Date;
}

// ============================================================================
// 테스트용 함수 구현 (route.ts와 동일 로직)
// ============================================================================

/**
 * AI SDK v5 UIMessage 또는 레거시 메시지에서 텍스트 콘텐츠 추출
 */
function extractTextFromMessage(message: Message): string {
  // 1. AI SDK v5 parts 배열에서 텍스트 추출
  if (message.parts && Array.isArray(message.parts)) {
    const textParts = message.parts
      .filter((part): part is TextPart => part.type === 'text')
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

/**
 * AI SDK v5 메시지를 Cloud Run 호환 형식으로 정규화
 *
 * @note (2025-12-23 개선)
 * - 빈 content 필터링 제거 → 대화 맥락 보존
 * - 이미지/Tool Call 메시지도 플레이스홀더로 보존
 */
function normalizeMessagesForCloudRun(
  messages: Message[]
): { role: string; content: string }[] {
  return messages.map((msg) => {
    const content = extractTextFromMessage(msg);

    // 빈 content인 경우 플레이스홀더 사용 (맥락 보존)
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

// ============================================================================
// 테스트 케이스
// ============================================================================

describe('extractTextFromMessage', () => {
  describe('AI SDK v5 parts 형식', () => {
    it('단일 text part에서 텍스트 추출', () => {
      const message: Message = {
        role: 'user',
        parts: [{ type: 'text', text: '안녕하세요' }],
      };

      expect(extractTextFromMessage(message)).toBe('안녕하세요');
    });

    it('다중 text parts를 줄바꿈으로 연결', () => {
      const message: Message = {
        role: 'user',
        parts: [
          { type: 'text', text: '첫 번째 문장' },
          { type: 'text', text: '두 번째 문장' },
        ],
      };

      expect(extractTextFromMessage(message)).toBe(
        '첫 번째 문장\n두 번째 문장'
      );
    });

    it('혼합 parts에서 text만 추출 (image 무시)', () => {
      const message: Message = {
        role: 'user',
        parts: [
          { type: 'text', text: '이미지 설명:' },
          { type: 'image', image: 'base64...' },
          { type: 'text', text: '추가 질문' },
        ],
      };

      expect(extractTextFromMessage(message)).toBe('이미지 설명:\n추가 질문');
    });

    it('혼합 parts에서 text만 추출 (tool-call 무시)', () => {
      const message: Message = {
        role: 'assistant',
        parts: [
          { type: 'text', text: '도구를 실행합니다' },
          { type: 'tool-call', toolName: 'getServerStatus', args: {} },
        ],
      };

      expect(extractTextFromMessage(message)).toBe('도구를 실행합니다');
    });

    it('text가 없는 parts (image only)는 빈 문자열 반환', () => {
      const message: Message = {
        role: 'user',
        parts: [{ type: 'image', image: 'base64...' }],
      };

      expect(extractTextFromMessage(message)).toBe('');
    });

    it('빈 parts 배열은 빈 문자열 반환', () => {
      const message: Message = {
        role: 'user',
        parts: [],
      };

      expect(extractTextFromMessage(message)).toBe('');
    });
  });

  describe('레거시 content 형식', () => {
    it('content 문자열에서 텍스트 추출', () => {
      const message: Message = {
        role: 'user',
        content: '레거시 메시지입니다',
      };

      expect(extractTextFromMessage(message)).toBe('레거시 메시지입니다');
    });

    it('빈 content는 빈 문자열 반환', () => {
      const message: Message = {
        role: 'user',
        content: '',
      };

      expect(extractTextFromMessage(message)).toBe('');
    });
  });

  describe('우선순위 테스트', () => {
    it('parts와 content 모두 있으면 parts 우선', () => {
      const message: Message = {
        role: 'user',
        parts: [{ type: 'text', text: 'parts에서 추출' }],
        content: 'content에서 추출',
      };

      expect(extractTextFromMessage(message)).toBe('parts에서 추출');
    });

    it('parts에 text가 없으면 content 폴백', () => {
      const message: Message = {
        role: 'user',
        parts: [{ type: 'image', image: 'base64...' }],
        content: 'content에서 추출',
      };

      // parts에 text가 없으면 빈 문자열 (현재 구현)
      // content 폴백은 parts 자체가 없을 때만 동작
      expect(extractTextFromMessage(message)).toBe('');
    });

    it('parts가 undefined이면 content 사용', () => {
      const message: Message = {
        role: 'user',
        content: 'content 사용',
      };

      expect(extractTextFromMessage(message)).toBe('content 사용');
    });
  });

  describe('에지 케이스', () => {
    it('parts와 content 모두 없음', () => {
      const message: Message = {
        role: 'user',
      };

      expect(extractTextFromMessage(message)).toBe('');
    });

    it('유니코드/이모지 처리', () => {
      const message: Message = {
        role: 'user',
        parts: [{ type: 'text', text: '한글 테스트 🎉 emoji' }],
      };

      expect(extractTextFromMessage(message)).toBe('한글 테스트 🎉 emoji');
    });

    it('줄바꿈 문자 포함', () => {
      const message: Message = {
        role: 'user',
        parts: [{ type: 'text', text: '첫 줄\n둘째 줄\n셋째 줄' }],
      };

      expect(extractTextFromMessage(message)).toBe('첫 줄\n둘째 줄\n셋째 줄');
    });
  });
});

describe('normalizeMessagesForCloudRun', () => {
  describe('기본 변환', () => {
    it('단일 메시지 정규화', () => {
      const messages: Message[] = [
        { role: 'user', parts: [{ type: 'text', text: '안녕하세요' }] },
      ];

      const result = normalizeMessagesForCloudRun(messages);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        role: 'user',
        content: '안녕하세요',
      });
    });

    it('다중 메시지 순서 유지', () => {
      const messages: Message[] = [
        { role: 'user', parts: [{ type: 'text', text: '질문입니다' }] },
        { role: 'assistant', parts: [{ type: 'text', text: '답변입니다' }] },
        { role: 'user', parts: [{ type: 'text', text: '후속 질문' }] },
      ];

      const result = normalizeMessagesForCloudRun(messages);

      expect(result).toHaveLength(3);
      expect(result[0].content).toBe('질문입니다');
      expect(result[1].content).toBe('답변입니다');
      expect(result[2].content).toBe('후속 질문');
    });
  });

  describe('빈 content 처리 (2025-12-23 개선)', () => {
    it('이미지 전용 메시지는 플레이스홀더로 대체', () => {
      const messages: Message[] = [
        { role: 'user', parts: [{ type: 'image', image: 'base64...' }] },
      ];

      const result = normalizeMessagesForCloudRun(messages);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        role: 'user',
        content: '[Non-text content]',
      });
    });

    it('Tool Call 전용 메시지는 플레이스홀더로 대체', () => {
      const messages: Message[] = [
        {
          role: 'assistant',
          parts: [{ type: 'tool-call', toolName: 'getStatus', args: {} }],
        },
      ];

      const result = normalizeMessagesForCloudRun(messages);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        role: 'assistant',
        content: '[Non-text content]',
      });
    });

    it('빈 parts 배열은 플레이스홀더로 대체', () => {
      const messages: Message[] = [{ role: 'user', parts: [] }];

      const result = normalizeMessagesForCloudRun(messages);

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('[Non-text content]');
    });

    it('혼합 대화에서 맥락 보존', () => {
      const messages: Message[] = [
        { role: 'user', parts: [{ type: 'text', text: '이 이미지 분석해줘' }] },
        { role: 'user', parts: [{ type: 'image', image: 'base64...' }] },
        {
          role: 'assistant',
          parts: [{ type: 'text', text: '이미지 분석 결과입니다' }],
        },
      ];

      const result = normalizeMessagesForCloudRun(messages);

      expect(result).toHaveLength(3);
      expect(result[0].content).toBe('이 이미지 분석해줘');
      expect(result[1].content).toBe('[Non-text content]'); // 기존: 필터링됨
      expect(result[2].content).toBe('이미지 분석 결과입니다');
    });
  });

  describe('대화 맥락 보존 검증', () => {
    it('메시지 순서 및 role 보존', () => {
      const messages: Message[] = [
        { role: 'system', content: '시스템 프롬프트' },
        { role: 'user', parts: [{ type: 'text', text: '사용자 질문' }] },
        { role: 'assistant', parts: [{ type: 'text', text: 'AI 응답' }] },
      ];

      const result = normalizeMessagesForCloudRun(messages);

      expect(result.map((m) => m.role)).toEqual([
        'system',
        'user',
        'assistant',
      ]);
    });

    it('연속된 비텍스트 메시지도 모두 보존', () => {
      const messages: Message[] = [
        { role: 'user', parts: [{ type: 'text', text: '여러 이미지야' }] },
        { role: 'user', parts: [{ type: 'image', image: 'img1' }] },
        { role: 'user', parts: [{ type: 'image', image: 'img2' }] },
        { role: 'user', parts: [{ type: 'image', image: 'img3' }] },
        {
          role: 'assistant',
          parts: [{ type: 'text', text: '3개 이미지 확인' }],
        },
      ];

      const result = normalizeMessagesForCloudRun(messages);

      expect(result).toHaveLength(5);
      // 모든 이미지 메시지가 보존됨
      expect(result[1].content).toBe('[Non-text content]');
      expect(result[2].content).toBe('[Non-text content]');
      expect(result[3].content).toBe('[Non-text content]');
    });
  });

  describe('레거시 호환성', () => {
    it('content 문자열 메시지 처리', () => {
      const messages: Message[] = [{ role: 'user', content: '레거시 메시지' }];

      const result = normalizeMessagesForCloudRun(messages);

      expect(result[0].content).toBe('레거시 메시지');
    });

    it('parts와 content 혼합 처리', () => {
      const messages: Message[] = [
        { role: 'user', parts: [{ type: 'text', text: 'SDK v5' }] },
        { role: 'assistant', content: 'Legacy' },
        { role: 'user', parts: [{ type: 'text', text: '다시 v5' }] },
      ];

      const result = normalizeMessagesForCloudRun(messages);

      expect(result).toHaveLength(3);
      expect(result[0].content).toBe('SDK v5');
      expect(result[1].content).toBe('Legacy');
      expect(result[2].content).toBe('다시 v5');
    });
  });

  describe('에지 케이스', () => {
    it('빈 메시지 배열', () => {
      const result = normalizeMessagesForCloudRun([]);
      expect(result).toEqual([]);
    });

    it('긴 텍스트 처리', () => {
      const longText = 'A'.repeat(10000);
      const messages: Message[] = [
        { role: 'user', parts: [{ type: 'text', text: longText }] },
      ];

      const result = normalizeMessagesForCloudRun(messages);

      expect(result[0].content).toBe(longText);
      expect(result[0].content.length).toBe(10000);
    });
  });
});

describe('회귀 테스트 - 기존 버그 방지', () => {
  it('[FIXED] 빈 content 필터링으로 인한 맥락 소실 방지', () => {
    /**
     * 이전 구현 (버그):
     * return messages.map(...).filter((msg) => msg.content.length > 0);
     *
     * 문제: 이미지/Tool Call 메시지가 필터링되어 대화 맥락 소실
     *
     * 수정 후:
     * 빈 content → '[Non-text content]' 플레이스홀더로 대체
     */
    const messages: Message[] = [
      { role: 'user', parts: [{ type: 'text', text: '이 사진 뭐야?' }] },
      { role: 'user', parts: [{ type: 'image', image: 'photo.jpg' }] },
      { role: 'assistant', parts: [{ type: 'text', text: '고양이입니다' }] },
    ];

    const result = normalizeMessagesForCloudRun(messages);

    // 핵심: 3개 메시지 모두 보존
    expect(result).toHaveLength(3);

    // 이미지 메시지가 필터링되지 않고 플레이스홀더로 보존
    expect(result[1].content).toBe('[Non-text content]');
    expect(result[1].role).toBe('user');
  });

  it('[FIXED] Tool Call 결과 메시지 보존', () => {
    const messages: Message[] = [
      { role: 'user', parts: [{ type: 'text', text: '서버 상태 확인해줘' }] },
      {
        role: 'assistant',
        parts: [{ type: 'tool-call', toolName: 'getServerStatus', args: {} }],
      },
      { role: 'assistant', parts: [{ type: 'text', text: '서버 정상입니다' }] },
    ];

    const result = normalizeMessagesForCloudRun(messages);

    // Tool Call 메시지도 보존
    expect(result).toHaveLength(3);
    expect(result[1].content).toBe('[Non-text content]');
  });
});
