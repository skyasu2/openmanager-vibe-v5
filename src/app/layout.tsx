import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '@/components/providers/ClientProviders';
// 🛡️ 빌드 시 타이머 차단 시스템 (즉시 로드)
import '@/lib/build-safety/TimerBlocker';
import { SystemBootstrap } from '@/components/system/SystemBootstrap';

// 개발 환경 초기화 (Docker/로컬 감지)
import '@/utils/init-dev-env';
// Keep-alive 스케줄러 초기화
import '@/lib/keep-alive-scheduler';
// 성능 모니터링 초기화
import '@/utils/performance';

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
        <ClientProviders>
          <SystemBootstrap />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
