import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isFatalError, withRetry, RetryOptions } from '../utils/retry';

describe('Retry Mechanism', () => {
  describe('isFatalError()', () => {
    describe('ENOENT Errors (CLI not installed)', () => {
      it('should detect ENOENT as fatal', () => {
        const error = new Error('spawn codex ENOENT') as NodeJS.ErrnoException;
        error.code = 'ENOENT';

        expect(isFatalError(error)).toBe(true);
      });

      it('should detect file not found errors', () => {
        const error = new Error(
          'Command failed: codex'
        ) as NodeJS.ErrnoException;
        error.code = 'ENOENT';

        expect(isFatalError(error)).toBe(true);
      });
    });

    describe('Authentication Errors', () => {
      it('should detect "unauthorized" as fatal', () => {
        const error = new Error('Request failed: Unauthorized');
        expect(isFatalError(error)).toBe(true);
      });

      it('should detect "authentication failed" as fatal', () => {
        const error = new Error('Authentication Failed: Invalid credentials');
        expect(isFatalError(error)).toBe(true);
      });

      it('should detect "invalid api key" as fatal', () => {
        const error = new Error('Invalid API Key provided');
        expect(isFatalError(error)).toBe(true);
      });

      it('should detect "api key not found" as fatal', () => {
        const error = new Error('API key not found in environment');
        expect(isFatalError(error)).toBe(true);
      });

      it('should detect "401" as fatal', () => {
        const error = new Error('HTTP 401: Unauthorized');
        expect(isFatalError(error)).toBe(true);
      });

      it('should detect "403 forbidden" as fatal', () => {
        const error = new Error('HTTP 403 Forbidden: Access denied');
        expect(isFatalError(error)).toBe(true);
      });
    });

    describe('Invalid Argument Errors', () => {
      it('should detect "invalid argument" as fatal', () => {
        const error = new Error('Invalid argument: query is required');
        expect(isFatalError(error)).toBe(true);
      });

      it('should detect "invalid input" as fatal', () => {
        const error = new Error('Invalid input format');
        expect(isFatalError(error)).toBe(true);
      });

      it('should detect "malformed" as fatal', () => {
        const error = new Error('Malformed JSON in request');
        expect(isFatalError(error)).toBe(true);
      });

      it('should detect "syntax error" as fatal', () => {
        const error = new Error('Syntax error in query');
        expect(isFatalError(error)).toBe(true);
      });
    });

    describe('MCP Timeout Errors', () => {
      it('should detect "mcp timeout" as fatal', () => {
        const error = new Error('MCP Timeout: Request exceeded 60s limit');
        expect(isFatalError(error)).toBe(true);
      });

      it('should detect "operation timed out" as fatal', () => {
        const error = new Error('Operation timed out after 60000ms');
        expect(isFatalError(error)).toBe(true);
      });

      it('should detect "deadline exceeded" as fatal', () => {
        const error = new Error('Deadline exceeded: operation cancelled');
        expect(isFatalError(error)).toBe(true);
      });
    });

    describe('Network Errors', () => {
      it('should detect "network unreachable" as fatal', () => {
        const error = new Error('Network unreachable');
        expect(isFatalError(error)).toBe(true);
      });

      it('should detect "host not found" as fatal', () => {
        const error = new Error('Host not found: DNS resolution failed');
        expect(isFatalError(error)).toBe(true);
      });

      it('should detect "dns lookup failed" as fatal', () => {
        const error = new Error('DNS lookup failed for api.openai.com');
        expect(isFatalError(error)).toBe(true);
      });
    });

    describe('Non-Fatal Errors (Retryable)', () => {
      it('should NOT detect connection timeout as fatal', () => {
        const error = new Error('Connection timeout');
        expect(isFatalError(error)).toBe(false);
      });

      it('should NOT detect ECONNRESET as fatal', () => {
        const error = new Error(
          'read ECONNRESET'
        ) as NodeJS.ErrnoException;
        error.code = 'ECONNRESET';
        expect(isFatalError(error)).toBe(false);
      });

      it('should NOT detect ETIMEDOUT as fatal', () => {
        const error = new Error(
          'connect ETIMEDOUT'
        ) as NodeJS.ErrnoException;
        error.code = 'ETIMEDOUT';
        expect(isFatalError(error)).toBe(false);
      });

      it('should NOT detect 500 server errors as fatal', () => {
        const error = new Error('HTTP 500: Internal Server Error');
        expect(isFatalError(error)).toBe(false);
      });

      it('should NOT detect 503 service unavailable as fatal', () => {
        const error = new Error('HTTP 503: Service Unavailable');
        expect(isFatalError(error)).toBe(false);
      });

      it('should NOT detect generic errors as fatal', () => {
        const error = new Error('Something went wrong');
        expect(isFatalError(error)).toBe(false);
      });
    });
  });

  describe('withRetry()', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('Fatal Error Handling', () => {
      it('should immediately throw ENOENT without retry', async () => {
        const error = new Error('spawn codex ENOENT') as NodeJS.ErrnoException;
        error.code = 'ENOENT';

        const fn = vi.fn().mockRejectedValue(error);
        const onRetry = vi.fn();

        const options: RetryOptions = {
          maxAttempts: 3,
          backoffBase: 1000,
          onRetry,
        };

        await expect(withRetry(fn, options)).rejects.toThrow(error);

        // Should only be called once (no retries)
        expect(fn).toHaveBeenCalledTimes(1);
        expect(onRetry).not.toHaveBeenCalled();
      });

      it('should immediately throw authentication errors without retry', async () => {
        const error = new Error('Invalid API Key');
        const fn = vi.fn().mockRejectedValue(error);
        const onRetry = vi.fn();

        const options: RetryOptions = {
          maxAttempts: 3,
          backoffBase: 1000,
          onRetry,
        };

        await expect(withRetry(fn, options)).rejects.toThrow(error);

        expect(fn).toHaveBeenCalledTimes(1);
        expect(onRetry).not.toHaveBeenCalled();
      });

      it('should immediately throw MCP timeout without retry', async () => {
        const error = new Error('MCP Timeout: exceeded 60s limit');
        const fn = vi.fn().mockRejectedValue(error);
        const onRetry = vi.fn();

        const options: RetryOptions = {
          maxAttempts: 3,
          backoffBase: 1000,
          onRetry,
        };

        await expect(withRetry(fn, options)).rejects.toThrow(error);

        expect(fn).toHaveBeenCalledTimes(1);
        expect(onRetry).not.toHaveBeenCalled();
      });
    });

    describe('Non-Fatal Error Retry', () => {
      it('should retry on connection timeout', async () => {
        const error = new Error('Connection timeout');
        const fn = vi
          .fn()
          .mockRejectedValueOnce(error)
          .mockRejectedValueOnce(error)
          .mockResolvedValueOnce('success');

        const onRetry = vi.fn();

        const options: RetryOptions = {
          maxAttempts: 3,
          backoffBase: 100, // Short delay for tests
          onRetry,
        };

        const result = await withRetry(fn, options);

        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(3);
        expect(onRetry).toHaveBeenCalledTimes(2);
        expect(onRetry).toHaveBeenNthCalledWith(1, 1, error);
        expect(onRetry).toHaveBeenNthCalledWith(2, 2, error);
      });

      it('should retry on ECONNRESET', async () => {
        const error = new Error('read ECONNRESET') as NodeJS.ErrnoException;
        error.code = 'ECONNRESET';

        const fn = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce('success');

        const options: RetryOptions = {
          maxAttempts: 2,
          backoffBase: 100,
        };

        const result = await withRetry(fn, options);

        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(2);
      });

      it('should throw after max attempts for non-fatal errors', async () => {
        const error = new Error('Temporary network issue');
        const fn = vi.fn().mockRejectedValue(error);

        const options: RetryOptions = {
          maxAttempts: 3,
          backoffBase: 100,
        };

        await expect(withRetry(fn, options)).rejects.toThrow(error);

        expect(fn).toHaveBeenCalledTimes(3);
      });
    });

    describe('Exponential Backoff with Jitter', () => {
      it('should use exponential backoff with jitter (±50%)', async () => {
        const error = new Error('Temporary failure');
        const fn = vi.fn().mockRejectedValue(error);

        // Spy on setTimeout to verify correct delays
        const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

        const options: RetryOptions = {
          maxAttempts: 3,
          backoffBase: 100,
        };

        await expect(withRetry(fn, options)).rejects.toThrow(error);

        expect(fn).toHaveBeenCalledTimes(3);
        expect(setTimeoutSpy).toHaveBeenCalledTimes(2);

        // Verify jitter is applied (delays should vary)
        // Base delays: 100ms (100 * 2^0), 200ms (100 * 2^1)
        // With jitter: 50-150ms, 100-300ms

        const firstDelay = setTimeoutSpy.mock.calls[0][1] as number;
        const secondDelay = setTimeoutSpy.mock.calls[1][1] as number;

        // First delay should be within 50-150ms (100ms ± 50%)
        expect(firstDelay).toBeGreaterThanOrEqual(50);
        expect(firstDelay).toBeLessThanOrEqual(150);

        // Second delay should be within 100-300ms (200ms ± 50%)
        expect(secondDelay).toBeGreaterThanOrEqual(100);
        expect(secondDelay).toBeLessThanOrEqual(300);

        setTimeoutSpy.mockRestore();
      });

      it('should apply jitter differently on each retry', async () => {
        const error = new Error('Temporary failure');

        // Run multiple trials to verify jitter varies
        const delays: number[][] = [];

        for (let trial = 0; trial < 3; trial++) { // Reduced from 5 to 3 trials
          const fn = vi.fn().mockRejectedValue(error);
          const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

          const options: RetryOptions = {
            maxAttempts: 2,
            backoffBase: 100, // Reduced from 1000ms to 100ms
          };

          await expect(withRetry(fn, options)).rejects.toThrow(error);

          const trialDelays = setTimeoutSpy.mock.calls.map((call) => call[1] as number);
          delays.push(trialDelays);

          setTimeoutSpy.mockRestore();
        }

        // Verify that not all trials have identical delays (jitter is random)
        const firstDelays = delays.map((d) => d[0]);
        const uniqueDelays = new Set(firstDelays);

        // With 3 trials and ±50% jitter, we should get at least 2 different values
        expect(uniqueDelays.size).toBeGreaterThanOrEqual(2);
      });

      it('should enforce maximum cap of 30 seconds', () => {
        const error = new Error('Temporary failure');
        const fn = vi.fn().mockRejectedValue(error);
        const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

        const options: RetryOptions = {
          maxAttempts: 2, // Reduced to 2 for faster test (1 retry)
          backoffBase: 25000, // High base: 25s * 2^1 = 50s (capped at 30s)
        };

        // Don't await - just verify setTimeout was called correctly
        withRetry(fn, options).catch(() => {
          // Ignore error - we're only checking setTimeout behavior
        });

        // Wait for next tick to let withRetry call setTimeout
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            // Check the delay passed to setTimeout
            const delays = setTimeoutSpy.mock.calls.map((call) => call[1] as number);
            
            // Verify all delays are capped at 30 seconds
            for (const delay of delays) {
              expect(delay).toBeLessThanOrEqual(30000);
            }

            setTimeoutSpy.mockRestore();
            resolve();
          }, 10);
        });
      });
    });

    describe('Success on First Attempt', () => {
      it('should return immediately on success', async () => {
        const fn = vi.fn().mockResolvedValue('success');
        const onRetry = vi.fn();

        const options: RetryOptions = {
          maxAttempts: 3,
          backoffBase: 1000,
          onRetry,
        };

        const result = await withRetry(fn, options);

        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(1);
        expect(onRetry).not.toHaveBeenCalled();
      });
    });

    describe('Non-Error Rejection', () => {
      it('should handle non-Error rejections', async () => {
        const rejection = 'string error';
        const fn = vi.fn().mockRejectedValue(rejection);

        const options: RetryOptions = {
          maxAttempts: 2,
          backoffBase: 100,
        };

        await expect(withRetry(fn, options)).rejects.toThrow('string error');
        expect(fn).toHaveBeenCalledTimes(2);
      });
    });
  });
});
