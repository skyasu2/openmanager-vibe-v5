import { afterEach, describe, expect, it, vi } from 'vitest';
import * as memory from '../memory.js';

type ProcessMemoryUsage = ReturnType<typeof process.memoryUsage>;

const createRawUsage = (percent: number): ProcessMemoryUsage => {
  const heapTotal = 200 * 1024 * 1024;
  const heapUsed = (percent / 100) * heapTotal;

  return {
    rss: heapTotal,
    heapTotal,
    heapUsed,
    external: 0,
    arrayBuffers: 0,
  };
};

describe('memory utilities', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.MULTI_AI_MEMORY_FORCE_GC;
    delete process.env.MULTI_AI_MEMORY_SPIKE_THRESHOLD;
  });

  describe('checkMemoryAfterQuery', () => {
    it('returns true when heap usage stays within safe bounds', () => {
      vi.spyOn(process, 'memoryUsage').mockReturnValue(createRawUsage(50));

      const result = memory.checkMemoryAfterQuery('Codex', 45);
      expect(result).toBe(true);
    });

    it('flags potential leak when heap usage spikes over threshold', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(process, 'memoryUsage').mockReturnValue(createRawUsage(82));

      const result = memory.checkMemoryAfterQuery('Gemini', 55, { spikeThreshold: 20 });

      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Memory LEAK?] Gemini')
      );
    });

    it('forces garbage collection when configured for critical spikes', () => {
      const gcMock = vi.fn();
      const globalWithGc = globalThis as typeof globalThis & { gc?: () => void };
      const originalGc = globalWithGc.gc;
      globalWithGc.gc = gcMock;

      const usageSpy = vi.spyOn(process, 'memoryUsage');
      usageSpy
        .mockReturnValueOnce(createRawUsage(96))
        .mockReturnValueOnce(createRawUsage(96))
        .mockReturnValueOnce(createRawUsage(72));

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = memory.checkMemoryAfterQuery('Qwen', 70, {
        forceGcOnCritical: true,
      });

      expect(result).toBe(false);
      expect(gcMock).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Memory SPIKE] Qwen')
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('GC complete')
      );

      globalWithGc.gc = originalGc;
    });
  });

  describe('forceGarbageCollection', () => {
    it('returns false when gc is not available', () => {
      const globalWithGc = globalThis as typeof globalThis & { gc?: () => void };
      const originalGc = globalWithGc.gc;
      delete globalWithGc.gc;

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = memory.forceGarbageCollection();

      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(
        '[Memory Guard] GC not available (run Node with --expose-gc)'
      );

      globalWithGc.gc = originalGc;
    });
  });
});
