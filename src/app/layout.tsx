import { ClientProviders } from '@/components/providers/ClientProviders';
import '@/polyfills/process-browser';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
// 🛡️ 빌드 시 타이머 차단 시스템 (즉시 로드)
import { EmergencyBanner } from '@/components/emergency/EmergencyBanner';
import { SystemBootstrap } from '@/components/system/SystemBootstrap';

// 타이머 차단 시스템 조건부 로드
if (typeof window === 'undefined') {
  import('@/lib/build-safety/TimerBlocker').catch(console.warn);
}

// 서버 사이드에서만 실행되는 초기화 코드들
if (typeof window === 'undefined') {
  // Keep-alive 스케줄러 초기화 (서버에서만)
  import('@/lib/keep-alive-scheduler').catch(console.warn);
  // 성능 모니터링 초기화 (서버에서만)
  import('@/utils/performance').catch(console.warn);
  // 과도한 갱신 방지 시스템 초기화 (서버에서만)
  import('@/utils/update-prevention-init').catch(console.warn);

  // 한글 인코딩 자동 설정
  import('@/utils/encoding-fix')
    .then(({ detectAndFixTerminalEncoding }) => {
      detectAndFixTerminalEncoding();
    })
    .catch(console.warn);

  // 🔓 개발 환경에서 Passwordless 시스템 초기화
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.PASSWORDLESS_DEV_MODE === 'true'
  ) {
    import('@/lib/passwordless-env-manager')
      .then(({ passwordlessEnv }) => {
        passwordlessEnv
          .initialize()
          .then(success => {
            if (success) {
              passwordlessEnv.printStatusReport();
            }
          })
          .catch(console.warn);
      })
      .catch(console.warn);
  }
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
        <ClientProviders>
          <EmergencyBanner />
          <SystemBootstrap />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
