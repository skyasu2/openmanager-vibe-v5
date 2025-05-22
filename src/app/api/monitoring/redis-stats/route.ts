import { NextResponse } from 'next/server'
import { RedisMonitor } from '@/lib/monitoring/redis-monitor'
import { Logger } from '@/lib/monitoring/logger'

export const dynamic = 'force-dynamic'

// Redis 사용량 통계 가져오기
export async function GET() {
  try {
    const logger = Logger.getInstance()
    await logger.info('Redis 사용량 통계 요청', {}, 'api:redis-stats')
    
    const stats = await RedisMonitor.getUsageStats()
    
    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    
    const logger = Logger.getInstance()
    await logger.error(`Redis 사용량 통계 조회 오류: ${errorMessage}`, { error }, 'api:redis-stats')
    
    return NextResponse.json(
      {
        success: false,
        error: 'Redis 사용량 통계를 가져오는 중 오류가 발생했습니다',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}

// 자동 정리 작업 강제 실행
export async function POST() {
  try {
    const logger = Logger.getInstance()
    await logger.info('Redis 자동 정리 작업 요청', {}, 'api:redis-stats')
    
    await RedisMonitor.startCleanup()
    
    // 정리 후 최신 통계 반환
    const stats = await RedisMonitor.getUsageStats()
    
    return NextResponse.json({
      success: true,
      message: 'Redis 자동 정리 작업이 성공적으로 실행되었습니다',
      data: stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    
    const logger = Logger.getInstance()
    await logger.error(`Redis 자동 정리 작업 오류: ${errorMessage}`, { error }, 'api:redis-stats')
    
    return NextResponse.json(
      {
        success: false,
        error: 'Redis 자동 정리 작업 중 오류가 발생했습니다',
        message: errorMessage
      },
      { status: 500 }
    )
  }
} 