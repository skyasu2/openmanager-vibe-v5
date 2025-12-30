/**
 * Message Normalizer Tests
 *
 * @description AI SDK v5 UIMessage와 레거시 메시지 형식 처리 테스트
 */

import type { UIMessage } from '@ai-sdk/react';
import { describe, expect, it } from 'vitest';
import {
  extractLastUserQuery,
  extractTextFromHybridMessage,
  extractTextFromUIMessage,
  type HybridMessage,
  normalizeMessagesForCloudRun,
} from './message-normalizer';

describe('message-normalizer', () => {
  describe('extractTextFromUIMessage', () => {
    it('parts 배열에서 텍스트를 추출한다', () => {
      const message = {
        id: '1',
        role: 'user',
        parts: [{ type: 'text', text: 'Hello World' }],
        createdAt: new Date(),
      } as UIMessage;

      expect(extractTextFromUIMessage(message)).toBe('Hello World');
    });

    it('여러 텍스트 파트를 합친다', () => {
      const message = {
        id: '1',
        role: 'user',
        parts: [
          { type: 'text', text: 'Hello' },
          { type: 'text', text: ' World' },
        ],
        createdAt: new Date(),
      } as UIMessage;

      expect(extractTextFromUIMessage(message)).toBe('Hello World');
    });

    it('빈 parts 배열에서 빈 문자열을 반환한다', () => {
      const message = {
        id: '1',
        role: 'user',
        parts: [],
        createdAt: new Date(),
      } as UIMessage;

      expect(extractTextFromUIMessage(message)).toBe('');
    });

    it('텍스트가 아닌 파트는 무시한다', () => {
      const message = {
        id: '1',
        role: 'user',
        parts: [
          { type: 'image', image: 'data:image/png;base64,...' },
          { type: 'text', text: 'Caption' },
        ],
        createdAt: new Date(),
      } as unknown as UIMessage;

      expect(extractTextFromUIMessage(message)).toBe('Caption');
    });
  });

  describe('extractTextFromHybridMessage', () => {
    it('AI SDK v5 parts 형식에서 텍스트를 추출한다', () => {
      const message: HybridMessage = {
        role: 'user',
        parts: [{ type: 'text', text: 'Hello from parts' }],
      };

      expect(extractTextFromHybridMessage(message)).toBe('Hello from parts');
    });

    it('레거시 content 형식에서 텍스트를 추출한다', () => {
      const message: HybridMessage = {
        role: 'user',
        content: 'Hello from content',
      };

      expect(extractTextFromHybridMessage(message)).toBe('Hello from content');
    });

    it('parts가 있으면 content보다 우선한다', () => {
      const message: HybridMessage = {
        role: 'user',
        parts: [{ type: 'text', text: 'From parts' }],
        content: 'From content',
      };

      expect(extractTextFromHybridMessage(message)).toBe('From parts');
    });

    it('빈 parts와 content가 없으면 빈 문자열을 반환한다', () => {
      const message: HybridMessage = {
        role: 'user',
      };

      expect(extractTextFromHybridMessage(message)).toBe('');
    });

    it('여러 텍스트 파트를 줄바꿈으로 합친다', () => {
      const message: HybridMessage = {
        role: 'user',
        parts: [
          { type: 'text', text: 'Line 1' },
          { type: 'text', text: 'Line 2' },
        ],
      };

      expect(extractTextFromHybridMessage(message)).toBe('Line 1\nLine 2');
    });
  });

  describe('normalizeMessagesForCloudRun', () => {
    it('메시지 배열을 Cloud Run 형식으로 변환한다', () => {
      const messages: HybridMessage[] = [
        { role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
        { role: 'assistant', content: 'Hi there' },
      ];

      const result = normalizeMessagesForCloudRun(messages);

      expect(result).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ]);
    });

    it('빈 content를 플레이스홀더로 대체한다', () => {
      const messages: HybridMessage[] = [
        { role: 'user', parts: [] },
        { role: 'assistant', parts: [{ type: 'image', text: undefined }] },
      ];

      const result = normalizeMessagesForCloudRun(messages);

      expect(result).toEqual([
        { role: 'user', content: '[Non-text content]' },
        { role: 'assistant', content: '[Non-text content]' },
      ]);
    });

    it('빈 배열은 빈 배열을 반환한다', () => {
      expect(normalizeMessagesForCloudRun([])).toEqual([]);
    });
  });

  describe('extractLastUserQuery', () => {
    it('마지막 사용자 메시지를 추출한다', () => {
      const messages: HybridMessage[] = [
        { role: 'user', content: 'First question' },
        { role: 'assistant', content: 'First answer' },
        { role: 'user', content: 'Second question' },
      ];

      expect(extractLastUserQuery(messages)).toBe('Second question');
    });

    it('사용자 메시지가 없으면 빈 문자열을 반환한다', () => {
      const messages: HybridMessage[] = [
        { role: 'assistant', content: 'Hello' },
        { role: 'system', content: 'System prompt' },
      ];

      expect(extractLastUserQuery(messages)).toBe('');
    });

    it('빈 배열에서 빈 문자열을 반환한다', () => {
      expect(extractLastUserQuery([])).toBe('');
    });

    it('parts 형식의 마지막 사용자 메시지를 추출한다', () => {
      const messages: HybridMessage[] = [
        { role: 'user', content: 'Old format' },
        { role: 'user', parts: [{ type: 'text', text: 'New format' }] },
      ];

      expect(extractLastUserQuery(messages)).toBe('New format');
    });
  });
});
