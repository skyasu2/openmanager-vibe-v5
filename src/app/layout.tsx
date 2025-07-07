import { ClientProviders } from '@/components/providers/ClientProviders';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
// 🛡️ Emergency Banner 시스템
import { EmergencyBanner } from '@/components/emergency/EmergencyBanner';

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

// 🔧 SSR 호환성을 위한 전역 폴리필
if (typeof globalThis !== 'undefined') {
  // @ts-ignore
  globalThis.self = globalThis.self || globalThis;
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
