import type { Metadata } from "next";
import { Noto_Sans_KR } from 'next/font/google';
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "OpenManager AI - 서버 모니터링 & 관리 솔루션",
  description: "AI 기반 서버 모니터링과 관리를 통합한 최고의 서버 관리 솔루션. 실시간 모니터링, 지능형 알림, 자동화된 관리 기능을 제공합니다.",
  keywords: ["서버 모니터링", "AI", "서버 관리", "DevOps", "클라우드", "인프라"],
  authors: [{ name: "OpenManager Team" }],
  creator: "OpenManager",
  publisher: "OpenManager",
  robots: "index, follow",
  openGraph: {
    title: "OpenManager AI - 서버 모니터링 & 관리 솔루션",
    description: "AI 기반 서버 모니터링과 관리를 통합한 최고의 서버 관리 솔루션",
    type: "website",
    locale: "ko_KR",
    siteName: "OpenManager AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenManager AI - 서버 모니터링 & 관리 솔루션",
    description: "AI 기반 서버 모니터링과 관리를 통합한 최고의 서버 관리 솔루션",
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#1a73e8",
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
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        
        {/* Google Fonts - moved to local import */}
        
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${notoSansKR.className} antialiased`}>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
