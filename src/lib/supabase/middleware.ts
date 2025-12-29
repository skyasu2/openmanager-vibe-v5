/**
 * 🔐 Supabase Middleware Helper
 *
 * Creates a Supabase client for use in Next.js middleware with proper cookie handling.
 * Uses get/set/remove pattern to avoid TypeScript issues with getAll/setAll in Next.js 15.
 */

import { createServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';
import { getCookieValue } from '@/utils/cookies/safe-cookie-utils';

// Type for response with cookies (Next.js 16 compatible)
interface ResponseWithCookies extends Omit<NextResponse, 'cookies'> {
  cookies: {
    set(name: string, value: string, options?: Record<string, unknown>): void;
    get(name: string): { name: string; value: string } | undefined;
    getAll(): Array<{ name: string; value: string }>;
    has(name: string): boolean;
    delete(name: string): void;
  };
}

export function createMiddlewareClient(
  request: NextRequest,
  response: NextResponse
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return getCookieValue(request, name);
      },
      set(name: string, value: string, options: Record<string, unknown> = {}) {
        try {
          // Update request cookies for same-middleware chain visibility
          request.cookies.set(name, value);
          // Update response cookies for client
          (response as ResponseWithCookies).cookies.set(name, value, options);
        } catch {
          // Fallback: Use headers if cookies API fails
          // Preserve security flags: HttpOnly, Secure, SameSite
          const securityFlags: string[] = [
            'HttpOnly',
            options.secure !== false ? 'Secure' : '',
            `SameSite=${(options.sameSite as string) || 'Lax'}`,
          ].filter((flag) => flag !== '');

          const optionPairs = Object.entries(options)
            .map(([k, v]) => {
              // Properly serialize cookie options (primitives only)
              if (
                typeof v === 'string' ||
                typeof v === 'number' ||
                typeof v === 'boolean'
              ) {
                return `${k}=${String(v)}`;
              }
              // Skip complex objects to avoid '[object Object]'
              return '';
            })
            .filter((pair) => pair !== '');

          const cookieValue = `${name}=${value}; Path=/; ${optionPairs.concat(securityFlags).join('; ')}`;
          response.headers.append('Set-Cookie', cookieValue);
        }
      },
      remove(name: string, options: Record<string, unknown> = {}) {
        try {
          // Update request cookies for same-middleware chain visibility
          request.cookies.delete(name);
          // Update response cookies for client
          (response as ResponseWithCookies).cookies.set(name, '', {
            ...options,
            maxAge: 0,
          });
        } catch {
          // Fallback: Use headers if cookies API fails
          const cookieValue = `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
          response.headers.append('Set-Cookie', cookieValue);
        }
      },
    },
  });
}
