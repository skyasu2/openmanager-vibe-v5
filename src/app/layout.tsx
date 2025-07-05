import { ClientProviders } from '@/components/providers/ClientProviders';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
// 🛡️ 빌드 시 타이머 차단 시스템 (즉시 로드)
import { SystemBootstrap } from '@/components/system/SystemBootstrap';
import '@/lib/build-safety/TimerBlocker';

// Keep-alive 스케줄러 초기화
import '@/lib/keep-alive-scheduler';
// 성능 모니터링 초기화
import '@/utils/performance';
// 스마트 무료 티어 최적화 시스템 초기화
import { passwordlessEnv } from '@/lib/passwordless-env-manager';
import { staticOptimizer } from '@/lib/smart-free-tier-config';
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

// 🎯 스마트 무료 티어 최적화 시스템 초기화
if (typeof window !== 'undefined') {
  console.log(
    '🎯 스마트 무료 티어 최적화 시스템 활성화:',
    staticOptimizer.getConfigSummary()
  );
}

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OpenManager Vibe v5 - 무료 티어 최적화',
  description: '모든 서비스 무료 한도 내 운영하는 차세대 서버 관리 시스템',
  keywords: [
    '서버 관리',
    '무료 티어',
    'Vercel',
    'Supabase',
    'Google Cloud',
    'AI',
  ],
  authors: [{ name: 'OpenManager Team' }],
  viewport: 'width=device-width, initial-scale=1',
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
