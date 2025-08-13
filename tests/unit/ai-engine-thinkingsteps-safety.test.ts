/**
 * 🧪 AI Engine ThinkingSteps Safety Test
 * 
 * thinkingSteps 배열 undefined 에러 방지 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimplifiedQueryEngine } from '@/services/ai/SimplifiedQueryEngine';
import { SimplifiedQueryEngineUtils } from '@/services/ai/SimplifiedQueryEngine.utils';
import type { QueryResponse } from '@/services/ai/SimplifiedQueryEngine.types';

describe('AI Engine ThinkingSteps Safety', () => {
  let utils: SimplifiedQueryEngineUtils;

  beforeEach(() => {
    utils = new SimplifiedQueryEngineUtils();
  });

  describe('SafeUpdateLastThinkingStep', () => {
    it('should handle undefined thinkingSteps gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // @ts-expect-error Testing undefined case
      utils.safeUpdateLastThinkingStep(undefined, { status: 'completed' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ safeUpdateLastThinkingStep: thinkingSteps 배열이 비어있거나 유효하지 않습니다.'
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle empty array gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      utils.safeUpdateLastThinkingStep([], { status: 'completed' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ safeUpdateLastThinkingStep: thinkingSteps 배열이 비어있거나 유효하지 않습니다.'
      );
      
      consoleSpy.mockRestore();
    });

    it('should update last thinking step safely', async () => {
      const baseTime = Date.now();
      const thinkingSteps: QueryResponse['thinkingSteps'] = [
        {
          step: 'test',
          status: 'pending',
          timestamp: baseTime,
        }
      ];

      // 약간의 시간이 지나도록 대기
      await new Promise(resolve => setTimeout(resolve, 1));

      utils.safeUpdateLastThinkingStep(thinkingSteps, {
        status: 'completed',
        description: 'Test completed',
      });

      expect(thinkingSteps[0].status).toBe('completed');
      expect(thinkingSteps[0].description).toBe('Test completed');
      expect(thinkingSteps[0].duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('SafeInitThinkingSteps', () => {
    it('should initialize undefined to empty array', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = utils.safeInitThinkingSteps(undefined);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ safeInitThinkingSteps: thinkingSteps가 배열이 아닙니다. 빈 배열로 초기화합니다.'
      );
      
      consoleSpy.mockRestore();
    });

    it('should preserve valid arrays', () => {
      const validArray: QueryResponse['thinkingSteps'] = [
        { step: 'test', status: 'pending', timestamp: Date.now() }
      ];
      
      const result = utils.safeInitThinkingSteps(validArray);
      
      expect(result).toBe(validArray);
      expect(result.length).toBe(1);
    });

    it('should handle null input', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // @ts-expect-error Testing null case
      const result = utils.safeInitThinkingSteps(null);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Original Error Simulation', () => {
    it('should NOT throw "Cannot read properties of undefined (reading length)"', () => {
      // 에러를 재현하는 상황: thinkingSteps가 undefined인 경우
      let thinkingSteps: QueryResponse['thinkingSteps'] | undefined = undefined;
      
      expect(() => {
        // ❌ 기존 위험한 패턴 (에러 발생)
        // thinkingSteps[thinkingSteps.length - 1].status = 'completed';
        
        // ✅ 새로운 안전한 패턴 (에러 방지)
        thinkingSteps = utils.safeInitThinkingSteps(thinkingSteps);
        
        // 이제 안전하게 사용 가능
        thinkingSteps.push({
          step: 'test',
          status: 'pending',
          timestamp: Date.now(),
        });
        
        utils.safeUpdateLastThinkingStep(thinkingSteps, {
          status: 'completed'
        });
        
      }).not.toThrow();
      
      expect(thinkingSteps).toBeDefined();
      expect(Array.isArray(thinkingSteps)).toBe(true);
      expect(thinkingSteps.length).toBe(1);
      expect(thinkingSteps[0].status).toBe('completed');
    });
  });

  describe('GenerateFallbackResponse Safety', () => {
    it('should handle undefined thinkingSteps in fallback', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // @ts-expect-error Testing undefined case
      const result = utils.generateFallbackResponse('test query', undefined, Date.now());
      
      expect(result.success).toBe(false);
      expect(result.thinkingSteps).toBeDefined();
      expect(Array.isArray(result.thinkingSteps)).toBe(true);
      expect(result.thinkingSteps.length).toBeGreaterThan(0);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed thinking step objects', () => {
      const thinkingSteps = [
        { step: 'valid', status: 'pending' as const, timestamp: Date.now() },
        // @ts-expect-error Testing malformed object
        { invalidStep: true },
        null,
        undefined
      ] as QueryResponse['thinkingSteps'];
      
      expect(() => {
        utils.safeUpdateLastThinkingStep(thinkingSteps, { status: 'completed' });
      }).not.toThrow();
    });

    it('should handle concurrent access safely', async () => {
      const thinkingSteps: QueryResponse['thinkingSteps'] = [];
      
      // 동시 접근 시뮬레이션
      const promises = Array.from({ length: 10 }, (_, i) => 
        Promise.resolve().then(() => {
          thinkingSteps.push({
            step: `step-${i}`,
            status: 'pending',
            timestamp: Date.now(),
          });
          
          utils.safeUpdateLastThinkingStep(thinkingSteps, {
            status: 'completed',
            description: `Step ${i} completed`
          });
        })
      );
      
      await Promise.all(promises);
      
      expect(thinkingSteps.length).toBe(10);
      expect(thinkingSteps.every(step => step.status === 'completed')).toBe(true);
    });
  });
});