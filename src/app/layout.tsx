import { ClientProviders } from '@/components/providers/ClientProviders';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
// 🛡️ 빌드 시 타이머 차단 시스템 (즉시 로드)
import { EmergencyBanner } from '@/components/emergency/EmergencyBanner';
import { SystemBootstrap } from '@/components/system/SystemBootstrap';
import '@/lib/build-safety/TimerBlocker';

// Keep-alive 스케줄러 초기화
import '@/lib/keep-alive-scheduler';
// 성능 모니터링 초기화
import '@/utils/performance';
// 과도한 갱신 방지 시스템 초기화
import { passwordlessEnv } from '@/lib/passwordless-env-manager';
import { detectAndFixTerminalEncoding } from '@/utils/encoding-fix';
import '@/utils/update-prevention-init';

// 시스템 시작 시 한글 인코딩 자동 설정
if (typeof window === 'undefined') {
  detectAndFixTerminalEncoding();
}

// 🔓 개발 환경에서 Passwordless 시스템 초기화
if (
  process.env.NODE_ENV === 'development' ||
  process.env.PASSWORDLESS_DEV_MODE === 'true'
) {
  passwordlessEnv
    .initialize()
    .then(success => {
      if (success) {
        passwordlessEnv.printStatusReport();
      }
    })
    .catch(console.warn);
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
