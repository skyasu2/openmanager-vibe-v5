import { ClientProviders } from '@/components/providers/ClientProviders';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
// 🛡️ Emergency Banner 시스템
import { EmergencyBanner } from '@/components/emergency/EmergencyBanner';
// 🚀 폴리필 로드 (빌드 타임 오류 방지)
import '@/polyfills';

import { SystemBootstrap } from '@/components/system/SystemBootstrap';
import { Toaster } from '@/components/ui/toaster';

// Keep-alive 스케줄러 초기화
// keep-alive-scheduler 제거됨 (사용량 모니터링 간소화)
// 인코딩 자동 설정
import { detectAndFixTerminalEncoding } from '@/utils/encoding-fix';

// 시스템 시작 시 한글 인코딩 자동 설정
if (typeof window === 'undefined') {
  detectAndFixTerminalEncoding();
}

// �� SSR 호환성을 위한 전역 폴리필 강화
if (typeof globalThis !== 'undefined') {
  // self 참조 오류 방지 (강화)
  if (typeof globalThis.self === 'undefined') {
    (globalThis as any).self = globalThis;
  }

  // window 참조 오류 방지 (서버 사이드)
  if (typeof globalThis.window === 'undefined') {
    (globalThis as any).window = globalThis;
  }

  // document 참조 오류 방지 (서버 사이드)
  if (typeof globalThis.document === 'undefined') {
    globalThis.document = {} as any;
  }

  // navigator 참조 오류 방지 (서버 사이드)
  if (typeof globalThis.navigator === 'undefined') {
    globalThis.navigator = { userAgent: 'node.js' } as any;
  }

  // location 참조 오류 방지 (서버 사이드)
  if (typeof globalThis.location === 'undefined') {
    globalThis.location = {
      href: '',
      origin: '',
      pathname: '',
      search: '',
      hash: '',
    } as any;
  }
}

// 추가적인 global 객체에도 적용
if (typeof window === 'undefined' && typeof global !== 'undefined') {
  (global as any).self = global;
  (global as any).window = global;
  (global as any).document = {};
  (global as any).navigator = { userAgent: 'node.js' };
  (global as any).location = {
    href: '',
    origin: '',
    pathname: '',
    search: '',
    hash: '',
  };
}

const inter = Inter({ subsets: ['latin'] });

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
    <html lang='ko'>
      <body className={inter.className}>
        <EmergencyBanner />
        <ClientProviders>
          <SystemBootstrap />
          <Toaster />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
