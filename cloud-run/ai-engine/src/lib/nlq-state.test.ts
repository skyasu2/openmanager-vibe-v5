/**
 * NLQ State Helper Functions Tests
 */

import { describe, it, expect } from 'vitest';
import {
  parseTimeExpression,
  parseAggregationExpression,
  parseMetricExpression,
  parseFilterExpression,
  createDefaultExtractedParams,
  createNlqSubState,
} from './nlq-state';

describe('NLQ State Helper Functions', () => {
  describe('parseTimeExpression', () => {
    it('should parse current time expressions', () => {
      expect(parseTimeExpression('현재 CPU 상태')).toBe('current');
      expect(parseTimeExpression('지금 서버 상태')).toBe('current');
      expect(parseTimeExpression('now')).toBe('current');
    });

    it('should parse 1 hour time expressions', () => {
      expect(parseTimeExpression('지난 1시간')).toBe('last1h');
      expect(parseTimeExpression('한 시간 동안')).toBe('last1h');
      expect(parseTimeExpression('last hour')).toBe('last1h');
    });

    it('should parse 6 hour time expressions', () => {
      expect(parseTimeExpression('지난 6시간')).toBe('last6h');
      expect(parseTimeExpression('여섯 시간 동안')).toBe('last6h');
      expect(parseTimeExpression('last 6h')).toBe('last6h');
    });

    it('should parse 24 hour time expressions', () => {
      expect(parseTimeExpression('지난 24시간')).toBe('last24h');
      expect(parseTimeExpression('하루 동안')).toBe('last24h');
      expect(parseTimeExpression('어제 CPU')).toBe('last24h');
      expect(parseTimeExpression('yesterday')).toBe('last24h');
    });

    it('should default to current for unknown expressions', () => {
      expect(parseTimeExpression('서버 상태 확인')).toBe('current');
    });
  });

  describe('parseAggregationExpression', () => {
    it('should parse average expressions', () => {
      expect(parseAggregationExpression('CPU 평균')).toBe('avg');
      expect(parseAggregationExpression('average memory')).toBe('avg');
    });

    it('should parse max expressions', () => {
      expect(parseAggregationExpression('CPU 최대')).toBe('max');
      expect(parseAggregationExpression('highest memory')).toBe('max');
    });

    it('should parse min expressions', () => {
      expect(parseAggregationExpression('CPU 최소')).toBe('min');
      expect(parseAggregationExpression('lowest memory')).toBe('min');
    });

    it('should parse count expressions', () => {
      expect(parseAggregationExpression('서버 개수')).toBe('count');
      expect(parseAggregationExpression('count of servers')).toBe('count');
    });

    it('should default to none for unknown expressions', () => {
      expect(parseAggregationExpression('서버 상태')).toBe('none');
    });
  });

  describe('parseMetricExpression', () => {
    it('should parse CPU expressions', () => {
      expect(parseMetricExpression('CPU 사용량')).toBe('cpu');
      expect(parseMetricExpression('씨피유 상태')).toBe('cpu');
      expect(parseMetricExpression('프로세서 로드')).toBe('cpu');
    });

    it('should parse memory expressions', () => {
      expect(parseMetricExpression('메모리 상태')).toBe('memory');
      expect(parseMetricExpression('memory usage')).toBe('memory');
      expect(parseMetricExpression('램 사용량')).toBe('memory');
    });

    it('should parse disk expressions', () => {
      expect(parseMetricExpression('디스크 공간')).toBe('disk');
      expect(parseMetricExpression('disk usage')).toBe('disk');
      expect(parseMetricExpression('저장 공간')).toBe('disk');
    });

    it('should parse network expressions', () => {
      expect(parseMetricExpression('네트워크 상태')).toBe('network');
      expect(parseMetricExpression('network traffic')).toBe('network');
      expect(parseMetricExpression('트래픽 확인')).toBe('network');
    });

    it('should default to all for unknown expressions', () => {
      expect(parseMetricExpression('서버 상태')).toBe('all');
    });
  });

  describe('parseFilterExpression', () => {
    it('should parse "CPU 80% 이상" pattern', () => {
      const filter = parseFilterExpression('CPU 80% 이상인 서버');
      expect(filter).not.toBeNull();
      expect(filter?.field).toBe('cpu');
      expect(filter?.operator).toBe('>=');
      expect(filter?.value).toBe(80);
    });

    it('should parse "메모리 50% 이하" pattern', () => {
      const filter = parseFilterExpression('메모리 50% 이하');
      expect(filter).not.toBeNull();
      expect(filter?.field).toBe('memory');
      expect(filter?.operator).toBe('<=');
      expect(filter?.value).toBe(50);
    });

    it('should parse "CPU > 90" pattern', () => {
      const filter = parseFilterExpression('CPU 90 초과');
      expect(filter).not.toBeNull();
      expect(filter?.field).toBe('cpu');
      expect(filter?.operator).toBe('>');
      expect(filter?.value).toBe(90);
    });

    it('should return null for non-filter expressions', () => {
      const filter = parseFilterExpression('서버 상태 확인');
      expect(filter).toBeNull();
    });
  });

  describe('createDefaultExtractedParams', () => {
    it('should create default params with correct values', () => {
      const params = createDefaultExtractedParams();
      expect(params.metric).toBe('all');
      expect(params.timeRange).toBe('current');
      expect(params.filters).toEqual([]);
      expect(params.filterMode).toBe('AND');
      expect(params.aggregation).toBe('none');
      expect(params.sortOrder).toBe('desc');
    });
  });

  describe('createNlqSubState', () => {
    it('should create initial state with query', () => {
      const state = createNlqSubState('CPU 상태 확인');
      expect(state.originalQuery).toBe('CPU 상태 확인');
      expect(state.parsedIntent).toBe('unknown');
      expect(state.extractedParams).toBeNull();
      expect(state.queryResults).toBeNull();
      expect(state.retryCount).toBe(0);
      expect(state.lastError).toBeNull();
      expect(state.formattedResponse).toBe('');
      expect(state.executionStatus).toBe('pending');
    });
  });
});
