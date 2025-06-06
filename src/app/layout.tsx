import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Keep-alive 스케줄러 초기화
import '@/lib/keep-alive-scheduler'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OpenManager Vibe v5 - Korean AI Hybrid Engine',
  description: '세계 최초 한국어 특화 AI 하이브리드 서버 모니터링 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}