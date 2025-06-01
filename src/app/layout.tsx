import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { setupGlobalErrorHandler } from '../lib/error-handler'
import { QueryProvider } from "../components/providers/QueryProvider";
import { AIAgentErrorBoundary } from '../components/providers/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OpenManager V5 - AI 서버 모니터링',
  description: 'AI 기반 서버 모니터링 및 관리 시스템',
  keywords: 'server monitoring, AI, dashboard, analytics',
  authors: [{ name: 'OpenManager Team' }],
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

// 🛡️ 클라이언트 사이드 전역 에러 핸들러 초기화
function ClientErrorHandler() {
  if (typeof window !== 'undefined') {
    // 한 번만 설정되도록 체크
    if (!(window as any).__openManagerErrorHandlerSetup) {
      setupGlobalErrorHandler();
    }
  }
  return null;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
        <AIAgentErrorBoundary maxRetries={3}>
          <QueryProvider>
            <ClientErrorHandler />
            {children}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1f2937',
                  color: '#f9fafb',
                  border: '1px solid #374151',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#f9fafb',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#f9fafb',
                  },
                },
              }}
            />
          </QueryProvider>
        </AIAgentErrorBoundary>
      </body>
    </html>
  )
}
