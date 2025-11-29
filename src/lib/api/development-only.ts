/**
 * Development-only API middleware
 *
 * Blocks access to development/testing APIs in production environment
 */

import { NextResponse } from 'next/server';

/**
 * Check if the current environment is production
 */
export function isProductionEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production'
  );
}

/**
 * Block access in production environment
 *
 * @returns NextResponse with 404 if in production, null otherwise
 */
export function blockInProduction(): NextResponse | null {
  if (isProductionEnvironment()) {
    return NextResponse.json(
      {
        error: 'Not Found',
        message: 'This endpoint is only available in development environment',
      },
      { status: 404 }
    );
  }
  return null;
}

/**
 * Wrapper for development-only route handlers
 *
 * Usage:
 * ```typescript
 * export const GET = developmentOnly(async (request) => {
 *   // Your handler logic
 * });
 * ```
 */
export function developmentOnly<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends (...args: any[]) => any,
>(handler: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((...args: any[]) => {
    const blockResponse = blockInProduction();
    if (blockResponse) {
      return blockResponse;
    }
    return handler(...args);
  }) as T;
}
