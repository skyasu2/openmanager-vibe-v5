/**
 * 🧪 RAG Utils 단위 테스트
 *
 * Vercel 무료 티어 안전:
 * - 순수 함수 테스트 (외부 API 호출 없음)
 * - Supabase 연결 없음
 * - 동기 연산만 수행
 */

import { describe, expect, it } from 'vitest';
import type { AIMetadata } from '../../types/ai-service-types';
import type { DocumentMetadata } from '../../types/rag/rag-types';
import {
  convertAIMetadataToDocumentMetadata,
  convertDocumentMetadataToAIMetadata,
} from './rag-utils';

describe('RAG Utils', () => {
  // ============================================================================
  // convertDocumentMetadataToAIMetadata 테스트
  // ============================================================================
  describe('convertDocumentMetadataToAIMetadata', () => {
    it('should return undefined for undefined input', () => {
      const result = convertDocumentMetadataToAIMetadata(undefined);
      expect(result).toBeUndefined();
    });

    it('should convert category field', () => {
      const docMeta: DocumentMetadata = {
        category: 'monitoring',
      };

      const result = convertDocumentMetadataToAIMetadata(docMeta);

      expect(result?.category).toBe('monitoring');
    });

    it('should convert tags field', () => {
      const docMeta: DocumentMetadata = {
        tags: ['cpu', 'memory', 'performance'],
      };

      const result = convertDocumentMetadataToAIMetadata(docMeta);

      expect(result?.tags).toEqual(['cpu', 'memory', 'performance']);
    });

    it('should convert source field', () => {
      const docMeta: DocumentMetadata = {
        source: 'server-metrics',
      };

      const result = convertDocumentMetadataToAIMetadata(docMeta);

      expect(result?.source).toBe('server-metrics');
    });

    it('should convert timestamp field', () => {
      const docMeta: DocumentMetadata = {
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const result = convertDocumentMetadataToAIMetadata(docMeta);

      expect(result?.timestamp).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should convert priority to importance', () => {
      const docMeta: DocumentMetadata = {
        priority: 75,
      };

      const result = convertDocumentMetadataToAIMetadata(docMeta);

      expect(result?.importance).toBe(75);
    });

    it('should convert version field', () => {
      const docMeta: DocumentMetadata = {
        version: '1.0.0',
      };

      const result = convertDocumentMetadataToAIMetadata(docMeta);

      expect(result?.version).toBe('1.0.0');
    });

    it('should handle all known fields together', () => {
      const docMeta: DocumentMetadata = {
        category: 'analysis',
        title: 'CPU Analysis',
        tags: ['cpu', 'analysis'],
        source: 'prometheus',
        author: 'system',
        timestamp: '2024-01-01T12:00:00.000Z',
        priority: 90,
        version: '2.0.0',
      };

      const result = convertDocumentMetadataToAIMetadata(docMeta);

      expect(result?.category).toBe('analysis');
      expect(result?.tags).toEqual(['cpu', 'analysis']);
      expect(result?.source).toBe('prometheus');
      expect(result?.timestamp).toBe('2024-01-01T12:00:00.000Z');
      expect(result?.importance).toBe(90);
      expect(result?.version).toBe('2.0.0');
      // title and author are not mapped to standard AIMetadata fields
    });

    it('should pass through additional string fields', () => {
      const docMeta: DocumentMetadata = {
        customField: 'custom-value',
        anotherField: 'another-value',
      };

      const result = convertDocumentMetadataToAIMetadata(docMeta);

      expect(result?.customField).toBe('custom-value');
      expect(result?.anotherField).toBe('another-value');
    });

    it('should pass through additional number fields', () => {
      const docMeta: DocumentMetadata = {
        score: 95,
        count: 10,
      };

      const result = convertDocumentMetadataToAIMetadata(docMeta);

      expect(result?.score).toBe(95);
      expect(result?.count).toBe(10);
    });

    it('should pass through additional boolean fields', () => {
      const docMeta: DocumentMetadata = {
        isActive: true,
        isProcessed: false,
      };

      const result = convertDocumentMetadataToAIMetadata(docMeta);

      expect(result?.isActive).toBe(true);
      expect(result?.isProcessed).toBe(false);
    });

    it('should pass through Date objects', () => {
      const date = new Date('2024-01-01');
      const docMeta: DocumentMetadata = {
        createdAt: date,
      };

      const result = convertDocumentMetadataToAIMetadata(docMeta);

      expect(result?.createdAt).toBe(date);
    });

    it('should pass through array fields', () => {
      const docMeta: DocumentMetadata = {
        relatedIds: ['id1', 'id2', 'id3'],
      };

      const result = convertDocumentMetadataToAIMetadata(docMeta);

      expect(result?.relatedIds).toEqual(['id1', 'id2', 'id3']);
    });

    it('should pass through object fields', () => {
      const docMeta: DocumentMetadata = {
        nestedData: { key: 'value', count: 5 },
      };

      const result = convertDocumentMetadataToAIMetadata(docMeta);

      expect(result?.nestedData).toEqual({ key: 'value', count: 5 });
    });

    it('should handle empty metadata', () => {
      const docMeta: DocumentMetadata = {};

      const result = convertDocumentMetadataToAIMetadata(docMeta);

      expect(result).toEqual({});
    });
  });

  // ============================================================================
  // convertAIMetadataToDocumentMetadata 테스트
  // ============================================================================
  describe('convertAIMetadataToDocumentMetadata', () => {
    it('should return undefined for undefined input', () => {
      const result = convertAIMetadataToDocumentMetadata(undefined);
      expect(result).toBeUndefined();
    });

    it('should convert category field', () => {
      const aiMeta: AIMetadata = {
        category: 'guide',
      };

      const result = convertAIMetadataToDocumentMetadata(aiMeta);

      expect(result?.category).toBe('guide');
    });

    it('should convert tags field', () => {
      const aiMeta: AIMetadata = {
        tags: ['tutorial', 'setup'],
      };

      const result = convertAIMetadataToDocumentMetadata(aiMeta);

      expect(result?.tags).toEqual(['tutorial', 'setup']);
    });

    it('should convert source field', () => {
      const aiMeta: AIMetadata = {
        source: 'ai-analysis',
      };

      const result = convertAIMetadataToDocumentMetadata(aiMeta);

      expect(result?.source).toBe('ai-analysis');
    });

    it('should convert string timestamp', () => {
      const aiMeta: AIMetadata = {
        timestamp: '2024-06-15T10:30:00.000Z',
      };

      const result = convertAIMetadataToDocumentMetadata(aiMeta);

      expect(result?.timestamp).toBe('2024-06-15T10:30:00.000Z');
    });

    it('should convert Date timestamp to ISO string', () => {
      const date = new Date('2024-06-15T10:30:00.000Z');
      const aiMeta: AIMetadata = {
        timestamp: date,
      };

      const result = convertAIMetadataToDocumentMetadata(aiMeta);

      expect(result?.timestamp).toBe('2024-06-15T10:30:00.000Z');
    });

    it('should convert importance to priority', () => {
      const aiMeta: AIMetadata = {
        importance: 80,
      };

      const result = convertAIMetadataToDocumentMetadata(aiMeta);

      expect(result?.priority).toBe(80);
    });

    it('should convert version field', () => {
      const aiMeta: AIMetadata = {
        version: '3.0.0',
      };

      const result = convertAIMetadataToDocumentMetadata(aiMeta);

      expect(result?.version).toBe('3.0.0');
    });

    it('should handle all known fields together', () => {
      const date = new Date('2024-06-15T10:30:00.000Z');
      const aiMeta: AIMetadata = {
        category: 'general',
        tags: ['info', 'general'],
        source: 'ai-engine',
        timestamp: date,
        importance: 50,
        version: '1.5.0',
      };

      const result = convertAIMetadataToDocumentMetadata(aiMeta);

      expect(result?.category).toBe('general');
      expect(result?.tags).toEqual(['info', 'general']);
      expect(result?.source).toBe('ai-engine');
      expect(result?.timestamp).toBe('2024-06-15T10:30:00.000Z');
      expect(result?.priority).toBe(50);
      expect(result?.version).toBe('1.5.0');
    });

    it('should pass through additional fields', () => {
      const aiMeta: AIMetadata = {
        customField: 'custom-value',
        numericField: 42,
        boolField: true,
      };

      const result = convertAIMetadataToDocumentMetadata(aiMeta);

      expect(result?.customField).toBe('custom-value');
      expect(result?.numericField).toBe(42);
      expect(result?.boolField).toBe(true);
    });

    it('should handle empty metadata', () => {
      const aiMeta: AIMetadata = {};

      const result = convertAIMetadataToDocumentMetadata(aiMeta);

      expect(result).toEqual({});
    });

    it('should be reversible with convertDocumentMetadataToAIMetadata', () => {
      const original: AIMetadata = {
        category: 'monitoring',
        tags: ['server', 'metrics'],
        source: 'prometheus',
        timestamp: '2024-01-01T00:00:00.000Z',
        importance: 75,
        version: '1.0.0',
      };

      const docMeta = convertAIMetadataToDocumentMetadata(original);
      const restored = convertDocumentMetadataToAIMetadata(docMeta);

      expect(restored?.category).toBe(original.category);
      expect(restored?.tags).toEqual(original.tags);
      expect(restored?.source).toBe(original.source);
      expect(restored?.timestamp).toBe(original.timestamp);
      expect(restored?.importance).toBe(original.importance);
      expect(restored?.version).toBe(original.version);
    });

    it('should handle zero importance value', () => {
      const aiMeta: AIMetadata = {
        importance: 0,
      };

      const result = convertAIMetadataToDocumentMetadata(aiMeta);

      // importance of 0 should still be converted (not falsy filtered)
      expect(result?.priority).toBe(0);
    });

    it('should handle undefined importance', () => {
      const aiMeta: AIMetadata = {
        category: 'test',
        // importance not set
      };

      const result = convertAIMetadataToDocumentMetadata(aiMeta);

      expect(result?.priority).toBeUndefined();
    });
  });
});
