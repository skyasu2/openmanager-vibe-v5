/**
 * 🔗 Context Compressor Integration Test
 *
 * AI 대화 컨텍스트 압축 시스템 통합 테스트
 *
 * Vercel 무료 티어 안전:
 * - ✅ 순수 함수 테스트
 * - ✅ 외부 API 호출 없음
 * - ✅ 10초 이내 실행
 *
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest';

import {
  type CompressibleMessage,
  compressContext,
  shouldCompress,
} from '@/lib/ai/utils/context-compressor';

describe('Context Compressor Integration', () => {
  describe('토큰 추정', () => {
    it('한국어 텍스트 토큰 추정 (~1.5자/토큰)', () => {
      // Given
      const messages: CompressibleMessage[] = [
        { role: 'user', content: '안녕하세요' }, // 5자 한국어 ≈ 3-4 토큰
      ];

      // When
      const result = compressContext(messages);

      // Then
      // 압축 없이 통과해야 함 (짧은 메시지)
      expect(result.compressedCount).toBe(1);
    });

    it('영어 텍스트 토큰 추정 (~4자/토큰)', () => {
      // Given
      const messages: CompressibleMessage[] = [
        { role: 'user', content: 'Hello world' }, // 11자 영어 ≈ 2-3 토큰
      ];

      // When
      const result = compressContext(messages);

      // Then
      expect(result.compressedCount).toBe(1);
    });

    it('혼합 텍스트 가중 평균', () => {
      // Given
      const messages: CompressibleMessage[] = [
        { role: 'user', content: '서버 CPU 사용량이 높습니다' }, // 한국어+영어 혼합
      ];

      // When
      const result = compressContext(messages);

      // Then
      expect(result.originalCount).toBe(1);
      expect(result.compressedCount).toBe(1);
    });
  });

  describe('compressContext', () => {
    it('최근 N개 메시지 유지 (기본 3개)', () => {
      // Given
      const messages: CompressibleMessage[] = [
        { role: 'user', content: 'Message 1' },
        { role: 'assistant', content: 'Response 1' },
        { role: 'user', content: 'Message 2' },
        { role: 'assistant', content: 'Response 2' },
        { role: 'user', content: 'Message 3' },
        { role: 'assistant', content: 'Response 3' },
      ];

      // When
      const result = compressContext(messages, { keepRecentCount: 3 });

      // Then - 최근 3개 메시지가 포함되어 있는지 확인
      expect(
        result.messages.some((m) => m.content === 'Response 3')
      ).toBeTruthy();
      expect(
        result.messages.some((m) => m.content === 'Message 3')
      ).toBeTruthy();
      expect(
        result.messages.some((m) => m.content === 'Response 2')
      ).toBeTruthy();
      // 압축 후 전체 메시지 수 확인
      expect(result.compressedCount).toBeLessThanOrEqual(messages.length);
    });

    it('시스템 메시지 분리 유지', () => {
      // Given
      const messages: CompressibleMessage[] = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];

      // When
      const result = compressContext(messages, { keepSystemMessages: true });

      // Then
      const systemMessages = result.messages.filter((m) => m.role === 'system');
      expect(systemMessages.length).toBeGreaterThanOrEqual(1);
      expect(systemMessages[0].content).toBe('You are a helpful assistant');
    });

    it('시스템 메시지 제외 옵션', () => {
      // Given
      const messages: CompressibleMessage[] = [
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: 'Hello' },
      ];

      // When
      const result = compressContext(messages, { keepSystemMessages: false });

      // Then
      const systemMessages = result.messages.filter((m) => m.role === 'system');
      expect(systemMessages.length).toBe(0);
    });

    it('압축 비율 계산', () => {
      // Given
      const longMessage = 'A'.repeat(2000);
      const messages: CompressibleMessage[] = [
        { role: 'user', content: longMessage },
        { role: 'assistant', content: longMessage },
        { role: 'user', content: longMessage },
        { role: 'assistant', content: longMessage },
        { role: 'user', content: 'Recent message' },
      ];

      // When
      const result = compressContext(messages, {
        keepRecentCount: 2,
        maxCharsPerMessage: 500,
      });

      // Then
      expect(result.compressionRatio).toBeGreaterThanOrEqual(0);
      expect(result.compressionRatio).toBeLessThanOrEqual(100);
    });

    it('estimatedTokensSaved 반환', () => {
      // Given
      const messages: CompressibleMessage[] = [
        { role: 'user', content: 'A'.repeat(1000) },
        { role: 'assistant', content: 'B'.repeat(1000) },
        { role: 'user', content: 'C'.repeat(1000) },
        { role: 'assistant', content: 'D'.repeat(1000) },
        { role: 'user', content: 'Short' },
      ];

      // When
      const result = compressContext(messages, {
        keepRecentCount: 2,
        maxCharsPerMessage: 200,
      });

      // Then
      expect(result.estimatedTokensSaved).toBeGreaterThanOrEqual(0);
    });

    it('빈 메시지 배열 처리', () => {
      // Given
      const messages: CompressibleMessage[] = [];

      // When
      const result = compressContext(messages);

      // Then
      expect(result.originalCount).toBe(0);
      expect(result.compressedCount).toBe(0);
      expect(result.messages).toEqual([]);
    });
  });

  describe('shouldCompress', () => {
    it('threshold 이하 → false', () => {
      // Given
      const messageCount = 3;
      const threshold = 4;

      // When
      const result = shouldCompress(messageCount, threshold);

      // Then
      expect(result).toBe(false);
    });

    it('threshold 초과 → true', () => {
      // Given
      const messageCount = 5;
      const threshold = 4;

      // When
      const result = shouldCompress(messageCount, threshold);

      // Then
      expect(result).toBe(true);
    });

    it('기본 threshold = 4', () => {
      // When/Then
      expect(shouldCompress(4)).toBe(false);
      expect(shouldCompress(5)).toBe(true);
    });

    it('threshold와 같은 경우 → false', () => {
      // Given
      const messageCount = 4;
      const threshold = 4;

      // When
      const result = shouldCompress(messageCount, threshold);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('옵션 조합', () => {
    it('모든 옵션 동시 적용', () => {
      // Given
      const messages: CompressibleMessage[] = [
        { role: 'system', content: 'System message' },
        { role: 'user', content: 'User 1' },
        { role: 'assistant', content: 'Assistant 1' },
        { role: 'user', content: 'User 2' },
        { role: 'assistant', content: 'Assistant 2' },
        { role: 'user', content: 'User 3' },
      ];

      // When
      const result = compressContext(messages, {
        keepRecentCount: 2,
        maxTotalMessages: 4,
        maxCharsPerMessage: 500,
        keepSystemMessages: true,
        enableSummarization: false,
      });

      // Then
      expect(result.compressedCount).toBeLessThanOrEqual(4);
      expect(result.messages.some((m) => m.role === 'system')).toBe(true);
    });
  });
});
