/**
 * 🔐 Supabase Middleware Helper
 *
 * Creates a Supabase client for use in Next.js middleware with proper cookie handling.
 * Uses get/set/remove pattern to avoid TypeScript issues with getAll/setAll in Next.js 15.
 */

import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { getCookieValue } from '@/utils/cookies/safe-cookie-utils';

// Type for response with cookies (Next.js 15 TypeScript workaround)
interface ResponseWithCookies extends NextResponse {
  cookies: {
    set(name: string, value: string, options?: Record<string, unknown>): void;
    get(name: string): string | undefined;
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
      set(name: string, value: string, options: Record<string, unknown>) {
        try {
          (response as ResponseWithCookies).cookies.set(name, value, options);
        } catch {
          // Fallback: Use headers if cookies API fails
          const cookieValue = `${name}=${value}; Path=/; ${Object.entries(
            options
          )
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
            .filter(Boolean)
            .join('; ')}`;
          response.headers.append('Set-Cookie', cookieValue);
        }
      },
      remove(name: string, options: Record<string, unknown>) {
        try {
          (response as ResponseWithCookies).cookies.set(name, '', {
            ...options,
            maxAge: 0,
          });
        } catch {
          // Fallback: Use headers if cookies API fails
          const cookieValue = `${name}=; Path=/; Max-Age=0`;
          response.headers.append('Set-Cookie', cookieValue);
        }
      },
    },
  });
}
