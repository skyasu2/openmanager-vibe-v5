import { ClientProviders } from '@/components/providers/ClientProviders';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';
import { EmergencyBanner } from '@/components/emergency/EmergencyBanner';
import { AuthTokenHandler } from '@/components/auth/AuthTokenHandler';
import { SystemBootstrap } from '@/components/system/SystemBootstrap';
import { Toaster } from '@/components/ui/toaster';
import { CSRFTokenProvider } from '@/components/security/CSRFTokenProvider';

// Vercel Analytics & Speed Insights (무료 티어 최적화 - 비활성화)
// import { SpeedInsights } from '@vercel/speed-insights/next';
// import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OpenManager - Korean AI Hybrid Engine',
  description: 'AI 기반 서버 모니터링 및 관리 시스템',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // 🔍 DIAGNOSTIC: Verify layout executes
  console.log('🔍 [RootLayout] Layout component executing', {
    timestamp: Date.now(),
    isSSR: typeof window === 'undefined',
    childrenType: typeof children,
    hasChildren: !!children,
  });

  return (
    <html lang="ko">
      <body className={inter.className}>
        <EmergencyBanner />
        <ClientProviders>
          <CSRFTokenProvider>
            <AuthTokenHandler />
            <SystemBootstrap />
            <Toaster />
            {(() => {
              console.log('🔍 [RootLayout] About to render children', {
                timestamp: Date.now(),
                isSSR: typeof window === 'undefined',
              });
              return children;
            })()}
          </CSRFTokenProvider>
        </ClientProviders>
        {/* Vercel Analytics 비활성화 - 무료 티어 최적화 (6개 404 에러 제거) */}
        {/* <SpeedInsights key="speed-insights" /> */}
        {/* <Analytics key="analytics" /> */}
      </body>
    </html>
  );
}
