/**
 * 🚀 성능 최적화된 루트 레이아웃
 * Core Web Vitals 개선을 위한 최적화 적용
 */

import { ClientProviders } from '@/components/providers/ClientProviders';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import '../styles/critical.css'; // Critical CSS 추가

// Emergency Banner 및 기타 컴포넌트들
import { EmergencyBanner } from '@/components/emergency/EmergencyBanner';
import { AuthTokenHandler } from '@/components/auth/AuthTokenHandler';
import { SystemBootstrap } from '@/components/system/SystemBootstrap';
import { Toaster } from '@/components/ui/toaster';

// 성능 모니터링 (지연 로딩)
import dynamic from 'next/dynamic';

const PerformanceMonitor = dynamic(
  () => import('@/components/performance/PerformanceMonitor'),
  { 
    ssr: false,
    loading: () => null,
  }
);

// 🛡️ CSP 호환 성능 모니터링
const SafePerformanceScript = dynamic(
  () => import('@/components/security/SafePerformanceScript'),
  {
    ssr: false,
    loading: () => null,
  }
);

// 폰트 최적화
const inter = Inter({ 
  subsets: ['latin', 'latin-ext'],
  display: 'swap', // FOIT 방지
  preload: true,
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
  variable: '--font-inter',
});

// 메타데이터 최적화
export const metadata: Metadata = {
  title: {
    default: 'OpenManager - Korean AI Hybrid Engine',
    template: '%s | OpenManager',
  },
  description: 'AI 기반 서버 모니터링 및 관리 시스템 - 실시간 성능 분석과 예측',
  keywords: ['AI', '서버 모니터링', '성능 분석', '한국어 AI', 'OpenManager'],
  authors: [{ name: 'OpenManager Team' }],
  creator: 'OpenManager',
  publisher: 'OpenManager',
  
  // Open Graph 최적화
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://openmanager.dev',
    title: 'OpenManager - Korean AI Hybrid Engine',
    description: 'AI 기반 서버 모니터링 및 관리 시스템',
    siteName: 'OpenManager',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'OpenManager Dashboard',
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'OpenManager - Korean AI Hybrid Engine',
    description: 'AI 기반 서버 모니터링 및 관리 시스템',
    images: ['/images/og-image.png'],
  },
  
  // 성능 최적화
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // 아이콘 최적화
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#3b82f6' },
    ],
  },
  
  // PWA 매니페스트
  manifest: '/manifest.json',
  
  // 언어 및 지역
  alternates: {
    canonical: 'https://openmanager.dev',
    languages: {
      'ko-KR': 'https://openmanager.dev',
      'en-US': 'https://openmanager.dev/en',
    },
  },
};

// 뷰포트 설정 (Next.js 15 방식)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={inter.variable}>
      <head>
        {/* 리소스 힌트 - 성능 최적화 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://api.openmanager.dev" />
        
        {/* 폰트 프리로드 */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />
        
        {/* 중요 이미지 프리로드 */}
        <link
          rel="preload"
          href="/images/hero-bg.webp"
          as="image"
          type="image/webp"
        />
        
        {/* DNS 프리페치 */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//api.openmanager.dev" />
        
        {/* 성능 모니터링을 위한 메타 태그 */}
        <meta name="performance-optimization" content="enabled" />
      </head>
      
      <body className={`${inter.className} antialiased`}>
        {/* Critical Above-the-fold 컴포넌트 */}
        <EmergencyBanner />
        
        {/* Client Providers로 감싸기 */}
        <ClientProviders>
          <AuthTokenHandler />
          <SystemBootstrap />
          <Toaster />
          {children}
        </ClientProviders>
        
        {/* 성능 모니터링 (프로덕션에서만) */}
        {process.env.NODE_ENV === 'production' && <PerformanceMonitor />}
        
        {/* Core Web Vitals 측정 스크립트 */}
        <Script
          id="web-vitals"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Web Vitals 측정 및 전송
              function sendToAnalytics(name, value, id) {
                // Google Analytics 4로 전송
                if (typeof gtag !== 'undefined') {
                  gtag('event', name, {
                    value: Math.round(name === 'CLS' ? value * 1000 : value),
                    custom_parameter_1: id,
                    non_interaction: true,
                  });
                }
                
                // 콘솔 로그 (개발 시 확인용)
                console.log('📊 Web Vital:', name, Math.round(value), 'ms');
              }
              
              // LCP 측정
              new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                sendToAnalytics('LCP', lastEntry.startTime, lastEntry.id);
              }).observe({ entryTypes: ['largest-contentful-paint'] });
              
              // FID 측정
              new PerformanceObserver((entryList) => {
                entryList.getEntries().forEach((entry) => {
                  sendToAnalytics('FID', entry.processingStart - entry.startTime, entry.entryType);
                });
              }).observe({ entryTypes: ['first-input'] });
              
              // CLS 측정
              let clsValue = 0;
              new PerformanceObserver((entryList) => {
                entryList.getEntries().forEach((entry) => {
                  if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    sendToAnalytics('CLS', clsValue, 'cumulative');
                  }
                });
              }).observe({ entryTypes: ['layout-shift'] });
            `,
          }}
        />
        
        {/* Vercel Analytics (프로덕션에서만) */}
        {process.env.NODE_ENV === 'production' && (
          <>
            <Script
              src="https://va.vercel-scripts.com/v1/speed-insights/script.js"
              strategy="afterInteractive"
            />
            <Script
              src="https://va.vercel-scripts.com/v1/analytics/script.js"
              strategy="afterInteractive"
            />
          </>
        )}
        
        {/* CSP 호환 성능 추적 컴포넌트 */}
        <SafePerformanceScript />
      </body>
    </html>
  );
}