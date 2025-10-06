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
 * Throws error if memory is critically low (>90%)
 * Logs warning if memory is high (>80%)
 *
 * @param provider - AI provider name (for logging)
 * @throws {Error} If memory usage is critical (>90%)
 */
export function checkMemoryBeforeQuery(provider: string): void {
  const mem = getMemoryUsage();

  // Critical: Reject query to prevent OOM
  if (mem.heapPercent >= 90) {
    const heapMB = (mem.heapUsed / 1024 / 1024).toFixed(1);
    const totalMB = (mem.heapTotal / 1024 / 1024).toFixed(1);
    throw new Error(
      `Memory critical (${mem.heapPercent.toFixed(1)}%): ${heapMB}MB / ${totalMB}MB. ` +
      `Refusing ${provider} query to prevent OOM. Try again in a few seconds.`
    );
  }

  // Warning: Allow query but log warning
  if (mem.heapPercent >= 80) {
    logMemoryUsage(`Pre-query ${provider}`);
  }
}
