import { ClientProviders } from '@/components/providers/ClientProviders';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
// 🛡️ Emergency Banner 시스템
import { EmergencyBanner } from '@/components/emergency/EmergencyBanner';
import { SystemBootstrap } from '@/components/system/SystemBootstrap';

// Keep-alive 스케줄러 초기화
// keep-alive-scheduler 제거됨 (사용량 모니터링 간소화)
// 인코딩 자동 설정
import { detectAndFixTerminalEncoding } from '@/utils/encoding-fix';

// 시스템 시작 시 한글 인코딩 자동 설정
if (typeof window === 'undefined') {
  detectAndFixTerminalEncoding();
}

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OpenManager Vibe v5 - Korean AI Hybrid Engine',
  description: '세계 최초 한국어 특화 AI 하이브리드 서버 모니터링 시스템',
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
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
