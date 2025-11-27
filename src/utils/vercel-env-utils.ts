/**
 * vercel-env-utils - Environment-specific constants and utilities
 *
 * Provides Vercel/Local environment-specific values for timing and logging
 *
 * Extracted from:
 * - src/app/main/page.tsx (lines 41-46)
 */

import { isVercel } from '@/env';

/**
 * Component mount delay (ms)
 * - Vercel: 100ms (reduce hydration mismatch)
 * - Local: 0ms (instant mount)
 */
export const mountDelay = isVercel ? 100 : 0;

/**
 * State sync debounce delay (ms)
 * - Vercel: 1000ms (reduce serverless cold starts)
 * - Local: 500ms (faster local development)
 */
export const syncDebounce = isVercel ? 1000 : 500;

/**
 * Auth retry delay (ms)
 * - Vercel: 5000ms (avoid rate limiting)
 * - Local: 3000ms (faster retry for development)
 */
export const authRetryDelay = isVercel ? 5000 : 3000;

/**
 * Environment label for display
 */
export const envLabel = isVercel ? 'Vercel' : 'Local';

/**
 * Add environment prefix to debug message
 * @param message - Debug message
 * @returns Message with environment prefix
 */
export const debugWithEnv = (message: string): string =>
  `[${envLabel}] ${message}`;
