// 🚀 폴리필 최우선 로드 (빌드 타임 오류 방지)
// import '@/polyfills';
// 🛡️ 추가 SSR 호환성 폴리필
// import '@/lib/polyfills';

import { ClientProviders } from '@/components/providers/ClientProviders';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
// 🛡️ Emergency Banner 시스템
import { EmergencyBanner } from '@/components/emergency/EmergencyBanner';

import { AuthTokenHandler } from '@/components/auth/AuthTokenHandler';
import { SystemBootstrap } from '@/components/system/SystemBootstrap';
import { Toaster } from '@/components/ui/toaster';

// Keep-alive 스케줄러 초기화
// keep-alive-scheduler 제거됨 (사용량 모니터링 간소화)
// 인코딩 자동 설정
import { detectAndFixTerminalEncoding } from '@/utils/encoding-fix';
// 무료티어 보호 기능
import { enableGlobalProtection } from '@/config/free-tier-emergency-fix';

// 시스템 시작 시 한글 인코딩 자동 설정
if (typeof window === 'undefined') {
  detectAndFixTerminalEncoding();
}

// 🚨 SSR 호환성을 위한 전역 폴리필 강화 (Vercel 빌드 오류 완전 해결)
if (typeof globalThis !== 'undefined') {
  // self 참조 오류 방지 (강화) - 최우선
  if (typeof globalThis.self === 'undefined') {
    (globalThis as typeof globalThis & { self: typeof globalThis }).self = globalThis;
  }

  // window 참조 오류 방지 (서버 사이드)
  if (typeof globalThis.window === 'undefined') {
    (globalThis as typeof globalThis & { window: typeof globalThis }).window = globalThis;
  }

  // document 참조 오류 방지 (서버 사이드)
  if (typeof globalThis.document === 'undefined') {
    globalThis.document = {
      createElement: () => ({
        addEventListener: () => {},
        removeEventListener: () => {},
        style: {},
        setAttribute: () => {},
        getAttribute: () => null,
      }),
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
      body: {
        addEventListener: () => {},
        removeEventListener: () => {},
        style: {},
      },
      documentElement: {
        addEventListener: () => {},
        removeEventListener: () => {},
        style: {},
      },
    } as Document;
  }

  // navigator 참조 오류 방지 (서버 사이드)
  if (typeof globalThis.navigator === 'undefined') {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        userAgent: 'node.js',
        platform: 'node',
        language: 'ko-KR',
      },
      writable: false,
      enumerable: true,
      configurable: true,
    });
  }

  // location 참조 오류 방지 (서버 사이드)
  if (typeof globalThis.location === 'undefined') {
    globalThis.location = {
      href: '',
      origin: '',
      pathname: '',
      search: '',
      hash: '',
      hostname: 'localhost',
      port: '',
      protocol: 'https:',
    } as Location;
  }
}

// 추가적인 global 객체에도 적용 (이중 안전장치)
if (typeof window === 'undefined' && typeof global !== 'undefined') {
  (global as typeof global & { self: typeof global }).self = global;
  (global as typeof global & { window: typeof global }).window = global;
  (global as typeof global & { document: Partial<Document> }).document = {
    createElement: () => ({
      addEventListener: () => {},
      removeEventListener: () => {},
      style: {},
      setAttribute: () => {},
      getAttribute: () => null,
    }),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    body: {
      addEventListener: () => {},
      removeEventListener: () => {},
      style: {},
    },
    documentElement: {
      addEventListener: () => {},
      removeEventListener: () => {},
      style: {},
    },
  };
  Object.defineProperty(global, 'navigator', {
    value: {
      userAgent: 'node.js',
      platform: 'node',
      language: 'ko-KR',
    },
    writable: false,
    enumerable: true,
    configurable: true,
  });
  (global as typeof global & { location: Location }).location = {
    href: '',
    origin: '',
    pathname: '',
    search: '',
    hash: '',
    hostname: 'localhost',
    port: '',
    protocol: 'https:',
  };
}

const inter = Inter({ subsets: ['latin'] });

// 무료티어 보호 기능 활성화
if (typeof window === 'undefined') {
  // 서버 사이드에서만 실행
  enableGlobalProtection();
}

export const metadata: Metadata = {
  title: 'OpenManager - Korean AI Hybrid Engine',
  description: 'AI 기반 서버 모니터링 및 관리 시스템',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <EmergencyBanner />
        <ClientProviders>
          <AuthTokenHandler />
          <SystemBootstrap />
          <Toaster />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
