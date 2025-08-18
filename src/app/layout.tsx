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

// Vercel Analytics & Speed Insights
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

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
    // @ts-ignore - SSR 폴리필
    globalThis.self = globalThis;
  }

  // window 참조 오류 방지 (서버 사이드)
  if (typeof globalThis.window === 'undefined') {
    // @ts-ignore - SSR 폴리필
    globalThis.window = globalThis;
  }

  // document 참조 오류 방지 (서버 사이드)
  if (typeof globalThis.document === 'undefined') {
    // @ts-ignore - SSR 폴리필
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
      // @ts-ignore - SSR 폴리필
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
      body: {
        addEventListener: () => {},
        removeEventListener: () => {},
        // @ts-ignore - SSR 폴리필
        style: {},
      },
      documentElement: {
        addEventListener: () => {},
        removeEventListener: () => {},
        // @ts-ignore - SSR 폴리필
        style: {},
      },
    } as any; // SSR 폴리필
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
  // @ts-ignore - SSR 폴리필
  global.self = global;
  // @ts-ignore - SSR 폴리필
  global.window = global;
  // @ts-ignore - SSR 폴리필
  global.document = {
    // @ts-ignore - SSR 폴리필
    createElement: () => ({
      addEventListener: () => {},
      removeEventListener: () => {},
      style: {},
      setAttribute: () => {},
      getAttribute: () => null,
    }),
    getElementById: () => null,
    querySelector: () => null,
    // @ts-ignore - SSR 폴리필
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    body: {
      addEventListener: () => {},
      removeEventListener: () => {},
      // @ts-ignore - SSR 폴리필
      style: {},
    },
    documentElement: {
      addEventListener: () => {},
      removeEventListener: () => {},
      // @ts-ignore - SSR 폴리필
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
  // @ts-ignore - SSR 폴리필
  global.location = {
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
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
