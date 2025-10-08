/**
 * Memory Monitoring Utilities
 *
 * Tracks Node.js heap usage and detects memory pressure
 * to prevent OOM errors in AI CLI calls
 */

export interface MemoryUsage {
  /** Heap memory used in bytes */
  heapUsed: number;
  /** Total heap memory allocated in bytes */
  heapTotal: number;
  /** Heap usage percentage (0-100) */
  heapPercent: number;
  /** Resident Set Size (total memory) in bytes */
  rss: number;
  /** External memory (C++ objects) in bytes */
  external: number;
  /** Array buffers memory in bytes */
  arrayBuffers: number;
}

/**
 * Get current memory usage statistics
 *
 * @returns MemoryUsage object with detailed heap information
 *
 * @example
 * ```typescript
 * const mem = getMemoryUsage();
 * console.log(`Heap: ${mem.heapPercent.toFixed(1)}%`);
 * ```
 */
export function getMemoryUsage(): MemoryUsage {
  const mem = process.memoryUsage();

  return {
    heapUsed: mem.heapUsed,
    heapTotal: mem.heapTotal,
    heapPercent: (mem.heapUsed / mem.heapTotal) * 100,
    rss: mem.rss,
    external: mem.external,
    arrayBuffers: mem.arrayBuffers,
  };
}

/**
 * Check if memory is under pressure
 *
 * @param threshold - Heap usage threshold (0-1), default 0.8 (80%)
 * @returns true if heap usage exceeds threshold
 *
 * @example
 * ```typescript
 * if (isMemoryUnderPressure(0.9)) {
 *   console.error('Critical: 90% heap used');
 * }
 * ```
 */
export function isMemoryUnderPressure(threshold = 0.8): boolean {
  const mem = getMemoryUsage();
  return mem.heapPercent / 100 > threshold;
}

/**
 * Log memory usage with appropriate warning level
 *
 * Logs to stderr (does not interfere with stdout MCP protocol)
 *
 * @param context - Context string for the log message
 */
export function logMemoryUsage(context: string): void {
  const mem = getMemoryUsage();
  const heapMB = (mem.heapUsed / 1024 / 1024).toFixed(1);
  const totalMB = (mem.heapTotal / 1024 / 1024).toFixed(1);
  const percent = mem.heapPercent.toFixed(1);

  // 90%+ Critical
  if (mem.heapPercent >= 90) {
    console.error(
      `[Memory CRITICAL] ${context}: ${heapMB}MB / ${totalMB}MB (${percent}%)`
    );
  }
  // 80-90% Warning
  else if (mem.heapPercent >= 80) {
    console.error(
      `[Memory WARNING] ${context}: ${heapMB}MB / ${totalMB}MB (${percent}%)`
    );
  }
  // <80% Info (only if debug enabled)
  else if (process.env.MULTI_AI_DEBUG === 'true') {
    console.error(
      `[Memory INFO] ${context}: ${heapMB}MB / ${totalMB}MB (${percent}%)`
    );
  }
}

/**
 * Format bytes to human-readable string
 *
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/**
 * Check memory before query execution
 *
 * Throws error if memory is critically low (>threshold%)
 * Logs warning if memory is high (>warning%)
 *
 * Environment variables:
 * - MULTI_AI_MEMORY_CRITICAL_THRESHOLD: Critical threshold 0-100 (default: 95)
 * - MULTI_AI_MEMORY_WARNING_THRESHOLD: Warning threshold 0-100 (default: 85)
 *
 * @param provider - AI provider name (for logging)
 * @throws {Error} If memory usage is critical (>threshold%)
 */
export function checkMemoryBeforeQuery(provider: string): void {
  const mem = getMemoryUsage();

  // Get thresholds from environment variables (with defaults)
  const criticalThreshold = parseFloat(process.env.MULTI_AI_MEMORY_CRITICAL_THRESHOLD || '95');
  const warningThreshold = parseFloat(process.env.MULTI_AI_MEMORY_WARNING_THRESHOLD || '85');

  // Critical: Reject query to prevent OOM
  if (mem.heapPercent >= criticalThreshold) {
    const heapMB = (mem.heapUsed / 1024 / 1024).toFixed(1);
    const totalMB = (mem.heapTotal / 1024 / 1024).toFixed(1);
    throw new Error(
      `Memory critical (${mem.heapPercent.toFixed(1)}%): ${heapMB}MB / ${totalMB}MB. ` +
      `Refusing ${provider} query to prevent OOM. Try again in a few seconds.`
    );
  }

  // Warning: Allow query but log warning
  if (mem.heapPercent >= warningThreshold) {
    logMemoryUsage(`Pre-query ${provider}`);
  }
}

/**
 * Options for post-query memory health checks
 */
export interface MemoryHealthOptions {
  /** Heap spike threshold in percentage points (default: 20) */
  spikeThreshold?: number;
  /** Trigger GC automatically when heap exceeds critical threshold */
  forceGcOnCritical?: boolean;
}

/**
 * Force garbage collection when Node.js exposes `global.gc`
 *
 * Requires launching Node with `--expose-gc`
 *
 * @returns true if GC was triggered, false if unavailable
 */
export function forceGarbageCollection(): boolean {
  const globalWithGc = global as typeof global & { gc?: () => void };

  if (typeof globalWithGc.gc === 'function') {
    console.warn('[Memory Guard] Forcing garbage collection...');

    const before = getMemoryUsage();
    globalWithGc.gc();
    const after = getMemoryUsage();

    console.warn(
      `[Memory Guard] GC complete: ${before.heapPercent.toFixed(1)}% → ${after.heapPercent.toFixed(1)}%`
    );

    return true;
  }

  console.warn('[Memory Guard] GC not available (run Node with --expose-gc)');
  return false;
}

/**
 * Post-query memory verification (detect spikes and leaks)
 *
 * @param provider - AI provider name (for logging)
 * @param beforeHeapPercent - Heap usage percentage before query
 * @param options - Memory health options (spike threshold, GC behaviour)
 * @returns true if memory remains healthy, false if spike detected
 */
export function checkMemoryAfterQuery(
  provider: string,
  beforeHeapPercent?: number,
  options: MemoryHealthOptions = {}
): boolean {
  const mem = getMemoryUsage();
  const criticalThreshold = parseFloat(process.env.MULTI_AI_MEMORY_CRITICAL_THRESHOLD || '95');
  const spikeThresholdEnv = parseFloat(process.env.MULTI_AI_MEMORY_SPIKE_THRESHOLD || '20');
  const spikeThreshold = Number.isFinite(options.spikeThreshold)
    ? options.spikeThreshold!
    : spikeThresholdEnv;

  // Critical spike: immediately warn and optionally trigger GC
  if (mem.heapPercent >= criticalThreshold) {
    console.error(
      `[Memory SPIKE] ${provider}: ${mem.heapPercent.toFixed(1)}% after query. ` +
      `Consider reducing query complexity or forcing GC.`
    );

    const shouldForceGc =
      options.forceGcOnCritical !== undefined
        ? options.forceGcOnCritical
        : process.env.MULTI_AI_MEMORY_FORCE_GC === 'true';

    if (shouldForceGc) {
      forceGarbageCollection();
    }

    return false;
  }

  // Large increase from baseline indicates potential leak
  if (
    typeof beforeHeapPercent === 'number' &&
    Number.isFinite(beforeHeapPercent) &&
    (mem.heapPercent - beforeHeapPercent) >= spikeThreshold
  ) {
    console.warn(
      `[Memory LEAK?] ${provider}: +${(mem.heapPercent - beforeHeapPercent).toFixed(1)}% ` +
      `(${beforeHeapPercent.toFixed(1)}% → ${mem.heapPercent.toFixed(1)}%).`
    );

    return false;
  }

  return true;
}
