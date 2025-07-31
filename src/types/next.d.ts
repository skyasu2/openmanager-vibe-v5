// Temporary type declarations for Next.js modules
declare module 'next/link' {
  import { FC, AnchorHTMLAttributes, ReactNode } from 'react';
  
  interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onMouseEnter' | 'onTouchStart' | 'onClick'> {
    href: string | { pathname?: string; query?: any; hash?: string };
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
    locale?: string | false;
    legacyBehavior?: boolean;
  }
  
  const Link: FC<LinkProps & { children?: ReactNode }>;
  export default Link;
}

declare module 'next/navigation' {
  export function useRouter(): {
    push(href: string): void;
    replace(href: string): void;
    back(): void;
    forward(): void;
    refresh(): void;
    prefetch(href: string): void;
  };
  
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
  export function redirect(url: string): never;
  export function notFound(): never;
}

declare module 'next/server' {
  export class NextRequest extends Request {
    nextUrl: {
      pathname: string;
      searchParams: URLSearchParams;
      href: string;
    };
    cookies: Map<string, string>;
    headers: Headers;
  }
  
  export class NextResponse extends Response {
    static json(data: any, init?: ResponseInit): NextResponse;
    static redirect(url: string | URL, status?: number): NextResponse;
    static next(init?: ResponseInit): NextResponse;
    static rewrite(url: string | URL): NextResponse;
  }
}

declare module '@supabase/ssr' {
  export function createServerClient(
    supabaseUrl: string,
    supabaseKey: string,
    options: any
  ): any;
}