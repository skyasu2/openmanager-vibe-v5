import type { Metadata } from "next";
import { Noto_Sans_KR } from 'next/font/google';
import "./globals.css";
import { ToastContainer } from "@/components/ui/ToastNotification";

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "OpenManager Vibe v5 - AI 지능형 서버 모니터링",
  description: "AI 기반 지능형 서버 모니터링 시스템 - OpenManager Vibe v5.9.0",
  keywords: ["서버 모니터링", "AI", "서버 관리", "DevOps", "클라우드", "인프라"],
  authors: [{ name: "OpenManager Team" }],
  creator: "OpenManager",
  publisher: "OpenManager",
  robots: "index, follow",
  openGraph: {
    title: "OpenManager Vibe v5 - AI 서버 모니터링",
    description: "AI 기반 지능형 서버 모니터링 및 관리 시스템",
    type: "website",
    locale: "ko_KR",
    siteName: "OpenManager Vibe v5",
    url: "https://openmanager-vibe-v5.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenManager Vibe v5",
    description: "AI 기반 지능형 서버 모니터링 시스템",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1a73e8',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
        
        {/* Font Awesome */}
        {/* Lucide React로 완전 마이그레이션 완료 */}
        
        {/* Google Fonts - moved to local import */}
        
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <title>OpenManager Vibe v5 - AI 지능형 서버 모니터링</title>
        <meta name="description" content="AI 기반 지능형 서버 모니터링 시스템 - OpenManager Vibe v5.9.0" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* OpenGraph 메타 태그 */}
        <meta property="og:title" content="OpenManager Vibe v5 - AI 서버 모니터링" />
        <meta property="og:description" content="AI 기반 지능형 서버 모니터링 및 관리 시스템" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://openmanager-vibe-v5.vercel.app" />
        
        {/* Twitter 카드 */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="OpenManager Vibe v5" />
        <meta name="twitter:description" content="AI 기반 지능형 서버 모니터링 시스템" />
      </head>
      <body className={`${notoSansKR.className} antialiased`}>
        <main>
          {children}
        </main>
        {/* 토스트 알림 컨테이너 */}
        <ToastContainer />
        {/* 토스트 포털 컨테이너 */}
        <div id="toast-portal" />
      </body>
    </html>
  );
}
