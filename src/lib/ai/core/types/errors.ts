/**
 * Error Types
 *
 * AI 엔진 에러 클래스
 */

import type { ProviderType } from './enums';

/**
 * Unified Engine 에러
 */
export class UnifiedEngineError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'UnifiedEngineError';
  }
}

/**
 * Provider 에러
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly providerName: string,
    public readonly providerType: ProviderType,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

/**
 * Cloud Run AI Engine 에러
 * @since v5.84.0 - Renamed from GoogleAIError
 */
export class CloudRunAIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'CloudRunAIError';
  }
}
