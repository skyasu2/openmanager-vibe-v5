/**
 * Supervisor Request Schemas Tests
 *
 * @description Zod 스키마 검증 테스트 (파일 파트 빈 문자열 검증 포함)
 * @created 2026-01-27
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

// filePartSchema를 테스트하기 위해 별도 정의 (내부 스키마이므로)
const filePartSchema = z
  .object({
    type: z.literal('file'),
    data: z
      .string()
      .max(50 * 1024 * 1024, '파일 크기가 50MB를 초과합니다')
      .optional(),
    url: z
      .string()
      .max(50 * 1024 * 1024, '파일 크기가 50MB를 초과합니다')
      .optional(),
    mediaType: z
      .enum([
        'application/pdf',
        'text/plain',
        'text/markdown',
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/webp',
      ])
      .optional(),
    mimeType: z.string().optional(),
    filename: z.string().max(255).optional(),
    name: z.string().max(255).optional(),
  })
  .refine(
    (part) =>
      (typeof part.data === 'string' && part.data.length > 0) ||
      (typeof part.url === 'string' && part.url.length > 0),
    { message: 'File part must include non-empty data or url field' }
  );

describe('filePartSchema validation', () => {
  describe('빈 문자열 검증', () => {
    it('빈 data와 빈 url 문자열은 거부한다', () => {
      const invalidPart = {
        type: 'file' as const,
        data: '',
        url: '',
      };

      const result = filePartSchema.safeParse(invalidPart);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'File part must include non-empty data or url field'
        );
      }
    });

    it('빈 data만 있으면 거부한다', () => {
      const invalidPart = {
        type: 'file' as const,
        data: '',
      };

      const result = filePartSchema.safeParse(invalidPart);
      expect(result.success).toBe(false);
    });

    it('빈 url만 있으면 거부한다', () => {
      const invalidPart = {
        type: 'file' as const,
        url: '',
      };

      const result = filePartSchema.safeParse(invalidPart);
      expect(result.success).toBe(false);
    });

    it('data도 url도 없으면 거부한다', () => {
      const invalidPart = {
        type: 'file' as const,
      };

      const result = filePartSchema.safeParse(invalidPart);
      expect(result.success).toBe(false);
    });
  });

  describe('유효한 파일 파트', () => {
    it('유효한 data 필드를 허용한다', () => {
      const validPart = {
        type: 'file' as const,
        data: 'base64encodedcontent',
      };

      const result = filePartSchema.safeParse(validPart);
      expect(result.success).toBe(true);
    });

    it('유효한 url 필드를 허용한다', () => {
      const validPart = {
        type: 'file' as const,
        url: 'data:image/png;base64,iVBORw0KGgo=',
      };

      const result = filePartSchema.safeParse(validPart);
      expect(result.success).toBe(true);
    });

    it('data와 url이 모두 있으면 허용한다', () => {
      const validPart = {
        type: 'file' as const,
        data: 'base64content',
        url: 'https://example.com/file.pdf',
      };

      const result = filePartSchema.safeParse(validPart);
      expect(result.success).toBe(true);
    });

    it('모든 선택적 필드를 포함한 유효한 파트를 허용한다', () => {
      const validPart = {
        type: 'file' as const,
        data: 'base64encodedcontent',
        url: 'https://example.com/document.pdf',
        mediaType: 'application/pdf' as const,
        mimeType: 'application/pdf',
        filename: 'document.pdf',
        name: 'My Document',
      };

      const result = filePartSchema.safeParse(validPart);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('공백만 있는 data는 허용한다 (길이 > 0)', () => {
      // 공백만 있는 경우는 기술적으로 유효하지만
      // 실제 파일 데이터로서는 의미가 없음 (상위 검증 필요)
      const edgeCasePart = {
        type: 'file' as const,
        data: '   ',
      };

      const result = filePartSchema.safeParse(edgeCasePart);
      expect(result.success).toBe(true);
    });

    it('단일 문자 data는 허용한다', () => {
      const minimalPart = {
        type: 'file' as const,
        data: 'a',
      };

      const result = filePartSchema.safeParse(minimalPart);
      expect(result.success).toBe(true);
    });
  });
});
