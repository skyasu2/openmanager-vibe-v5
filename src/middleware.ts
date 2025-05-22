import { NextRequest, NextResponse } from 'next/server'
import { PerformanceMonitor } from '@/lib/monitoring/performance-monitor'
import { RedisMonitor } from '@/lib/monitoring/redis-monitor'
import { Logger } from '@/lib/monitoring/logger'

// 모니터링 제외 경로
const EXCLUDED_PATHS = [
  '/_next',
  '/favicon.ico',
  '/api/health',
  '/monitoring/ping'
]

export async function middleware(request: NextRequest) {
  // 시작 시간 기록
  const startTime = performance.now()
  
  // 제외 경로 확인
  const { pathname } = request.nextUrl
  const shouldExclude = EXCLUDED_PATHS.some(path => pathname.startsWith(path))
  
  // 모니터링 제외 경로는 바로 처리
  if (shouldExclude) {
    return NextResponse.next()
  }
  
  // API 경로인 경우 요청 카운터 증가
  if (pathname.startsWith('/api')) {
    try {
      const count = await RedisMonitor.incrementRequestCounter()
      
      // 로그 기록
      const logger = Logger.getInstance()
      await logger.debug(`API 요청: ${pathname} (일일 요청 수: ${count})`, {
        path: pathname,
        method: request.method,
        dailyCount: count
      }, 'middleware')
    } catch (error) {
      console.error('Redis 모니터링 오류:', error)
    }
  }
  
  // 요청 처리
  const response = NextResponse.next()
  
  // API 경로인 경우 성능 지표 기록
  if (pathname.startsWith('/api')) {
    try {
      await PerformanceMonitor.trackRequest(request, response, startTime)
    } catch (error) {
      console.error('성능 모니터링 오류:', error)
    }
  }
  
  return response
}

// 미들웨어 설정
export const config = {
  matcher: [
    // 모든 경로에 미들웨어 적용
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
} 