/**
 * Next.js 16 TypeScript Declarations
 *
 * Compatibility shim for Next.js 16 canary version
 * These declarations fill in missing types until official types are updated
 */

// Next.js core modules
declare module 'next' {
  export type { Metadata, Viewport } from 'next/types';
  export { default } from 'next/dist/server/next';
}

declare module 'next/headers' {
  import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

  export function cookies(): Promise<ReadonlyRequestCookies>;
  export function headers(): Promise<Headers>;
}

declare module 'next/dynamic' {
  import type { ComponentType, ReactNode } from 'react';

  export interface DynamicOptions<P = object> {
    loading?: () => ReactNode;
    ssr?: boolean;
  }

  export default function dynamic<P = object>(
    dynamicOptions: () => Promise<{ default: ComponentType<P> }>,
    options?: DynamicOptions<P>
  ): ComponentType<P>;
}

declare module 'next/image' {
  import type { ComponentType, ImgHTMLAttributes } from 'react';

  export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    src: string | { src: string; height: number; width: number };
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    loader?: (props: { src: string; width: number; quality?: number }) => string;
    quality?: number;
    priority?: boolean;
    loading?: 'lazy' | 'eager';
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
    unoptimized?: boolean;
    sizes?: string;
    style?: React.CSSProperties;
    className?: string;
  }

  const Image: ComponentType<ImageProps>;
  export default Image;
}

declare module 'next/font/google' {
  export interface FontOptions {
    weight?: string | string[];
    style?: string | string[];
    subsets?: string[];
    display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
    preload?: boolean;
    fallback?: string[];
    adjustFontFallback?: boolean;
    variable?: string;
  }

  export interface FontResult {
    className: string;
    style: {
      fontFamily: string;
      fontWeight?: number;
      fontStyle?: string;
    };
    variable?: string;
  }

  export function Inter(options?: FontOptions): FontResult;
  export function Roboto(options?: FontOptions): FontResult;
  export function Open_Sans(options?: FontOptions): FontResult;
  export function Noto_Sans_KR(options?: FontOptions): FontResult;
}

declare module 'next/server' {
  export class NextRequest extends Request {
    cookies: {
      get(name: string): { name: string; value: string } | undefined;
      getAll(): Array<{ name: string; value: string }>;
      set(name: string, value: string): void;
      delete(name: string): void;
      has(name: string): boolean;
    };
    nextUrl: URL;
    geo?: {
      city?: string;
      country?: string;
      region?: string;
    };
    ip?: string;
  }

  export class NextResponse extends Response {
    static json(body: unknown, init?: ResponseInit): NextResponse;
    static redirect(url: string | URL, status?: number): NextResponse;
    static rewrite(url: string | URL): NextResponse;
    static next(init?: ResponseInit): NextResponse;
    cookies: {
      get(name: string): { name: string; value: string } | undefined;
      getAll(): Array<{ name: string; value: string }>;
      set(name: string, value: string, options?: object): void;
      delete(name: string): void;
    };
  }

  // Export both as values (classes) - not just types
}

declare module 'next/link' {
  import type { AnchorHTMLAttributes, ComponentType } from 'react';

  export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string | { pathname: string; query?: Record<string, string> };
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
    locale?: string | false;
    legacyBehavior?: boolean;
    children?: React.ReactNode;
  }

  const Link: ComponentType<LinkProps>;
  export default Link;
}

declare module 'next/navigation' {
  export function useRouter(): {
    push(href: string, options?: { scroll?: boolean }): void;
    replace(href: string, options?: { scroll?: boolean }): void;
    refresh(): void;
    prefetch(href: string): void;
    back(): void;
    forward(): void;
  };

  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
  export function useParams<T = Record<string, string>>(): T;
  export function redirect(url: string): never;
  export function notFound(): never;
}

declare module 'next/dist/compiled/@edge-runtime/cookies' {
  export interface RequestCookie {
    name: string;
    value: string;
  }

  export interface ResponseCookie extends RequestCookie {
    path?: string;
    domain?: string;
    expires?: Date;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'lax' | 'strict' | 'none';
    maxAge?: number;
  }

  export class RequestCookies {
    get(name: string): RequestCookie | undefined;
    getAll(): RequestCookie[];
    has(name: string): boolean;
    set(name: string, value: string): void;
    delete(name: string): void;
  }

  export class ResponseCookies extends RequestCookies {
    set(name: string, value: string, options?: Partial<ResponseCookie>): void;
  }
}
