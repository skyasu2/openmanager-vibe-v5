import { ClientProviders } from '@/components/providers/ClientProviders';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { EmergencyBanner } from '@/components/emergency/EmergencyBanner';
import { AuthTokenHandler } from '@/components/auth/AuthTokenHandler';
import { SystemBootstrap } from '@/components/system/SystemBootstrap';
import { Toaster } from '@/components/ui/toaster';

// Vercel Analytics & Speed Insights
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

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
    <html lang="ko">
      <body className={inter.className}>
        <EmergencyBanner />
        <ClientProviders>
          <AuthTokenHandler />
          <SystemBootstrap />
          <Toaster />
          {children}
        </ClientProviders>
        <SpeedInsights key="speed-insights" />
        <Analytics key="analytics" />
      </body>
    </html>
  );
}
